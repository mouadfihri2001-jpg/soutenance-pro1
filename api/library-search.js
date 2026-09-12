import { HalSearchError, searchHal } from '../server/hal-search.js';

export function createLibrarySearchHandler(fetchImpl = fetch, clock = () => new Date()) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Méthode non autorisée.' } });
    }
    try {
      // Anonymous, fixed public provider: no session, key, or database access.
      const result = await searchHal(req.query, fetchImpl, clock);
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof HalSearchError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return res.status(503).json({ error: { code: 'library_search_unavailable', message: 'La recherche HAL est temporairement indisponible. Réessaie dans un instant.' } });
    }
  };
}

export default createLibrarySearchHandler();
