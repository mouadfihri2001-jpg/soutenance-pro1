import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError } from '../server/http.js';
import { documents } from '../content/documents.mjs';
import { createReferencesHandler, discoverReferences, normalizeWork, normalizeLibraryWork, parseReferencesQuery, topicTerms } from '../api/references.js';
import { halSourceUrl, isResearchSource, normalizedDoi, sourceIdentity } from '../shared/source-identity.js';

const clock = () => new Date('2026-09-12T12:00:00Z');
// Provider-shaped fixtures; assertions concern normalization and matching,
// never the bibliographic truth of these deliberately synthetic test records.
const crossref = extra => ({
  DOI: '10.1234/fixture', title: ['<i>Éducation</i> et apprentissage numérique'],
  author: [{ given: 'Marie', family: 'Exemple' }], published: { 'date-parts': [[2024, 5, 1]] },
  'container-title': ['Revue de test'], abstract: '<p>Never use this as a consulted excerpt.</p>', ...extra
});
const hal = extra => ({
  id: 'hal-01234567', url: 'https://hal.science/hal-01234567v2', file: 'https://hal.science/hal-01234567/document',
  provider: 'HAL', verification: 'provider-file-metadata', checkedAt: '2026-09-11',
  title: 'Éducation et apprentissage numérique', authors: ['Marie Exemple'], year: 2025, doi: '', journal: '',
  keywords: ['Pédagogie', 'Classe inversée'], ...extra
});
const upstream = (items = [crossref()]) => Response.json({ status: 'ok', 'message-type': 'work-list', message: { items } });
function response() { return { code: 0, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
const request = query => ({ method: 'GET', headers: { authorization: 'Bearer fixture' }, query });

test('references search requires an authenticated session and rejects unsupported methods before any provider call', async () => {
  let fetched = 0, authCalls = 0;
  const handler = createReferencesHandler(async () => { authCalls++; throw new HttpError(401, 'Connecte-toi.'); }, async () => { fetched++; }, clock);
  const denied = response(); await handler(request({ q: 'éducation numérique' }), denied);
  assert.equal(denied.code, 401); assert.equal(fetched, 0); assert.equal(authCalls, 1);
  const write = response(); await handler({ ...request({ q: 'éducation numérique' }), method: 'POST' }, write);
  assert.equal(write.code, 405); assert.equal(authCalls, 1); assert.equal(fetched, 0);
  assert.equal(write.headers.Allow, 'GET'); assert.equal(denied.headers['Cache-Control'], 'no-store');
});

test('invalid topics, years, provider destinations and repeated query parameters never reach a provider', async () => {
  let fetched = 0;
  const handler = createReferencesHandler(async () => ({}), async () => { fetched++; }, clock);
  for (const query of [
    {}, { q: 'ab' }, { q: 'x'.repeat(251) }, { q: ['éducation', 'numérique'] }, { q: 'éducation\nnumérique' },
    { q: 'éducation', fromYear: '1899' }, { q: 'éducation', fromYear: '2027' }, { q: 'éducation', fromYear: '2020.5' },
    { q: 'éducation', fromYear: '2e3' }, { q: 'éducation', fromYear: 2020 }, { q: 'éducation', fromYear: ['2020'] },
    { q: 'éducation', provider: 'https://evil.example' }, { q: 'éducation', provider: ['library'] },
    { q: 'éducation', url: 'http://127.0.0.1' }, { q: 'éducation', rows: '10000' }
  ]) {
    const res = response(); await handler(request(query), res);
    assert.equal(res.code, 400, JSON.stringify(query));
  }
  assert.equal(fetched, 0);
  assert.deepEqual(parseReferencesQuery({ q: ' éducation   numérique ' }, 2026), { q: 'éducation numérique', provider: 'crossref', fromYear: 2016 });
});

test('Crossref discovery uses a fixed bounded endpoint, preserves metadata and never invents excerpts', async () => {
  let target, init;
  const result = await discoverReferences({ q: 'éducation numérique' }, { clock, send: async (url, options) => { target = url; init = options; return upstream(); } });
  assert.equal(target.origin, 'https://api.crossref.org'); assert.equal(target.pathname, '/works');
  assert.equal(target.searchParams.get('query.bibliographic'), 'éducation numérique'); assert.equal(target.searchParams.get('rows'), '30');
  assert.equal(target.searchParams.get('filter'), 'from-pub-date:2016-01-01,until-pub-date:2026-12-31');
  assert.equal(init.redirect, 'error'); assert.equal(init.method, 'GET'); assert.equal(init.headers.Authorization, undefined);
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(result.provider, 'crossref'); assert.equal(result.searchedAt, clock().toISOString());
  assert.deepEqual(result.sources[0], {
    id: 'doi:10.1234/fixture', doi: '10.1234/fixture', title: 'Éducation et apprentissage numérique', authors: 'Marie Exemple', year: 2024,
    journal: 'Revue de test', url: 'https://doi.org/10.1234/fixture', metadataProvider: 'Crossref', verification: 'provider-metadata',
    missingMetadata: [], excerpt: '', checkedAt: clock().toISOString()
  });
  assert.doesNotMatch(JSON.stringify(result), /Never use|abstract/);
});

test('metadata normalizers reject malformed DOI and HTML-only titles and mark missing values explicitly', () => {
  for (const DOI of ['', 'javascript:alert(1)', 'https://evil.example/10.1234/fixture', '10.1234/', '10.1234/a b', '10.1234/a\\b', '10.1234/<script>', '10.1234/"bad', '10.1234/\u007f']) assert.equal(normalizeWork(crossref({ DOI })), null, DOI);
  assert.equal(normalizeWork(crossref({ title: ['<br>'] })), null);
  assert.equal(normalizeWork(crossref({ title: 'Unexpected title shape' })), null);
  assert.equal(normalizeWork(null), null);
  const missing = normalizeWork(crossref({ author: null, published: { 'date-parts': [['2024']] }, 'container-title': undefined }));
  assert.deepEqual(missing.missingMetadata, ['authors', 'year', 'journal']); assert.equal(missing.year, null); assert.equal(missing.excerpt, '');
  const corporate = normalizeWork(crossref({ author: [{ name: 'Organisation de test' }], DOI: '10.1234/fixture?edition#2' }));
  assert.equal(corporate.authors, 'Organisation de test');
  assert.equal(corporate.url, 'https://doi.org/10.1234/fixture%3Fedition%232');
});

test('topic matching normalizes French and Arabic without filling an empty search with unrelated papers', async () => {
  assert.deepEqual(topicTerms('L’étude de l’ÉDUCATION et du numérique'), ['education', 'numerique']);
  assert.deepEqual(topicTerms('دراسة التَّعَلُّم والتَّعْلِيم'), ['التعلم', 'والتعليم']);
  const fixtures = [
    crossref({ DOI: '10.1234/unrelated', title: ['Chimie des matériaux'] }),
    crossref({ DOI: '10.1234/one-term', title: ['Éducation artistique'] }),
    crossref(), crossref({ DOI: '10.1234/FIXTURE' }),
    crossref({ DOI: '10.1234/future', published: { 'date-parts': [[2027]] } }),
    crossref({ DOI: '10.1234/old', published: { 'date-parts': [[2010]] } })
  ];
  const matched = await discoverReferences({ q: 'L’étude de l’éducation et du numérique' }, { clock, send: async () => upstream(fixtures) });
  assert.equal(matched.sources.length, 1); assert.equal(matched.sources[0].doi, '10.1234/fixture');
  const empty = await discoverReferences({ q: 'Astrophysique quantique' }, { clock, send: async () => upstream(fixtures) });
  assert.deepEqual(empty.sources, []); assert.match(empty.message, /Aucune référence/);
  const arabic = await discoverReferences({ q: 'التعليم الرقمي' }, { clock, send: async () => upstream([crossref({ title: ['منهجية التعليم الرقمي في الجامعة'] })]) });
  assert.equal(arabic.sources.length, 1);
});

test('library discovery searches actual local titles and keywords, accepts HAL records without DOI and makes no network call', async () => {
  let fetched = 0;
  const result = await discoverReferences({ q: 'pédagogie classe inversée', provider: 'library' }, {
    clock, send: async () => { fetched++; throw new Error('not used'); },
    catalogue: [hal(), hal({ url: 'https://evil.example/hal-123', title: 'Pédagogie classe inversée' }), hal({ provider: 'Unknown' }), hal({ id: 'hal-00000001', url: 'https://hal.science/hal-00000001', title: 'Biologie cellulaire', keywords: [] })]
  });
  assert.equal(fetched, 0); assert.equal(result.sources.length, 1);
  const source = result.sources[0];
  assert.equal(source.id, 'hal:hal-01234567'); assert.equal(source.libraryId, 'hal-01234567'); assert.equal(source.doi, '');
  assert.equal(source.url, 'https://hal.science/hal-01234567v2'); assert.equal(source.metadataProvider, 'HAL'); assert.equal(source.checkedAt, '2026-09-11');
  assert.equal(source.verification, 'provider-file-metadata'); assert.equal(source.excerpt, ''); assert.deepEqual(source.missingMetadata, ['journal']);
  assert.equal('searchKeywords' in source, false);
  assert.equal(normalizeLibraryWork(hal({ year: '2024', authors: null })).year, null);
});

test('shared identities accept safe research identifiers while rejecting unsafe destinations and generic HAL pages', () => {
  assert.equal(normalizedDoi(' 10.1234/Fixture '), '10.1234/Fixture');
  assert.equal(sourceIdentity({ doi: '10.1234/Fixture' }), sourceIdentity({ doi: '10.1234/fixture' }));
  assert.equal(sourceIdentity({ url: 'https://hal.science/hal-123v2' }), sourceIdentity({ sourceUrl: 'https://hal.science/hal-123/document' }));
  for (const url of ['https://hal.science/hal-123', 'https://tel.hal.science/tel-123v1', 'https://anses.hal.science/anses-123v1', 'https://hal.inrae.fr/hal-123', 'https://hal.archives-ouvertes.fr/hal-123']) assert.equal(isResearchSource({ url }), true, url);
  for (const url of [
    'javascript:alert(1)', 'http://hal.science/hal-123', 'https://evil.example/hal-123', 'https://hal.science.evil.example/hal-123',
    'https://hal.science@evil.example/hal-123', 'https://user:password@hal.science/hal-123', 'https://hal.science:8443/hal-123',
    'https://hal.science/hal-123?redirect=https://evil.example', 'https://hal.science/hal-123#script', 'https://hal.science/',
    'https://hal.science/about', 'https://hal.science/hal-123\\evil', 'https://hal.science/%2Fhal-123', 'https://hal.science/hal-123\n'
  ]) { assert.equal(halSourceUrl(url), '', url); assert.equal(isResearchSource({ url }), false, url); }
  assert.equal(isResearchSource(null), false); assert.equal(isResearchSource({ id: 'hal-123' }), false);
});

test('results are capped at ten and ordering is stable after relevance and date filtering', async () => {
  const items = Array.from({ length: 30 }, (_, n) => crossref({ DOI: `10.1234/fixture-${String(n).padStart(2, '0')}` }));
  const result = await discoverReferences({ q: 'éducation numérique' }, { clock, send: async () => upstream(items.reverse()) });
  assert.equal(result.sources.length, 10);
  assert.equal(result.sources[0].doi, '10.1234/fixture-00'); assert.equal(result.sources[9].doi, '10.1234/fixture-09');
});

test('provider failures and malformed or oversized payloads become controlled errors without leaking provider data', async () => {
  for (const send of [
    async () => { throw new Error('private-token'); },
    async () => new Response('private-token', { status: 429 }),
    async () => Response.json({ message: { items: {} } }),
    async () => upstream(Array.from({ length: 31 }, () => crossref())),
    async () => new Response('not json', { headers: { 'Content-Type': 'application/json' } }),
    async () => new Response('x'.repeat(1048577), { headers: { 'Content-Type': 'application/json' } })
  ]) {
    const handler = createReferencesHandler(async () => ({}), send, clock);
    const res = response(); await handler(request({ q: 'éducation numérique' }), res);
    assert.equal(res.code, 502); assert.equal(res.body.error.code, 'references_unavailable');
    assert.doesNotMatch(JSON.stringify(res.body), /private-token|not json/);
  }
});


test('the bundled provider snapshot supplies real local deposit records without requiring a DOI or a remote request', async () => {
  const deposited = documents.find(item => !item.doi && item.provider === 'HAL' && item.keywords?.includes('Etude de l’alimentation totale EAT3'));
  assert.ok(deposited, 'Known reviewed HAL catalogue entry is available');
  const result = await discoverReferences({ q: 'EAT3', provider: 'library' }, {
    clock, send: async () => { throw new Error('Local discovery must not fetch'); }
  });
  const source = result.sources.find(item => item.libraryId === deposited.id);
  assert.ok(source); assert.equal(source.title, deposited.title); assert.equal(source.url, deposited.url);
  assert.equal(source.authors, deposited.authors.join(', ')); assert.equal(source.checkedAt, deposited.checkedAt);
  assert.equal(source.doi, ''); assert.equal(source.excerpt, '');
});
