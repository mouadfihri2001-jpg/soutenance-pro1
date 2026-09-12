import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSignupHandler } from '../api/signup.js';
import { createSignupService, validateSignupRequest } from '../server/signup.js';

const env = { VERCEL: '1', NODE_ENV: 'production', VERCEL_URL: 'example-preview.vercel.app' };
const email = 'student@example.test', password = 'a-safe-password-123';
const req = (changes = {}) => ({ method: 'POST', headers: { origin: 'https://soutenancepro.com', 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' }, body: { email, password }, ...changes });
const res = () => ({ code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
function fixture({ rate = { allowed: true }, rateError = null, createError = null, thrown = null } = {}) {
  const calls = [];
  const service = () => ({
    hash: value => { calls.push(['hash', value]); return (value.startsWith('ip:') ? 'a' : 'b').repeat(64); },
    admin: {
      rpc: async (...args) => { calls.push(['limit', ...args]); return { data: rate, error: rateError }; },
      auth: { admin: { createUser: async attributes => { calls.push(['create', attributes]); if (thrown) throw thrown; return { data: { user: { id: 'private-user-id' } }, error: createError }; } } }
    }
  });
  return { calls, handler: createSignupHandler(service, env) };
}

test('new signup confirms only the newly created identity, ignores privilege injection and returns no session', async () => {
  const f = fixture(), r = res();
  await f.handler(req({ body: { email: ' STUDENT@example.test ', password, email_confirm: false, role: 'admin', app_metadata: { role: 'admin' } } }), r);
  assert.equal(r.code, 201);
  assert.deepEqual(r.body, { accepted: true });
  assert.equal(r.headers['Cache-Control'], 'no-store');
  assert.deepEqual(f.calls.find(x => x[0] === 'create')[1], { email, password, email_confirm: true, app_metadata: { signup_source: 'soutenance_pro' } });
  assert.deepEqual(f.calls.find(x => x[0] === 'limit').slice(1), ['student_reserve_signup', { p_ip_hash: 'a'.repeat(64), p_email_hash: 'b'.repeat(64) }]);
  assert.doesNotMatch(JSON.stringify(r.body), /private|password|token|student@/);
});

test('untrusted origins, body types, passwords and missing platform IP stop before administrator access', async () => {
  for (const [request, status] of [
    [req({ method: 'GET' }), 405],
    [req({ headers: { ...req().headers, origin: 'https://attacker.test' } }), 403],
    [req({ headers: { ...req().headers, origin: 'https://soutenancepro.com.attacker.test' } }), 403],
    [req({ headers: { ...req().headers, origin: undefined } }), 403],
    [req({ headers: { ...req().headers, 'sec-fetch-site': 'cross-site' } }), 403],
    [req({ headers: { ...req().headers, 'content-type': 'text/plain' } }), 415],
    [req({ headers: { ...req().headers, 'x-forwarded-for': 'forged, 192.0.2.1' } }), 503],
    [req({ headers: { ...req().headers, 'x-forwarded-for': undefined } }), 503],
    [req({ body: '{invalid' }), 400],
    [req({ body: { email: 'no-address', password } }), 400],
    [req({ body: { email, password: 'short' } }), 422],
    [req({ body: { email, password: 'é'.repeat(37) } }), 422],
    [req({ body: { email, password, junk: 'x'.repeat(2100) } }), 400]
  ]) {
    let reached = false;
    const h = createSignupHandler(() => { reached = true; throw new Error(); }, env), r = res();
    await h(request, r); assert.equal(r.code, status); assert.equal(reached, false);
  }
  assert.equal(validateSignupRequest(req({ headers: { ...req().headers, origin: 'https://example-preview.vercel.app', 'x-vercel-forwarded-for': '2001:0db8:0:0:0:0:0:1' } }), env).ip, '[2001:db8::1]');
  assert.throws(() => validateSignupRequest(req({ headers: { ...req().headers, origin: 'https://other-project.vercel.app' } }), env), /formulaire/);
});

test('rate refusal and missing limiter fail closed before user creation', async () => {
  for (const options of [{ rate: { allowed: false, retry_after: 120 } }, { rateError: { message: 'private database details' } }, { rate: null }]) {
    const f = fixture(options), r = res(); await f.handler(req(), r);
    assert.equal(r.code, options.rate?.allowed === false ? 429 : 503);
    assert.equal(f.calls.some(x => x[0] === 'create'), false);
    assert.doesNotMatch(JSON.stringify(r.body), /private|database/);
    if (r.code === 429) assert.equal(r.headers['Retry-After'], '120');
  }
});

test('duplicates never alter an existing account; provider errors are mapped without leaking raw messages', async () => {
  const duplicate = fixture({ createError: { code: 'email_exists' } }), duplicateResponse = res();
  await duplicate.handler(req(), duplicateResponse);
  assert.equal(duplicateResponse.code, 201);
  assert.deepEqual(duplicateResponse.body, { accepted: true });
  assert.equal(duplicate.calls.filter(x => x[0] === 'create').length, 1);
  for (const [options, status, code] of [
    [{ createError: { code: 'weak_password', message: password } }, 422, 'weak_password'],
    [{ createError: { code: 'unexpected_failure', message: 'secret-service-key' } }, 503, 'signup_unavailable'],
    [{ thrown: new Error('secret-service-key') }, 503, 'signup_unavailable']
  ]) {
    const f = fixture(options), r = res(); await f.handler(req(), r);
    assert.equal(r.code, status); assert.equal(r.body.error.code, code);
    assert.equal(f.calls.filter(x => x[0] === 'create').length, 1);
    assert.doesNotMatch(JSON.stringify(r.body), /private user|secret-service|a-safe-password/);
  }
});

test('signup service requires valid server credentials and derives keyed hashes without exposing identifiers', () => {
  assert.throws(() => createSignupService({}), /temporairement/);
  const service = createSignupService({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_fixture', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fixture' });
  assert.match(service.hash(`email:${email}`), /^[a-f0-9]{64}$/);
  assert.notEqual(service.hash(`email:${email}`), service.hash(`ip:${email}`));
});

test('durable signup limiter is service-only, enforces IP/email/global limits and expires old buckets', async () => {
  const db = await PGlite.create();
  const call = (ip, address) => db.query('select public.student_reserve_signup($1,$2) as result', [ip.repeat(64).slice(0,64), address.repeat(64).slice(0,64)]).then(r => r.rows[0].result);
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role; alter default privileges in schema public grant execute on functions to anon,authenticated;');
    await db.exec(await readFile(new URL('../supabase/signup-limits.sql', import.meta.url), 'utf8'));
    for (const role of ['anon', 'authenticated']) {
      assert.equal((await db.query("select has_function_privilege($1,'public.student_reserve_signup(text,text)','EXECUTE') as allowed", [role])).rows[0].allowed, false);
      assert.equal((await db.query("select has_table_privilege($1,'public.student_signup_limits','SELECT') as allowed", [role])).rows[0].allowed, false);
    }
    await db.exec('set role service_role;');
    await assert.rejects(db.query("select public.student_reserve_signup('raw-ip','raw-email')"), /Invalid signup identifiers/);
    for (let i = 0; i < 5; i++) assert.equal((await call('a','b')).allowed, true);
    assert.equal((await call('c','b')).allowed, false, 'email rate limit crosses IP addresses');
    for (let i = 0; i < 101; i++) assert.equal((await call('c','b')).allowed, false);
    assert.equal((await call('d','e')).allowed, true, 'blocked attempts cannot exhaust the global budget');
    await db.exec('delete from public.student_signup_limits;');
    for (let i = 0; i < 10; i++) assert.equal((await call('a', i.toString(16))).allowed, true);
    assert.equal((await call('a','f')).allowed, false, 'IP limit crosses email addresses');
    await db.exec("update public.student_signup_limits set expires_at=now()-interval '1 second';");
    assert.equal((await call('a','f')).allowed, true);
    await db.exec("update public.student_signup_limits set attempts=50 where bucket like 'ip-day:%';");
    assert.equal((await call('a','e')).allowed, false, 'daily IP ceiling persists independently');
    await db.exec("update public.student_signup_limits set attempts=100 where bucket like 'global:%';");
    const rejected = await call('d','e'); assert.equal(rejected.allowed, false); assert.ok(rejected.retry_after > 0);
    const stored = JSON.stringify((await db.query('select bucket from public.student_signup_limits')).rows);
    assert.doesNotMatch(stored, /192\.0\.2|student@/);
  } finally { await db.close(); }
});
