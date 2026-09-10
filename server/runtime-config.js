// Configuration checks only. JWT decoding here is not signature verification
// and must never be used to authenticate a user or authorize a database query.
function keyRole(raw = '') {
  const key = raw.trim();
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return 'anon';
  if (/^sb_secret_[A-Za-z0-9_-]+$/.test(key)) return 'service_role';
  const parts = key.split('.');
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.role === 'anon' || payload.role === 'service_role' ? payload.role : null;
  } catch { return null; }
}

function validUrl(raw, production) {
  try {
    const url = new URL(raw);
    const local = !production && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return (url.protocol === 'https:' || (local && url.protocol === 'http:')) &&
      !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
  } catch { return false; }
}

export function inspectConfiguration(env = process.env) {
  const names = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'];
  const values = Object.fromEntries(names.map(name => [name, (env[name] || '').trim()]));
  const missing = names.filter(name => !values[name]);
  const invalid = names.filter(name => values[name] && /\s/.test(values[name]));
  const addInvalid = name => { if (values[name] && !invalid.includes(name)) invalid.push(name); };
  if (!validUrl(values.SUPABASE_URL, env.VERCEL_ENV === 'production')) addInvalid('SUPABASE_URL');
  if (keyRole(values.SUPABASE_ANON_KEY) !== 'anon') addInvalid('SUPABASE_ANON_KEY');
  if (keyRole(values.SUPABASE_SERVICE_ROLE_KEY) !== 'service_role') addInvalid('SUPABASE_SERVICE_ROLE_KEY');
  const usable = name => !missing.includes(name) && !invalid.includes(name);
  return {
    ready: missing.length === 0 && invalid.length === 0,
    authReady: usable('SUPABASE_URL') && usable('SUPABASE_ANON_KEY'),
    missing, invalid,
    supabaseUrl: usable('SUPABASE_URL') ? values.SUPABASE_URL : '',
    // Reject a misplaced secret even on Preview, independently of build checks.
    supabaseAnonKey: usable('SUPABASE_ANON_KEY') ? values.SUPABASE_ANON_KEY : ''
  };
}

export function assertProductionConfiguration(env = process.env) {
  if (env.VERCEL_ENV !== 'production') return;
  const config = inspectConfiguration(env);
  if (!config.ready) {
    throw new Error(`Production configuration incomplete. Missing: ${config.missing.join(', ') || 'none'}. Invalid: ${config.invalid.join(', ') || 'none'}. Update these variables for Production in Vercel, then redeploy. No key values are logged.`);
  }
}
