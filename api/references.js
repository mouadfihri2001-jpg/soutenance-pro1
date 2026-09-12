import { authenticate, HttpError, jsonError, method } from '../server/http.js';
import { documents } from '../content/documents.mjs';
import { halSourceUrl, normalizedDoi, sourceIdentity } from '../shared/source-identity.js';

const PROVIDERS = new Set(['crossref', 'library']);
const QUERY_KEYS = new Set(['q', 'provider', 'fromYear']);
const LIMIT = 10;
const RESPONSE_BYTES = 1048576;
const UNAVAILABLE = 'La recherche bibliographique est temporairement indisponible. Réessaie dans un instant.';
const STOPWORDS = new Set(`a au aux avec ce ces cette dans de des du en et est la le les leur leurs ou par pas pour que qui se ses son sur un une vers d l s t qu the a an and are as at be by for from in into is it its of on or that their these this to with without study studies research approach impact role effect effects etude etudes recherche approche impact role effet effets apport sujet projet memoire these rapport travail quels quelles comment quel quelle entre chez dans selon cas من في على إلى الى عن مع هذا هذه التي الذي و أو او هو هي بين دراسة دور اثر أثر تأثير`.split(/\s+/));
const clean = value => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
const bounded = (value, max = 1200) => clean(value).slice(0, max);
const doiUrl = doi => `https://doi.org/${doi.split('/').map(encodeURIComponent).join('/')}`;
const getYear = value => Number.isInteger(value) && value >= 1000 && value <= 9999 ? value : null;

export function topicTerms(value) {
  const text = typeof value === 'string' ? value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase() : '';
  return [...new Set((text.match(/[\p{L}\p{N}]{2,}/gu) || []).filter(term => !STOPWORDS.has(term)))].slice(0, 40);
}

function metadata(source) {
  return { ...source, missingMetadata: ['authors', 'year', 'journal'].filter(key => !source[key]), excerpt: '' };
}

export function normalizeWork(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const doi = normalizedDoi(item.DOI);
  const title = bounded(Array.isArray(item.title) ? item.title[0] : '');
  if (!doi || !title) return null;
  const authorList = Array.isArray(item.author) ? item.author : [];
  const authors = authorList.slice(0, 50).map(author => {
    if (!author || typeof author !== 'object') return '';
    return [bounded(author.given, 100), bounded(author.family, 100)].filter(Boolean).join(' ') || bounded(author.name, 200);
  }).filter(Boolean).join(', ');
  const dates = [item.published?.['date-parts'], item.issued?.['date-parts']];
  const year = dates.map(parts => getYear(Array.isArray(parts) && Array.isArray(parts[0]) ? parts[0][0] : null)).find(Boolean) || null;
  return metadata({
    id: `doi:${doi.toLowerCase()}`, doi, title, authors, year,
    journal: bounded(Array.isArray(item['container-title']) ? item['container-title'][0] : '', 500),
    url: doiUrl(doi), metadataProvider: 'Crossref', verification: 'provider-metadata'
  });
}

export function normalizeLibraryWork(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || item.provider !== 'HAL') return null;
  const url = halSourceUrl(item.url);
  const title = bounded(item.title);
  if (!url || !title) return null;
  const source = {
    doi: normalizedDoi(item.doi), title, url,
    authors: Array.isArray(item.authors) ? item.authors.slice(0, 50).map(author => bounded(author, 200)).filter(Boolean).join(', ') : '',
    year: getYear(item.year), journal: bounded(item.journal, 500), metadataProvider: 'HAL',
    verification: item.verification === 'provider-file-metadata' ? 'provider-file-metadata' : 'provider-metadata',
    checkedAt: typeof item.checkedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.checkedAt) ? item.checkedAt : null,
    libraryId: new URL(url).pathname.split('/')[1].replace(/v\d+$/, '')
  };
  return metadata({ id: sourceIdentity(source), ...source });
}

export function rankSources(sources, query, fromYear, currentYear) {
  const terms = topicTerms(query);
  if (!terms.length) return [];
  const seen = new Set();
  return sources.map(source => {
    if (!source || (source.year && (source.year < fromYear || source.year > currentYear))) return null;
    const identity = sourceIdentity(source);
    if (!identity || seen.has(identity)) return null;
    seen.add(identity);
    const titleWords = new Set(topicTerms(source.title));
    const keywords = new Set((source.searchKeywords || []).flatMap(topicTerms));
    let titleMatches = 0, keywordMatches = 0;
    for (const term of terms) {
      if (titleWords.has(term)) titleMatches++;
      else if (keywords.has(term)) keywordMatches++;
    }
    // A broad provider match alone is insufficient. Match the actual topic in
    // a title or catalogue keywords, without inferring results from that title.
    if (titleMatches + keywordMatches < Math.min(2, terms.length)) return null;
    return { source, score: titleMatches * 3 + keywordMatches * 2, identity };
  }).filter(Boolean).sort((a, b) => b.score - a.score || (b.source.year || 0) - (a.source.year || 0) || a.identity.localeCompare(b.identity, 'en'))
    .slice(0, LIMIT).map(({ source }) => {
      const { searchKeywords, ...result } = source;
      return result;
    });
}

export function parseReferencesQuery(query = {}, currentYear = new Date().getUTCFullYear()) {
  if (!query || typeof query !== 'object' || Array.isArray(query) || Object.keys(query).some(key => !QUERY_KEYS.has(key))) throw new HttpError(400, 'Paramètres de recherche invalides.');
  const q = typeof query.q === 'string' ? query.q.trim().replace(/\s+/g, ' ') : '';
  if (q.length < 3 || q.length > 250 || /[\u0000-\u001f\u007f]/.test(query.q)) throw new HttpError(400, 'Saisis entre 3 et 250 caractères.');
  const provider = query.provider === undefined ? 'crossref' : query.provider;
  if (!PROVIDERS.has(provider)) throw new HttpError(400, 'Source de recherche invalide.');
  const rawYear = query.fromYear === undefined ? String(currentYear - 10) : query.fromYear;
  if (typeof rawYear !== 'string' || !/^\d{4}$/.test(rawYear) || Number(rawYear) < 1900 || Number(rawYear) > currentYear) throw new HttpError(400, 'Année invalide.');
  return { q, provider, fromYear: Number(rawYear) };
}

async function readPayload(response) {
  if (!response.ok || !/^application\/json\b/i.test(response.headers.get('content-type') || '') || Number(response.headers.get('content-length')) > RESPONSE_BYTES || !response.body) throw new Error('invalid_response');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > RESPONSE_BYTES) { await reader.cancel(); throw new Error('response_too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
  if (!Array.isArray(data.message?.items) || data.message.items.length > 30) throw new Error('invalid_payload');
  return data.message.items;
}

export async function discoverReferences(query, { send = fetch, clock = () => new Date(), catalogue = documents } = {}) {
  const now = clock(), year = now.getUTCFullYear();
  const search = parseReferencesQuery(query, year);
  let candidates;
  if (search.provider === 'library') {
    candidates = catalogue.map(item => {
      const source = normalizeLibraryWork(item);
      return source ? { ...source, searchKeywords: Array.isArray(item.keywords) ? item.keywords : [] } : null;
    });
  } else {
    const url = new URL('https://api.crossref.org/works');
    url.searchParams.set('query.bibliographic', search.q);
    url.searchParams.set('rows', '30');
    url.searchParams.set('filter', `from-pub-date:${search.fromYear}-01-01,until-pub-date:${year}-12-31`);
    try {
      const response = await send(url, {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { Accept: 'application/json', 'User-Agent': 'SoutenancePro/0.2 (+https://soutenancepro.com)' }
      });
      candidates = (await readPayload(response)).map(normalizeWork).filter(Boolean).map(source => ({ ...source, checkedAt: now.toISOString() }));
    } catch { throw new HttpError(502, UNAVAILABLE, 'references_unavailable'); }
  }
  const sources = rankSources(candidates, search.q, search.fromYear, year);
  return {
    sources, provider: search.provider, query: search.q, searchedAt: now.toISOString(),
    ...(sources.length ? {} : { message: 'Aucune référence correspondant à ces mots-clés. Précise le sujet ou essaie l’autre source de recherche.' })
  };
}

export function createReferencesHandler(auth = authenticate, send = fetch, clock = () => new Date(), catalogue = documents) {
  return async function handler(req, res) {
    try {
      method(req, res, 'GET');
      await auth(req);
      return res.status(200).json(await discoverReferences(req.query, { send, clock, catalogue }));
    } catch (error) { return jsonError(res, error); }
  };
}

export default createReferencesHandler();
