import { createClient } from '@supabase/supabase-js';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function jsonError(res, error) {
  return res.status(error.status || 500).json({ error: { message: error.status ? error.message : 'Une erreur est survenue. Réessaie dans un instant.' } });
}
export function method(req, res, allowed) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== allowed) { res.setHeader('Allow', allowed); throw new HttpError(405, 'Méthode non autorisée.'); }
}
export async function authenticate(req) {
  const bearer = req.headers.authorization;
  if (!bearer?.startsWith('Bearer ') || bearer.length > 10000) throw new HttpError(401, 'Connecte-toi pour continuer.');
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key, SUPABASE_SERVICE_ROLE_KEY: service } = process.env;
  if (!url || !key || !service) throw new HttpError(503, 'La plateforme est en cours de configuration.');
  const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) } };
  const db = createClient(url, key, { ...options, global: { ...options.global, headers: { Authorization: bearer } } });
  const { data, error } = await db.auth.getUser(bearer.slice(7));
  if (error || !data.user) throw new HttpError(401, 'Session expirée. Reconnecte-toi.');
  return { db, user: data.user, admin: createClient(url, service, options) };
}
export function parseBody(req) {
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { throw new HttpError(400, 'Requête JSON invalide.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 45000) throw new HttpError(400, 'Requête invalide ou trop longue.');
  return body;
}
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
