import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLibrarySearchHandler } from '../api/library-search.js';
import { buildHalSearchUrl, HAL_LIMITS, normalizeHalRecord, parseHalSearchQuery, safeHalUrl } from '../server/hal-search.js';
import { HAL_DOCUMENT_TYPES } from '../shared/library-scope.js';

const clock = () => new Date('2026-09-12T04:00:00Z');
const raw = overrides => ({
  halId_s: 'hal-01234567', title_s: ['<i>Étude</i> de la recherche'], authFullName_s: ['Marie Dupont'],
  producedDateY_i: 2024, docType_s: 'ART', uri_s: 'https://hal.science/hal-01234567v1',
  fileMain_s: 'https://hal.science/hal-01234567/document', doiId_s: '10.1234/example', language_s: ['fr'], ...overrides
});
const upstream = (docs = [raw()], numFound = docs.length, start = 0) => Response.json({ response: { numFound, start, numFoundExact: true, docs } });
function response() { return { code: 0, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }

test('HAL searches quote literal terms and apply server-owned fields, filters and ordering', () => {
  const search = parseHalSearchQuery({ q: 'éducation OR *:* {!lucene}', discipline: 'education', type: 'THESE', year: '2024', language: 'fr', page: '2' });
  const url = buildHalSearchUrl(search);
  assert.equal(url.origin, 'https://api.archives-ouvertes.fr');
  assert.equal(url.pathname, '/search/');
  assert.equal(url.searchParams.get('q'), 'text:("éducation" AND "OR" AND "\\*\\:\\*" AND "\\{\\!lucene\\}")');
  assert.equal(url.searchParams.get('fq'), 'submitType_s:file AND docType_s:THESE AND producedDateY_i:2024 AND language_s:fr AND domain_s:"1.shs.edu"');
  assert.equal(url.searchParams.get('sort'), 'score desc,producedDateY_i desc,docid asc');
  assert.equal(url.searchParams.get('rows'), '24');
  assert.equal(url.searchParams.get('start'), '24');
  assert.doesNotMatch(url.searchParams.get('fl'), /abstract|fulltext|\*/i);
  const empty = buildHalSearchUrl(parseHalSearchQuery());
  assert.equal(empty.searchParams.get('q'), '*:*');
  assert.equal(empty.searchParams.get('fq'), 'submitType_s:file');
  assert.equal(empty.searchParams.get('sort'), 'submittedDate_tdate desc,docid asc');
  assert.ok(empty.searchParams.get('fl').split(',').includes('language_s'));
});

test('global and named-language searches preserve file scope and echo the selected language', async () => {
  assert.equal(parseHalSearchQuery().language, 'all');
  for (const language of ['all', 'fr', 'en', 'ar']) {
    const search = parseHalSearchQuery({ language });
    const url = buildHalSearchUrl(search);
    const expected = 'submitType_s:file';
    assert.equal(url.searchParams.get('fq'), expected + (language === 'all' ? '' : ` AND language_s:${language}`));
    const res = response();
    await createLibrarySearchHandler(async request => {
      assert.equal(request.searchParams.get('fq'), url.searchParams.get('fq'));
      return upstream();
    }, clock)({ method: 'GET', query: { language } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.language, language);
    assert.equal(res.body.period, 'all');
  }
});

test('recent periods, explicit years and extended types add only the requested archive filters', async () => {
  assert.equal(parseHalSearchQuery().period, 'all');
  const recent = buildHalSearchUrl(parseHalSearchQuery({ period: 'recent', language: 'fr' }));
  assert.equal(recent.searchParams.get('fq'), 'submitType_s:file AND producedDateY_i:[2016 TO 2026] AND language_s:fr');
  for (const type of Object.keys(HAL_DOCUMENT_TYPES)) {
    const url = buildHalSearchUrl(parseHalSearchQuery({ type }));
    assert.equal(url.searchParams.get('fq'), `submitType_s:file AND docType_s:${type}`);
  }
  for (const year of ['1000', '1990', '2015', '2026']) {
    const url = buildHalSearchUrl(parseHalSearchQuery({ year }));
    assert.equal(url.searchParams.get('fq'), `submitType_s:file AND producedDateY_i:${year}`);
  }
  const res = response();
  await createLibrarySearchHandler(async request => {
    assert.equal(request.searchParams.get('fq'), 'submitType_s:file AND docType_s:COMM AND producedDateY_i:2024 AND language_s:ar');
    return upstream();
  }, clock)({ method: 'GET', query: { type: 'COMM', period: 'recent', year: '2024', language: 'ar' } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.period, 'recent'); assert.equal(res.body.language, 'ar');
});

test('invalid inputs and write methods stop before any provider request', async () => {
  let calls = 0;
  const handler = createLibrarySearchHandler(async () => { calls++; throw new Error('must not fetch'); }, clock);
  for (const query of [
    { q: 'x'.repeat(161) }, { q: 'word\nother' }, { q: ['one', 'two'] },
    { discipline: '1.shs.edu OR *:*' }, { type: 'constructor' }, { type: 'OTHER' }, { type: 'COMM OR *:*' }, { year: '0999' }, { year: '2027' },
    { language: 'fr OR *:*' }, { language: 'de' }, { language: 'FR' }, { language: '' }, { language: null }, { language: ['fr', 'en'] },
    { period: 'all OR *:*' }, { period: 'old' }, { period: ['all', 'recent'] }, { period: null }, { period: 'recent', year: '2015' },
    { page: '0' }, { page: '-1' }, { page: '101' }, { page: '1e2' }, { page: ['1', '2'] },
    { pageSize: '10000' }, { url: 'https://untrusted.example' }, { fq: '*:*' }
  ]) {
    const res = response(); await handler({ method: 'GET', query }, res);
    assert.equal(res.code, 400, JSON.stringify(query));
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
  const res = response(); await handler({ method: 'POST', query: {} }, res);
  assert.equal(res.code, 405); assert.equal(res.headers.Allow, 'GET'); assert.equal(calls, 0);
});

test('anonymous results contain only normalized metadata with safe HAL links and public cache headers', async () => {
  let request;
  const fetcher = async (url, init) => {
    request = { url, init };
    return upstream([
      raw({ abstract_s: ['Do not copy abstracts'], fulltext_t: 'Do not copy document text' }),
      raw(),
      raw({ halId_s: 'tel-02591989', uri_s: 'https://hal.inrae.fr/tel-02591989v1', fileMain_s: 'https://hal.inrae.fr/tel-02591989/document' }),
      raw({ halId_s: 'hal-01234568', fileMain_s: 'https://hal.science.untrusted.example/document' })
    ], 219476);
  };
  const res = response();
  await createLibrarySearchHandler(fetcher, clock)({ method: 'GET', query: {} }, res);
  assert.equal(res.code, 200); assert.equal(res.body.records.length, 2);
  assert.deepEqual(res.body.records[0], { id: 'hal-01234567', title: 'Étude de la recherche', authors: ['Marie Dupont'], year: 2024, type: 'ART', sourceUrl: 'https://hal.science/hal-01234567v1', fileUrl: 'https://hal.science/hal-01234567/document', doi: '10.1234/example', languages: ['fr'] });
  assert.equal(res.body.total, 219476); assert.equal(res.body.source, 'HAL'); assert.equal(res.body.language, 'all'); assert.equal(res.body.period, 'all');
  assert.equal(res.body.verifiedAt, '2026-09-12T04:00:00.000Z');
  assert.equal(res.body.pageSize, 24); assert.equal(res.body.hasMore, true); assert.equal(res.body.maxPage, 100);
  assert.match(res.body.limitation, /2 400/);
  assert.match(res.headers['Cache-Control'], /^public,.*s-maxage=300/);
  assert.equal(res.headers['X-Robots-Tag'], 'noindex, nofollow');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(request.init.redirect, 'error'); assert.equal(request.init.method, 'GET');
  assert.ok(request.init.signal instanceof AbortSignal); assert.equal(request.init.headers.Authorization, undefined);
  assert.doesNotMatch(JSON.stringify(res.body), /abstract|fulltext|Do not copy/);
});

test('language metadata is normalized, deduplicated and bounded without trusting HTML or objects', () => {
  assert.deepEqual(normalizeHalRecord(raw({ language_s: ['fr', 'en', 'fr', 'ar', 'fra', 'EN', '<b>de</b>', 'fr OR *:*', null, {}, 123] })).languages, ['fr', 'en', 'ar', 'fra']);
  assert.deepEqual(normalizeHalRecord(raw({ language_s: 'en' })).languages, ['en']);
  for (const language_s of [undefined, null, {}, '<script>', ['e', 'french']]) assert.deepEqual(normalizeHalRecord(raw({ language_s })).languages, []);
  assert.deepEqual(normalizeHalRecord(raw({ language_s: ['fr', 'en', 'ar', 'de', 'es', 'it', 'nl', 'pt', 'ja', 'zh'] })).languages, ['fr', 'en', 'ar', 'de', 'es', 'it', 'nl', 'pt']);
});

test('archive metadata retains older valid publications and labels unknown valid provider types', () => {
  for (const year of [1000, 1900, 2015, 2026]) assert.equal(normalizeHalRecord(raw({ producedDateY_i: year })).year, year);
  for (const type of Object.keys(HAL_DOCUMENT_TYPES)) assert.equal(normalizeHalRecord(raw({ docType_s: type })).type, type);
  const other = normalizeHalRecord(raw({ docType_s: 'OTHER_REPORT' }));
  assert.equal(other.type, 'OTHER'); assert.equal(other.sourceType, 'OTHER_REPORT');
  for (const sourceType of [undefined, '', 'other', 'ART OR *:*', 'TYPE'.repeat(11), {}, ['ART']]) assert.equal(normalizeHalRecord(raw({ docType_s: sourceType })), null);
  for (const year of [999, 2027, 2024.5, '2024']) assert.equal(normalizeHalRecord(raw({ producedDateY_i: year })), null);
});

test('HAL URLs reject credentials, non-HTTPS, unrelated hosts, ports and malformed metadata', () => {
  for (const url of ['http://hal.science/doc', 'javascript:alert(1)', 'https://hal.science@evil.example/doc', 'https://u:p@hal.science/doc', 'https://hal.science:8443/doc', 'https://evilhal.science/doc', 'https://hal.science.evil.example/doc', 'https://hal.science\\@evil.example/doc', 'https://hal.science/line\nbreak']) assert.equal(safeHalUrl(url), null, url);
  for (const url of ['https://hal.science/doc', 'https://shs.hal.science/doc', 'https://tel.archives-ouvertes.fr/doc', 'https://hal.inrae.fr/doc']) assert.equal(safeHalUrl(url), url);
  for (const overrides of [{ fileMain_s: undefined }, { uri_s: undefined }, { title_s: [] }, { authFullName_s: [] }, { producedDateY_i: '2024' }, { producedDateY_i: 999 }, { docType_s: '<script>' }, { halId_s: '<script>' }]) assert.equal(normalizeHalRecord(raw(overrides)), null);
  assert.equal(normalizeHalRecord(raw({ doiId_s: 'javascript:alert(1)' })).doi, '');
});

test('pagination stops at the browsing limit while keeping the actual provider total', async () => {
  const res = response();
  await createLibrarySearchHandler(async url => {
    assert.equal(url.searchParams.get('start'), '2376');
    return upstream([raw()], 219476, 2376);
  }, clock)({ method: 'GET', query: { page: '100', pageSize: '24' } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.total, 219476); assert.equal(res.body.page, 100); assert.equal(res.body.hasMore, false);
  const empty = response();
  await createLibrarySearchHandler(async () => upstream([], 0), clock)({ method: 'GET', query: {} }, empty);
  assert.equal(empty.code, 200); assert.equal(empty.body.total, 0); assert.deepEqual(empty.body.records, []); assert.equal(empty.body.hasMore, false); assert.equal(empty.body.limitation, '');
});

test('upstream errors, incomplete responses and oversized bodies stay safe and uncached', async () => {
  const bad = 'secret-upstream-test';
  const cases = [
    async () => { throw new Error(bad); },
    async () => { throw new DOMException(bad, 'TimeoutError'); },
    async () => new Response(bad, { status: 429 }),
    async () => new Response(bad, { headers: { 'Content-Type': 'application/json' } }),
    async () => Response.json({ response: { numFound: null, docs: [], start: 0 } }),
    async () => Response.json({ response: { numFound: 3, docs: [], start: 0, numFoundExact: false } }),
    async () => Response.json({ responseHeader: { partialResults: true }, response: { numFound: 3, docs: [], start: 0 } }),
    async () => upstream([], 0, 24),
    async () => upstream(Array.from({ length: 25 }, () => raw()), 25),
    async () => new Response('x'.repeat(HAL_LIMITS.responseBytes + 1), { headers: { 'Content-Type': 'application/json' } })
  ];
  for (const fetcher of cases) {
    const res = response(); await createLibrarySearchHandler(fetcher, clock)({ method: 'GET', query: {} }, res);
    assert.equal(res.code, 503); assert.equal(res.body.error.code, 'library_search_unavailable');
    assert.equal(res.headers['Cache-Control'], 'no-store'); assert.doesNotMatch(JSON.stringify(res.body), new RegExp(bad));
  }
});
