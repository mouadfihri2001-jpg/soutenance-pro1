import { authenticate, HttpError, jsonError, method, parseBody, uuid } from '../server/http.js';
import { validateInputs, makePrompt, MODULES } from '../shared/modules.js';

export function createChatHandler(auth = authenticate, send = (...args) => fetch(...args)) {
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
      let prompt;
      try { prompt = makePrompt(body.module, inputs, project, plans?.[0]?.content || ''); } catch (e) { throw new HttpError(400, e.message); }
      if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, 'La génération est temporairement indisponible.');
      const { data: job, error: quotaError } = await admin.rpc('student_reserve_ai_job', { p_user_id: session.user.id, p_project_id: project.id, p_module: body.module });
      if (quotaError) throw new HttpError(503, 'Impossible de vérifier le quota. Réessaie plus tard.');
      if (!job.allowed) throw new HttpError(429, job.reason === 'rate' ? 'Patiente une minute avant une nouvelle génération.' : 'Le quota mensuel de ton offre est atteint.');
      jobId = job.id;
      const response = await send('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: AbortSignal.timeout(40000),
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        // Sonnet 5 enables adaptive thinking by default; preserve the synchronous text budget.
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5', thinking: { type: 'disabled' }, max_tokens: 4096, ...prompt })
      });
      if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, response.status === 429 ? 'Le service IA est occupé. Réessaie dans un instant.' : 'Le service IA est temporairement indisponible.');
      const data = await response.json();
      const content = data.content?.filter(x => x.type === 'text').map(x => x.text).join('\n').trim();
      if (!content) throw new HttpError(502, 'Le service IA a renvoyé une réponse vide.');
      const { data: document, error: saveError } = await session.db.from('student_documents').insert({
        user_id: session.user.id, project_id: project.id, module: body.module,
        title: inputs.chapter || MODULES[body.module].label, content
      }).select().single();
      if (saveError) throw new HttpError(503, 'Le résultat n’a pas pu être enregistré. Réessaie.');
      completed = true;
      await admin.from('student_ai_jobs').update({ status: 'completed', input_tokens: data.usage?.input_tokens || 0, output_tokens: data.usage?.output_tokens || 0 }).eq('id', jobId).then(() => {}, () => {});
      return res.status(200).json({ document, remaining: job.remaining, truncated: data.stop_reason === 'max_tokens' });
    } catch (error) {
      if (jobId && admin && !completed) await admin.from('student_ai_jobs').update({ status: 'failed' }).eq('id', jobId).then(() => {}, () => {});
      if (error.name === 'TimeoutError' || error.name === 'AbortError') error = new HttpError(504, 'La génération a pris trop de temps. Demande une section plus courte.');
      return jsonError(res, error);
    }
  };
}
export default createChatHandler();
