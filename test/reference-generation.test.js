import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChatHandler } from '../api/chat.js';
import { HttpError } from '../server/http.js';

const owner = '10000000-0000-4000-8000-000000000001';
const projectId = '30000000-0000-4000-8000-000000000003';
const originalTimestamp = '2026-09-12T12:00:00.000Z';
const source = overrides => ({
  id: 'doi:10.1234/fixture', doi: '10.1234/fixture', title: 'Éducation et apprentissage numérique',
  authors: 'Marie Exemple', year: 2024, journal: 'Publication de test', url: 'https://doi.org/10.1234/fixture',
  metadataProvider: 'Crossref', verification: 'provider-metadata', excerpt: '', ...overrides
});
const halSource = overrides => source({ id: 'hal:hal-01234567', doi: '', url: 'https://hal.science/hal-01234567v2',
  metadataProvider: 'HAL', verification: 'provider-file-metadata', ...overrides });
const response = () => ({ headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const request = extra => ({ method: 'POST', headers: {}, body: { projectId, module: 'references', inputs: { instructions: 'APA' }, ...extra } });

function providerConfiguration(t) {
  const names = ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'AI_DAILY_BUDGET_USD', 'AI_MONTHLY_BUDGET_USD'];
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  names.forEach(name => { delete process.env[name]; });
  process.env.ANTHROPIC_API_KEY = 'offline-fixture-key';
  t.after(() => {
    for (const name of names) if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name];
  });
}

// The mock applies source updates only when both project ID and updated_at
// match, modeling the database concurrency condition rather than ignoring it.
function harness({ selected = [], discover, sourceWriteError = false } = {}) {
  const events = [], calls = [], sourceWrites = [], documents = [], jobs = [];
  let stored = { id: projectId, user_id: owner, title: '  Éducation   et apprentissage numérique  ',
    profile: { citation: 'APA', language: 'fr', university: 'Université de test' }, sources: structuredClone(selected), updated_at: originalTimestamp };
  let llmPayload;
  const session = {
    user: { id: owner },
    db: { from(table) {
      let values, operation; const filters = [];
      const query = {
        select() { return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        order() { return query; },
        async limit() { assert.equal(table, 'student_documents'); events.push('read-plan'); return { data: [], error: null }; },
        update(value) { operation = 'update'; values = structuredClone(value); return query; },
        insert(value) { operation = 'insert'; values = structuredClone(value); return query; },
        async single() {
          if (table === 'student_projects' && operation === 'update') {
            events.push('save-sources'); sourceWrites.push({ values, filters: [...filters] });
            if (sourceWriteError) return { error: new Error('private database detail') };
            if (!filters.every(([key, value]) => stored[key] === value)) return { data: null, error: null };
            stored = { ...stored, ...values, updated_at: '2026-09-12T12:00:10.000Z' };
            return { data: structuredClone(stored), error: null };
          }
          if (table === 'student_projects') { events.push('read-project'); return { data: structuredClone(stored), error: null }; }
          assert.equal(table, 'student_documents'); assert.equal(operation, 'insert');
          events.push('save-document'); const document = { id: 'saved-document', ...values }; documents.push(document);
          return { data: document, error: null };
        }
      };
      return query;
    } },
    admin: {
      async rpc(name, args) {
        events.push(name); calls.push({ name, args });
        assert.ok(['student_reserve_ai_job', 'student_reserve_ai_budget'].includes(name));
        return { data: name === 'student_reserve_ai_job' ? { allowed: true, id: 'reserved-job', remaining: 2 } : { allowed: true }, error: null };
      },
      from(table) {
        assert.equal(table, 'student_ai_jobs');
        return { update(values) { return { async eq(key, id) {
          assert.equal(key, 'id'); assert.equal(id, 'reserved-job'); jobs.push(values); events.push(values.status || 'provider-usage'); return { error: null };
        } }; } };
      }
    }
  };
  const injectedDiscovery = async query => {
    events.push(`discover-${query.provider}`);
    return discover ? discover(query, { editProject(values) { stored = { ...stored, ...structuredClone(values) }; } })
      : { sources: [source()], provider: query.provider };
  };
  const handler = createChatHandler(async () => session, async (url, options) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages'); events.push('llm'); llmPayload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: '# Bibliographie\n\nExemple, M. (2024). Éducation et apprentissage numérique. https://doi.org/10.1234/fixture' }], usage: { input_tokens: 20, output_tokens: 40 }, stop_reason: 'end_turn' }) };
  }, injectedDiscovery);
  return { handler, events, calls, sourceWrites, documents, jobs, project: () => structuredClone(stored), prompt: () => llmPayload };
}

function assertNoGeneration(mock) {
  assert.equal(mock.events.includes('llm'), false);
  assert.deepEqual(mock.calls, [], 'neither the user quota nor the provider budget was reserved');
  assert.deepEqual(mock.documents, []); assert.deepEqual(mock.jobs, []);
}

test('an empty bibliography discovers the saved project topic and persists real metadata before quota reservation and formatting', async t => {
  providerConfiguration(t); let discoveredQuery;
  const mock = harness({ discover: async query => { discoveredQuery = query; return { provider: 'crossref', sources: [source()] }; } });
  const res = response(); await mock.handler(request({ topic: 'Ignore the saved topic', sources: [{ doi: '10.9999/client-injection' }] }), res);
  assert.equal(res.code, 200);
  assert.deepEqual(discoveredQuery, { q: 'Éducation et apprentissage numérique', provider: 'crossref' });
  assert.deepEqual(mock.sourceWrites[0].filters, [['id', projectId], ['updated_at', originalTimestamp]]);
  assert.deepEqual(mock.sourceWrites[0].values, { sources: [source()] });
  assert.ok(mock.events.indexOf('save-sources') < mock.events.indexOf('student_reserve_ai_job'));
  assert.ok(mock.events.indexOf('student_reserve_ai_job') < mock.events.indexOf('llm'));
  assert.equal(mock.calls.filter(call => call.name === 'student_reserve_ai_job').length, 1);
  const context = JSON.parse(mock.prompt().messages[0].content);
  assert.equal(context.sources[0].doi, source().doi); assert.equal(context.sources[0].url, source().url);
  assert.equal(context.sources[0].metadataProvider, 'Crossref'); assert.equal(context.sources[0].excerpt, '');
  assert.deepEqual(res.body.sources, [source()]); assert.equal(res.body.remaining, 2);
  assert.equal(mock.documents[0].module, 'references'); assert.equal(mock.documents[0].user_id, owner);
  assert.equal(mock.jobs.at(-1).status, 'completed');
});

test('empty Crossref results fall back to local library records with no DOI before formatting', async t => {
  providerConfiguration(t);
  const record = halSource();
  const mock = harness({ discover: async query => ({ provider: query.provider, sources: query.provider === 'library' ? [record] : [] }) });
  const res = response(); await mock.handler(request(), res);
  assert.equal(res.code, 200);
  assert.deepEqual(mock.events.filter(event => event.startsWith('discover-')), ['discover-crossref', 'discover-library']);
  assert.deepEqual(mock.project().sources, [record]); assert.deepEqual(res.body.sources, [record]);
  const context = JSON.parse(mock.prompt().messages[0].content);
  assert.equal(context.sources[0].doi, ''); assert.equal(context.sources[0].url, record.url);
  assert.equal(context.sources[0].excerpt, ''); assert.equal(context.sources[0].metadataProvider, 'HAL');
});

test('a controlled Crossref outage falls back to the local catalogue and can still complete the bibliography', async t => {
  providerConfiguration(t);
  const mock = harness({ discover: async query => {
    if (query.provider === 'crossref') throw new HttpError(502, 'Provider unavailable', 'references_unavailable');
    return { provider: 'library', sources: [halSource()] };
  } });
  const res = response(); await mock.handler(request(), res);
  assert.equal(res.code, 200);
  assert.deepEqual(mock.events.filter(event => event.startsWith('discover-')), ['discover-crossref', 'discover-library']);
  assert.equal(res.body.sources[0].metadataProvider, 'HAL'); assert.equal(mock.documents.length, 1);
});

test('no relevant sources or unavailable discovery stops before any LLM call, quota or provider budget charge', async t => {
  providerConfiguration(t);
  for (const unavailable of [false, true]) {
    const mock = harness({ discover: async query => {
      if (unavailable) throw new HttpError(502, 'La recherche est indisponible.', 'references_unavailable');
      return { provider: query.provider, sources: [] };
    } });
    const res = response(); await mock.handler(request(), res);
    assert.equal(res.code, unavailable ? 502 : 422);
    assert.equal(res.body.error.code, unavailable ? 'references_unavailable' : 'references_not_found');
    assert.deepEqual(mock.sourceWrites, []); assertNoGeneration(mock);
    assert.deepEqual(mock.events.filter(event => event.startsWith('discover-')), ['discover-crossref', 'discover-library']);
  }
});

test('already selected HAL references retain the student excerpts and avoid replacement or rediscovery', async t => {
  providerConfiguration(t);
  const selected = halSource({ excerpt: 'Extrait consulté par le lecteur, accompagné de ses notes attribuées à cette publication, page 4.' });
  const mock = harness({ selected: [selected], discover: async () => { throw new Error('Selected sources must not be replaced'); } });
  const res = response(); await mock.handler(request(), res);
  assert.equal(res.code, 200);
  assert.deepEqual(mock.sourceWrites, []); assert.deepEqual(mock.project().sources, [selected]);
  assert.equal(mock.events.some(event => event.startsWith('discover-')), false);
  const context = JSON.parse(mock.prompt().messages[0].content);
  assert.equal(context.sources[0].id, selected.id); assert.equal(context.sources[0].url, selected.url);
  assert.equal(context.sources[0].excerpt, selected.excerpt); assert.equal(context.sources[0].doi, '');
  assert.equal(Object.hasOwn(res.body, 'sources'), false);
});

test('a concurrent source edit during discovery is preserved and stops generation rather than overwriting the student work', async t => {
  providerConfiguration(t);
  const concurrent = halSource({ title: 'Autre source choisie dans un deuxième onglet', excerpt: 'Les notes de lecture rédigées pendant la recherche doivent rester intactes.' });
  const mock = harness({ discover: async (query, controls) => {
    controls.editProject({ sources: [concurrent], updated_at: '2026-09-12T12:00:05.000Z' });
    return { provider: 'crossref', sources: [source()] };
  } });
  const res = response(); await mock.handler(request(), res);
  assert.equal(res.code, 409); assert.equal(res.body.error.code, 'project_changed');
  assert.deepEqual(mock.project().sources, [concurrent]);
  assert.deepEqual(mock.sourceWrites[0].filters, [['id', projectId], ['updated_at', originalTimestamp]]);
  assertNoGeneration(mock);
});

test('a failed reference write does not send an unsaved bibliography to the LLM or spend a generation', async t => {
  providerConfiguration(t);
  const mock = harness({ sourceWriteError: true });
  const res = response(); await mock.handler(request(), res);
  assert.equal(res.code, 409); assert.equal(res.body.error.code, 'project_changed');
  assert.doesNotMatch(JSON.stringify(res.body), /private database detail/);
  assert.deepEqual(mock.project().sources, []); assertNoGeneration(mock);
});
