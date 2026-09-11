import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import { inspectConfiguration } from './runtime-config.js';

export class SignupError extends Error {
  constructor(status, code, message, retryAfter) {
    super(message); this.status = status; this.code = code; this.retryAfter = retryAfter;
  }
}

const unavailable = () => new SignupError(503, 'signup_unavailable', 'L’inscription est temporairement indisponible. Réessaie dans un instant.');

export function validateSignupRequest(req, env = process.env) {
  const origin = req.headers?.origin;
  const allowed = new Set(['https://soutenancepro.com', 'https://www.soutenancepro.com', 'https://soutenance-pro1.vercel.app']);
  for (const name of ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    const hostname = env[name];
    if (typeof hostname === 'string' && /^[a-z0-9-]+\.vercel\.app$/i.test(hostname)) allowed.add(`https://${hostname}`);
  }
  if (!env.VERCEL && env.NODE_ENV !== 'production') {
    for (const port of [3000, 4173, 5173]) for (const host of ['localhost', '127.0.0.1']) allowed.add(`http://${host}:${port}`);
  }
  if (typeof origin !== 'string' || !allowed.has(origin) || req.headers?.['sec-fetch-site'] === 'cross-site') {
    throw new SignupError(403, 'invalid_origin', 'Ouvre le formulaire depuis le site Soutenance Pro.');
  }
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers?.['content-type'] || '')) {
    throw new SignupError(415, 'invalid_request', 'Requête invalide.');
  }
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { throw new SignupError(400, 'invalid_request', 'Requête invalide.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 2048) {
    throw new SignupError(400, 'invalid_request', 'Requête invalide.');
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SignupError(400, 'email_address_invalid', 'Vérifie ton adresse email et réessaie.');
  }
  const password = body.password;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new SignupError(422, 'weak_password', 'Choisis un mot de passe de 8 caractères minimum et de 72 octets maximum.');
  }
  // Vercel overwrites this header at its edge. Never trust it on a local server.
  const forwarded = req.headers?.['x-vercel-forwarded-for'] ?? req.headers?.['x-forwarded-for'];
  const ip = env.VERCEL === '1' ? forwarded : req.socket?.remoteAddress;
  if (typeof ip !== 'string' || !isIP(ip.trim())) throw unavailable();
  // Canonicalize IPv6 spelling so a client cannot get multiple buckets for one IP.
  const normalizedIp = isIP(ip.trim()) === 6 ? new URL(`http://[${ip.trim()}]`).hostname : ip.trim();
  return { email, password, ip: normalizedIp };
}

export function createSignupService(env = process.env) {
  const config = inspectConfiguration(env);
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config.authReady || !serviceKey || config.invalid.includes('SUPABASE_SERVICE_ROLE_KEY')) throw unavailable();
  const admin = createClient(config.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) }
  });
  return { admin, hash: value => createHmac('sha256', serviceKey).update(`student-signup-v1:${value}`).digest('hex') };
}

export async function registerStudent({ email, password, ip }, { admin, hash }) {
  const { data: rate, error: rateError } = await admin.rpc('student_reserve_signup', {
    p_ip_hash: hash(`ip:${ip}`), p_email_hash: hash(`email:${email}`)
  });
  if (rateError || !rate || typeof rate.allowed !== 'boolean') throw unavailable();
  if (!rate.allowed) throw new SignupError(429, 'over_request_rate_limit', 'Trop de tentatives. Patiente avant de réessayer.', Math.max(1, Math.min(86400, Number(rate.retry_after) || 3600)));
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { signup_source: 'soutenance_pro' }
  });
  if (error) {
    if (['email_exists', 'user_already_exists'].includes(error.code)) {
      // Match the new-account response. Only the subsequent password login may
      // grant access; the public signup response does not expose this lookup.
      return { accepted: true };
    }
    if (error.code === 'weak_password') throw new SignupError(422, 'weak_password', 'Choisis un mot de passe plus robuste.');
    if (['email_address_invalid', 'validation_failed'].includes(error.code)) throw new SignupError(400, 'email_address_invalid', 'Vérifie ton adresse email et réessaie.');
    if (error.status === 429) throw new SignupError(429, 'over_request_rate_limit', 'Trop de tentatives. Patiente avant de réessayer.', 60);
    throw unavailable();
  }
  if (!data?.user?.id) throw unavailable();
  // Existing accounts are never searched, confirmed, reset or overwritten here.
  // Normal password sign-in in the browser issues the user's own RLS-scoped session.
  return { accepted: true };
}
