import { createSignupService, registerStudent, SignupError, validateSignupRequest } from '../server/signup.js';

export function createSignupHandler(service = createSignupService, env = process.env) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Méthode non autorisée.' } });
    }
    try {
      const values = validateSignupRequest(req, env);
      return res.status(201).json(await registerStudent(values, await service(env)));
    } catch (error) {
      const safe = error instanceof SignupError ? error : new SignupError(503, 'signup_unavailable', 'L’inscription est temporairement indisponible. Réessaie dans un instant.');
      if (safe.retryAfter) res.setHeader('Retry-After', String(safe.retryAfter));
      return res.status(safe.status).json({ error: { code: safe.code, message: safe.message } });
    }
  };
}
export default createSignupHandler();
