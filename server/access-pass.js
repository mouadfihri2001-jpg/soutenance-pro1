import { createHash } from 'node:crypto';
import { HttpError } from './http.js';

const unavailable = () => new HttpError(503, 'L’activation est momentanément indisponible. Réessaie dans un instant.', 'access_pass_unavailable');
const invalid = () => new HttpError(400, 'Ce lien d’accès est invalide.', 'access_pass_invalid');

export function accessPassHash(token) {
  if (typeof token !== 'string' || token.length !== 64 || !/^[0-9a-f]{64}$/.test(token)) throw invalid();
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

// This is an owner-issued access grant, not a payment verification endpoint.
// Only a digest reaches the database; the browser cannot choose a user or tier.
export async function redeemAccessPass(admin, userId, token) {
  const tokenHash = accessPassHash(token);
  let result;
  try { result = await admin.rpc('student_redeem_access_pass', { p_user_id: userId, p_token_hash: tokenHash }); }
  catch { throw unavailable(); }
  const { data, error } = result || {};
  if (error || !data || typeof data !== 'object') throw unavailable();
  if (data.status === 'unavailable') throw new HttpError(404, 'Ce lien d’accès n’est plus disponible. Contacte Soutenance Pro.', 'access_pass_unavailable');
  if (data.status === 'existing_subscription') throw new HttpError(409, 'Ton compte possède déjà un abonnement. Ton accès actuel est conservé.', 'access_pass_existing_subscription');
  if (data.status === 'account_missing') throw new HttpError(409, 'Ton espace n’est pas encore disponible. Reconnecte-toi.', 'access_pass_account_missing');
  if (!['activated', 'already_used'].includes(data.status) || !['offre', 'max'].includes(data.plan) ||
    !Number.isFinite(Date.parse(data.startsAt)) || !Number.isFinite(Date.parse(data.expiresAt)) ||
    Date.parse(data.expiresAt) <= Date.parse(data.startsAt) || typeof data.active !== 'boolean') throw unavailable();
  return { status: data.status, plan: data.plan, startsAt: data.startsAt, expiresAt: data.expiresAt,
    active: data.active, generations: data.plan === 'offre' ? 60 : 150 };
}
