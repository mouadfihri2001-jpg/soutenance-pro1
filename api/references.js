import { authenticate, HttpError, jsonError, method } from '../server/http.js';
export function normalizeWork(item) {
  if (!item.DOI || !/^10\.\d{4,9}\//i.test(item.DOI) || !item.title?.[0]) return null;
  return {
    doi: item.DOI, title: item.title[0], authors: (item.author || []).map(a => [a.given, a.family].filter(Boolean).join(' ')).join(', '),
    year: (item.published?.['date-parts'] || item.issued?.['date-parts'])?.[0]?.[0] || null,
    journal: item['container-title']?.[0] || '', url: `https://doi.org/${item.DOI}`, metadataProvider: 'Crossref', excerpt: ''
  };
}
export default async function handler(req, res) {
  try {
    method(req, res, 'GET');
    await authenticate(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 3 || q.length > 250) throw new HttpError(400, 'Saisis entre 3 et 250 caractères.');
    const year = new Date().getUTCFullYear(), fromYear = Number(req.query.fromYear) || year - 10;
    if (fromYear < 1900 || fromYear > year) throw new HttpError(400, 'Année invalide.');
    const url = new URL('https://api.crossref.org/works');
    url.searchParams.set('query.bibliographic', q); url.searchParams.set('rows', '10');
    url.searchParams.set('filter', `from-pub-date:${fromYear}-01-01`);
    const response = await fetch(url, { headers: { 'User-Agent': 'SoutenanceProAI/0.2' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new HttpError(502, 'La recherche bibliographique est temporairement indisponible.');
    const data = await response.json();
    return res.status(200).json({ sources: (data.message?.items || []).map(normalizeWork).filter(Boolean) });
  } catch (error) { return jsonError(res, error); }
}
