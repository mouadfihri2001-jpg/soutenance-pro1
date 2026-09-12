import { authenticate, HttpError, jsonError, method, parseBody, uuid } from '../server/http.js';
import { validateInputs, makePrompt, MODULES } from '../shared/modules.js';
import { normalizeDocumentContent } from '../shared/document-format.js';
import { discoverReferences } from './references.js';
import { isResearchSource } from '../shared/source-identity.js';
import { aiBudgetConfiguration, MAX_OUTPUT_TOKENS, reserveAiBudget } from '../server/ai-budget.js';

export function createChatHandler(auth = authenticate, send = (...args) => fetch(...args), discover = discoverReferences) {
  return async function handler(req, res) {
    let jobId, admin, completed = false;
    try {
      method(req, res, 'POST');
      const session = await auth(req);
      admin = session.admin;
      const body = parseBody(req);
      if (!uuid(body.projectId)) throw new HttpError(400, 'Projet invalide.');
      let inputs;
      try { inputs = validateInputs(body.module, body.inputs); } catch (e) { throw new HttpError(400, e.message); }
      const { data: project, error: projectError } = await session.db.from('student_projects').select('*').eq('id', body.projectId).single();
      if (projectError || !project) throw new HttpError(404, 'Projet introuvable.');
      let planQuery = session.db.from('student_documents').select('content').eq('project_id', body.projectId).eq('module', 'plan');
      if (uuid(project.profile.validatedPlanId)) planQuery = planQuery.eq('id', project.profile.validatedPlanId);
      const { data: plans, error: planError } = await planQuery.order('updated_at', { ascending: false }).limit(1);
      if (planError) throw new HttpError(503, 'Le projet ne peut pas être chargé.');
      let discoveredSources;
      if (body.module === 'references' && !(project.sources || []).some(isResearchSource)) {
        const q = project.title.trim().replace(/\s+/g, ' ').slice(0, 250);
        let found;
        try { found = await discover({ q, provider: 'crossref' }); }
        catch (error) {
          if (error.code !== 'references_unavailable') throw error;
          found = await discover({ q, provider: 'library' });
        }
        if (!found.sources?.length && found.provider !== 'library') found = await discover({ q, provider: 'library' });
        discoveredSources = (found.sources || []).filter(isResearchSource).slice(0, 10);
        if (!discoveredSources.length) throw new HttpError(422, 'Aucune référence pertinente trouvée. Précise les mots-clés dans Sources de recherche ou choisis dans la bibliothèque.', 'references_not_found');
        // Preserve concurrent source edits: do not overwrite a newer project.
        const { data: updated, error: sourceError } = await session.db.from('student_projects')
          .update({ sources: discoveredSources }).eq('id', project.id).eq('updated_at', project.updated_at).select().single();
        if (sourceError || !updated) throw new HttpError(409, 'Ton projet a changé pendant la recherche. Recharge ses sources puis réessaie.', 'project_changed');
        project.sources = updated.sources;
      }
      let prompt;
      try { prompt = makePrompt(body.module, inputs, project, plans?.[0]?.content || ''); } catch (e) { throw new HttpError(400, e.message); }
      if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, 'La génération est temporairement indisponible.');
      const budget = aiBudgetConfiguration(prompt);
      const { data: job, error: quotaError } = await admin.rpc('student_reserve_ai_job', { p_user_id: session.user.id, p_project_id: project.id, p_module: body.module });
      if (quotaError || typeof job?.allowed !== 'boolean') throw new HttpError(503, 'Impossible de vérifier le quota. Réessaie plus tard.');
      if (!job.allowed) throw new HttpError(429, job.reason === 'rate' ? 'Patiente une minute avant une nouvelle génération.' : 'Le quota mensuel de ton offre est atteint.', job.reason === 'rate' ? 'rate_limited' : 'quota_exceeded');
      jobId = job.id;
      await reserveAiBudget(admin, budget);
      const response = await send('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(40000),
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        // Sonnet 5 enables adaptive thinking by default; preserve the synchronous text budget.
        body: JSON.stringify({ model: budget.model, thinking: { type: 'disabled' }, max_tokens: MAX_OUTPUT_TOKENS, ...prompt })
      });
      if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, response.status === 429 ? 'Le service IA est occupé. Réessaie dans un instant.' : 'Le service IA est temporairement indisponible.');
      const data = await response.json();
      // Keep known provider usage even when the generated document cannot be
      // saved. Failing a user's job must not erase already billed token usage.
      const usage = {
        input_tokens: Number.isSafeInteger(data.usage?.input_tokens) && data.usage.input_tokens >= 0 ? data.usage.input_tokens : 0,
        output_tokens: Number.isSafeInteger(data.usage?.output_tokens) && data.usage.output_tokens >= 0 ? data.usage.output_tokens : 0
      };
      const { error: usageError } = await admin.from('student_ai_jobs').update(usage).eq('id', jobId);
      if (usageError) throw new HttpError(503, 'Le résultat n’a pas pu être enregistré. Réessaie plus tard.');
      const content = normalizeDocumentContent(data.content?.filter(x => x.type === 'text').map(x => x.text).join('\n').trim() || '', body.module);
      if (!content) throw new HttpError(502, 'Le service IA a renvoyé une réponse vide.');
      const { data: document, error: saveError } = await session.db.from('student_documents').insert({
        user_id: session.user.id, project_id: project.id, module: body.module,
        title: inputs.chapter || MODULES[body.module].label, content
      }).select().single();
      if (saveError) throw new HttpError(503, 'Le résultat n’a pas pu être enregistré. Réessaie.');
      completed = true;
      await admin.from('student_ai_jobs').update({ status: 'completed' }).eq('id', jobId).then(() => {}, () => {});
      return res.status(200).json({ document, remaining: job.remaining, truncated: data.stop_reason === 'max_tokens', ...(discoveredSources ? { sources: project.sources } : {}) });
    } catch (error) {
      if (jobId && admin && !completed) await admin.from('student_ai_jobs').update({ status: 'failed' }).eq('id', jobId).then(() => {}, () => {});
      if (error.name === 'TimeoutError' || error.name === 'AbortError') error = new HttpError(504, 'La génération a pris trop de temps. Demande une section plus courte.');
      return jsonError(res, error);
    }
  };
}
export default createChatHandler();
