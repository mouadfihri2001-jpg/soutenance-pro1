export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: { message: 'Méthode non autorisée.' } }); }
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY } = process.env;
  const required = { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY };
  // Report names only: private values must never leave the server.
  const missing = Object.keys(required).filter(name => !required[name]?.trim());
  return res.status(200).json({
    ready: missing.length === 0,
    authReady: Boolean(SUPABASE_URL?.trim() && SUPABASE_ANON_KEY?.trim()),
    missing,
    supabaseUrl: SUPABASE_URL?.trim() || '',
    supabaseAnonKey: SUPABASE_ANON_KEY?.trim() || ''
  });
}
