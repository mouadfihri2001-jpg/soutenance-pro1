import { HAL_DOCUMENT_TYPES, LIBRARY_LANGUAGES, LIBRARY_PERIODS, LIBRARY_SCOPE } from '../shared/library-scope.js';
import { disciplines } from '../content/disciplines.mjs';

// Public bibliographic metadata only; HAL retains the documents and abstracts.
// Query/filter reference: https://api.archives-ouvertes.fr/docs/search
export const HAL_LIMITS = Object.freeze({ ...LIBRARY_SCOPE, timeoutMs: 12000, responseBytes: 524288 });
const HAL_ORIGIN = 'https://api.archives-ouvertes.fr/search/';
const HAL_FIELDS = 'halId_s,title_s,authFullName_s,producedDateY_i,docType_s,uri_s,fileMain_s,doiId_s,language_s';
const SUBJECTS = new Map(disciplines.map(subject => [subject.id, subject.halCode]));
const PARAMETERS = new Set(['q', 'discipline', 'type', 'year', 'language', 'period', 'page', 'pageSize']);
const UNAVAILABLE = 'La recherche HAL est temporairement indisponible. Réessaie dans un instant.';

export class HalSearchError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

function invalid(message = 'Les paramètres de recherche sont invalides.') {
  return new HalSearchError(400, message, 'invalid_library_search');
}

export function parseHalSearchQuery(query = {}) {
  if (!query || typeof query !== 'object' || Array.isArray(query) || Object.keys(query).some(key => !PARAMETERS.has(key))) throw invalid();
  const value = (key, fallback) => {
    if (query[key] === undefined) return fallback;
    if (typeof query[key] !== 'string') throw invalid();
    return query[key];
  };
  const raw = value('q', '');
  if (raw.length > HAL_LIMITS.queryLength || /[\u0000-\u001f\u007f]/.test(raw)) throw invalid('Saisis une recherche de 160 caractères maximum.');
  const q = raw.trim().replace(/\s+/g, ' ');
  const discipline = value('discipline', 'all');
  const type = value('type', 'all');
  const year = value('year', 'all');
  const language = value('language', 'all');
  const period = value('period', 'all');
  const page = value('page', '1');
  if (discipline !== 'all' && !SUBJECTS.has(discipline)) throw invalid('Discipline invalide.');
  if (type !== 'all' && !Object.hasOwn(HAL_DOCUMENT_TYPES, type)) throw invalid('Type de document invalide.');
  if (!LIBRARY_LANGUAGES.includes(language)) throw invalid('Langue invalide.');
  if (!LIBRARY_PERIODS.includes(period)) throw invalid('Période invalide.');
  const firstYear = period === 'recent' ? HAL_LIMITS.minYear : HAL_LIMITS.archiveMinYear;
  if (year !== 'all' && (!/^\d{4}$/.test(year) || Number(year) < firstYear || Number(year) > HAL_LIMITS.maxYear)) throw invalid(`Choisis une année entre ${firstYear} et ${HAL_LIMITS.maxYear}.`);
  if (!/^[1-9]\d{0,2}$/.test(page) || Number(page) > HAL_LIMITS.maxPage) throw invalid('Affine la recherche pour consulter davantage de résultats.');
  if (value('pageSize', String(HAL_LIMITS.pageSize)) !== String(HAL_LIMITS.pageSize)) throw invalid('La recherche affiche 24 résultats par page.');
  return { q, discipline, type, year, language, period, page: Number(page), pageSize: HAL_LIMITS.pageSize };
}

// Each term is a quoted literal: boolean words and Solr local parameters cannot
// alter fields, filters, parser settings, or the fixed upstream destination.
function literal(term) { return `"${term.replace(/[+\-&|!(){}\[\]^"~*?:\\/]/g, '\\$&')}"`; }

export function buildHalSearchUrl(search) {
  const url = new URL(HAL_ORIGIN);
  url.searchParams.set('q', search.q ? `text:(${search.q.split(' ').map(literal).join(' AND ')})` : '*:*');
  const filters = ['submitType_s:file'];
  if (search.type !== 'all') filters.push(`docType_s:${search.type}`);
  if (search.year !== 'all') filters.push(`producedDateY_i:${search.year}`);
  else if (search.period === 'recent') filters.push(`producedDateY_i:[${HAL_LIMITS.minYear} TO ${HAL_LIMITS.maxYear}]`);
  if (search.language !== 'all') filters.push(`language_s:${search.language}`);
  if (search.discipline !== 'all') filters.push(`domain_s:${literal(SUBJECTS.get(search.discipline))}`);
  // fileMain_s is stored but not indexed in HAL; submitType_s:file is its
  // documented filter for deposits with files. Require fileMain_s below too.
  url.searchParams.set('fq', filters.join(' AND '));
  url.searchParams.set('fl', HAL_FIELDS);
  url.searchParams.set('wt', 'json');
  url.searchParams.set('rows', String(HAL_LIMITS.pageSize));
  url.searchParams.set('start', String((search.page - 1) * HAL_LIMITS.pageSize));
  url.searchParams.set('sort', search.q ? 'score desc,producedDateY_i desc,docid asc' : 'submittedDate_tdate desc,docid asc');
  return url;
}

export function safeHalUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    const knownHost = /^(?:[a-z0-9-]+\.)*(?:hal\.science|archives-ouvertes\.fr|ccsd\.cnrs\.fr)$/.test(url.hostname) || url.hostname === 'hal.inrae.fr';
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port && knownHost) return url.href;
  } catch {}
  return null;
}

const clean = value => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';

export function normalizeHalRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.halId_s;
  const title = clean(Array.isArray(raw.title_s) ? raw.title_s[0] : '');
  const authors = Array.isArray(raw.authFullName_s) ? raw.authFullName_s.slice(0, 50).map(clean).filter(author => author && author.length <= 200) : [];
  const languageValues = Array.isArray(raw.language_s) ? raw.language_s : [raw.language_s];
  const languages = [...new Set(languageValues.filter(language => typeof language === 'string' && /^[a-z]{2,3}$/.test(language)))].slice(0, 8);
  const year = raw.producedDateY_i;
  const sourceType = raw.docType_s;
  const sourceUrl = safeHalUrl(raw.uri_s), fileUrl = safeHalUrl(raw.fileMain_s);
  if (typeof id !== 'string' || id.length > 100 || !/^[a-z][a-z0-9-]+-\d+$/.test(id) || !title || title.length > 1200 || !authors.length || !sourceUrl || !fileUrl || typeof sourceType !== 'string' || !/^[A-Z][A-Z_]{0,39}$/.test(sourceType) || !Number.isInteger(year) || year < HAL_LIMITS.archiveMinYear || year > HAL_LIMITS.maxYear) return null;
  const type = Object.hasOwn(HAL_DOCUMENT_TYPES, sourceType) ? sourceType : 'OTHER';
  const doi = typeof raw.doiId_s === 'string' && raw.doiId_s.length <= 256 && /^10\.\d{4,9}\/[^\s<>"\\]+$/.test(raw.doiId_s) ? raw.doiId_s : '';
  return { id, title, authors, year, type, ...(type === 'OTHER' ? { sourceType } : {}), sourceUrl, fileUrl, doi, languages };
}

async function readPayload(response) {
  // Bound decoded bytes as well as record count, even if an upstream response
  // ignores rows/fl. The same abort deadline covers headers and response body.
  if (Number(response.headers.get('content-length')) > HAL_LIMITS.responseBytes) throw new Error('oversized');
  if (!/^application\/json\b/i.test(response.headers.get('content-type') || '')) throw new Error('invalid_format');
  if (!response.body) throw new Error('missing_body');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > HAL_LIMITS.responseBytes) { await reader.cancel(); throw new Error('oversized'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
}

export async function searchHal(query, fetchImpl = fetch, clock = () => new Date()) {
  const search = parseHalSearchQuery(query);
  try {
    const response = await fetchImpl(buildHalSearchUrl(search), {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(HAL_LIMITS.timeoutMs),
      headers: { Accept: 'application/json', 'User-Agent': 'SoutenancePro-Library/1.0 (+https://soutenancepro.com/methode-editoriale)' }
    });
    if (!response.ok) throw new Error('upstream_status');
    const payload = await readPayload(response);
    const { numFound: total, docs, start, numFoundExact } = payload?.response || {};
    if (!Number.isSafeInteger(total) || total < 0 || !Array.isArray(docs) || docs.length > HAL_LIMITS.pageSize || start !== (search.page - 1) * HAL_LIMITS.pageSize || numFoundExact === false || payload?.responseHeader?.partialResults) throw new Error('invalid_payload');
    const seen = new Set();
    const records = docs.map(normalizeHalRecord).filter(record => {
      if (!record || seen.has(record.id)) return false;
      seen.add(record.id); return true;
    });
    const maxPage = Math.min(HAL_LIMITS.maxPage, Math.max(1, Math.ceil(total / HAL_LIMITS.pageSize)));
    return {
      records, total, language: search.language, period: search.period, page: search.page, pageSize: HAL_LIMITS.pageSize,
      hasMore: search.page < maxPage, maxPage,
      limitation: total > HAL_LIMITS.maxPage * HAL_LIMITS.pageSize ? 'Les 2 400 premiers résultats sont consultables. Affine les mots-clés ou les filtres pour poursuivre.' : '',
      source: 'HAL', verifiedAt: clock().toISOString()
    };
  } catch {
    // Provider status codes, response bodies and thrown messages are not public.
    throw new HalSearchError(503, UNAVAILABLE, 'library_search_unavailable');
  }
}
