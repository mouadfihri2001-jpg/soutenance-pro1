import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createAccessPassHandler } from '../api/access-pass.js';
import { accessPassHash, redeemAccessPass } from '../server/access-pass.js';
import { HttpError } from '../server/http.js';

// Public fixture only: no deployment seed or usable pass is stored in the repo.
const TOKEN = '7'.repeat(64);
const USER = '10000000-0000-4000-8000-000000000001';
const grant = { status: 'activated', plan: 'offre', startsAt: '2026-09-12T19:00:00.000Z', expiresAt: '2026-10-12T19:00:00.000Z', active: true };

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
}

function harness({ data = grant, error = null, authError } = {}) {
  const calls = [];
  const admin = { async rpc(name, params) { calls.push({ name, params }); return { data, error }; } };
  const handler = createAccessPassHandler({ auth: async () => { if (authError) throw authError; return { user: { id: USER }, admin }; } });
  return { calls, admin, async request(body = { token: TOKEN }, method = 'POST') {
    const res = response(); await handler({ method, body }, res); return res;
  } };
}

test('an authenticated owner-issued grant hashes the token and binds only the verified user', async () => {
  const h = harness({ data: { ...grant, token_hash: 'never return me', campaign_id: 'private', arbitrary: true } });
  const res = await h.request();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(h.calls, [{ name: 'student_redeem_access_pass', params: {
    p_user_id: USER, p_token_hash: createHash('sha256').update(TOKEN).digest('hex')
  } }]);
  assert.deepEqual(res.body, { ...grant, generations: 60 });
  assert.equal(Object.hasOwn(res.body, 'paid'), false, 'access is never represented as proof of a charge');
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.headers['Referrer-Policy'], 'no-referrer');
  assert.equal(res.headers['X-Robots-Tag'], 'noindex, nofollow, noarchive');
});

test('authentication and exact request shape prevent anonymous grants or browser-chosen entitlements', async () => {
  const denied = harness({ authError: new HttpError(401, 'Session expirée.') });
  assert.equal((await denied.request()).statusCode, 401);
  assert.equal(denied.calls.length, 0);
  const h = harness();
  for (const body of [
    { token: TOKEN, userId: 'somebody-else' }, { token: TOKEN, plan: 'max' },
    { token: TOKEN, grantDays: 365 }, { token: TOKEN, campaign: 'other' },
    { token: TOKEN, paid: true }, { token: TOKEN, generations: 999999 },
    { token: TOKEN, expiresAt: '2099-01-01' }, {}, null, [], 'not json'
  ]) assert.equal((await h.request(body)).statusCode, 400);
  assert.equal((await h.request({ token: TOKEN }, 'GET')).statusCode, 405);
  assert.equal(h.calls.length, 0);
});

test('malformed, short, uppercase and padded tokens never reach the database', async () => {
  const h = harness();
  for (const token of ['', null, 123, {}, '7'.repeat(63), '7'.repeat(65), 'A'.repeat(64), ` ${TOKEN}`, `${TOKEN}\n`, '../token']) {
    const res = await h.request({ token });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error.code, 'access_pass_invalid');
  }
  assert.equal(h.calls.length, 0);
  assert.equal(accessPassHash(TOKEN).length, 64);
});

test('status mapping preserves expired replay and never turns failures into access', async () => {
  for (const [status, code] of [['unavailable', 404], ['existing_subscription', 409], ['account_missing', 409]]) {
    const res = await harness({ data: { status } }).request();
    assert.equal(res.statusCode, code);
    assert.equal(Object.hasOwn(res.body, 'plan'), false);
  }
  const replay = { ...grant, status: 'already_used', plan: 'max', active: false };
  assert.deepEqual((await harness({ data: replay }).request()).body, { ...replay, generations: 150 });
  for (const data of [null, {}, { ...grant, plan: 'free' }, { ...grant, active: undefined },
    { ...grant, startsAt: 'invalid' }, { ...grant, expiresAt: '2020-01-01' }]) {
    assert.equal((await harness({ data }).request()).statusCode, 503);
  }
  const failed = await harness({ error: { message: 'Database token secret private details' } }).request();
  assert.equal(failed.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(failed.body), /secret|private details/);
});

test('unknown pass responses omit the raw token and administrative details', async () => {
  const res = await harness({ data: { status: 'unavailable', token: TOKEN, redemption_count: 100 } }).request();
  assert.equal(res.statusCode, 404);
  assert.doesNotMatch(JSON.stringify(res), new RegExp(TOKEN));
  assert.equal(Object.hasOwn(res.body, 'redemption_count'), false);
  await assert.rejects(redeemAccessPass({ rpc: async () => { throw new Error('network secret'); } }, USER, TOKEN),
    error => error.status === 503 && error.code === 'access_pass_unavailable' && !error.message.includes('secret'));
});
