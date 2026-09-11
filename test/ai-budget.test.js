import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { aiBudgetConfiguration } from '../server/ai-budget.js';
import { createChatHandler } from '../api/chat.js';

const owner = '10000000-0000-4000-8000-000000000001';
const projectId = '30000000-0000-4000-8000-000000000003';
const request = () => ({ method: 'POST', headers: {}, body: { projectId, module: 'plan', inputs: {} } });
const response = () => ({ setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

async function budgetDatabase() {
  const db = await PGlite.create();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated;`);
  await db.exec(await readFile(new URL('../supabase/ai-budget.sql', import.meta.url), 'utf8'));
  return db;
}

function mockSession({ budgetRpc = async () => ({ data: { allowed: true } }), saveError = false, usageError = false } = {}) {
  const events = [], job = {}, documents = [], rpcCalls = [];
  const admin = {
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      if (name === 'student_reserve_ai_job') return { data: { allowed: true, id: 'job', remaining: 2 } };
      return budgetRpc(args);
    },
    from(table) {
      assert.equal(table, 'student_ai_jobs');
      return { update(update) { return { async eq() {
        events.push({ type: 'job', update });
        if (usageError && Object.hasOwn(update, 'input_tokens')) return { error: new Error('tracking unavailable') };
        Object.assign(job, update); return { error: null };
      } }; } };
    }
  };
  const db = { from(table) {
    const query = {
      select() { return query; }, eq() { return query; }, order() { return query; },
      limit: async () => ({ data: [], error: null }),
      insert(document) { events.push({ type: 'document' }); documents.push(document); return query; },
      single: async () => table === 'student_projects'
        ? { data: { id: projectId, title: 'Mémoire', profile: {}, sources: [] } }
        : saveError ? { error: new Error('save unavailable') } : { data: { id: 'doc', ...documents.at(-1) } }
    };
    return query;
  } };
  return { session: { admin, db, user: { id: owner } }, events, job, rpcCalls, documents };
}

async function withProviderConfig(work) {
  const names = ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'AI_DAILY_BUDGET_USD', 'AI_MONTHLY_BUDGET_USD'];
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    process.env.ANTHROPIC_API_KEY = 'unit-test-provider-key';
    return await work();
  } finally {
    for (const name of names) if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name];
  }
}

test('budget estimates reserve the full output allowance and reject unknown or unbounded configuration', () => {
  const prompt = { system: 'Méthodologie', messages: [{ role: 'user', content: 'بحث علمي' }] };
  const cfg = aiBudgetConfiguration(prompt, {});
  assert.equal(cfg.dailyLimit, 5); assert.equal(cfg.monthlyLimit, 30);
  const bytes = Buffer.byteLength(JSON.stringify(prompt), 'utf8');
  assert.equal(cfg.estimatedUsd, ((bytes + 1024) * 2 + 4096 * 10) / 1_000_000);
  assert.ok(aiBudgetConfiguration(prompt, { ANTHROPIC_MODEL: 'claude-sonnet-4-6' }).estimatedUsd > cfg.estimatedUsd);
  for (const invalid of ['unknown-model', 'claude-sonnet-5-latest', 'constructor']) {
    assert.throws(() => aiBudgetConfiguration(prompt, { ANTHROPIC_MODEL: invalid }), error => error.status === 503);
  }
  for (const name of ['AI_DAILY_BUDGET_USD', 'AI_MONTHLY_BUDGET_USD']) {
    for (const invalid of ['', ' ', '0', '-1', 'Infinity', 'NaN', '1000000']) {
      assert.throws(() => aiBudgetConfiguration(prompt, { [name]: invalid }), error => error.status === 503);
    }
  }
});

test('PostgreSQL budget reservation is server-only and updates both limits atomically', async () => {
  const db = await budgetDatabase();
  try {
    const fn = 'public.student_reserve_ai_budget(numeric,numeric,numeric)';
    for (const role of ['anon', 'authenticated']) {
      assert.equal((await db.query('select has_function_privilege($1,$2,\'EXECUTE\') as allowed', [role, fn])).rows[0].allowed, false);
      assert.equal((await db.query('select has_table_privilege($1,\'public.student_ai_budget\',\'SELECT\') as allowed', [role])).rows[0].allowed, false);
    }
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.student_ai_budget'::regclass")).rows[0].relrowsecurity, true);
    assert.equal((await db.query("select prosecdef from pg_proc where oid=$1::regprocedure", [fn])).rows[0].prosecdef, false);
    await db.exec('set role service_role;');
    const reserve = async (cost, daily, monthly) => (await db.query('select student_reserve_ai_budget($1,$2,$3) as budget', [cost, daily, monthly])).rows[0].budget;
    const results = await Promise.all(Array.from({ length: 12 }, () => reserve(0.1, 1, 3)));
    assert.equal(results.filter(result => result.allowed).length, 10);
    assert.equal((await reserve(0.1, 1, 3)).reason, 'day');
    let rows = (await db.query('select reserved_usd::text as reserved from student_ai_budget')).rows;
    assert.ok(rows.every(row => Number(row.reserved) === 1), 'refused attempts consume neither bucket');
    await db.exec("update student_ai_budget set reserved_usd=0 where bucket like 'day:%';");
    assert.equal((await reserve(0.5, 1, 1)).reason, 'month');
    assert.equal(Number((await db.query("select reserved_usd from student_ai_budget where bucket like 'day:%'")).rows[0].reserved_usd), 0, 'monthly refusal does not consume daily allowance');
    for (const invalid of ['NaN', 'Infinity', '-Infinity', '0', '-1']) await assert.rejects(reserve(invalid, 1, 3), /Invalid AI budget/);
    await db.exec(`reset role;
      create function fail_month_write() returns trigger language plpgsql as $$ begin
        if new.bucket like 'month:%' then raise exception 'Simulated ledger failure'; end if; return new;
      end $$;
      create trigger fail_month before update on student_ai_budget for each row execute function fail_month_write();
      set role service_role;`);
    const before = (await db.query('select bucket,reserved_usd::text from student_ai_budget order by bucket')).rows;
    await assert.rejects(reserve(0.5, 1, 3), /Simulated ledger failure/);
    assert.deepEqual((await db.query('select bucket,reserved_usd::text from student_ai_budget order by bucket')).rows, before, 'a failed ledger write rolls back both bucket updates');
  } finally { await db.close(); }
});

test('budget refusal, unavailable ledger and usage tracking failures fail closed', async () => withProviderConfig(async () => {
  for (const budgetRpc of [
    async () => ({ data: { allowed: false } }),
    async () => ({ error: new Error('private database details') }),
    async () => ({ data: {} }),
    async () => { throw new Error('private database details'); }
  ]) {
    const mock = mockSession({ budgetRpc }); let calls = 0;
    const res = response();
    await createChatHandler(async () => mock.session, async () => { calls++; })(request(), res);
    assert.equal(res.code, 503); assert.equal(calls, 0); assert.equal(mock.job.status, 'failed');
    assert.doesNotMatch(JSON.stringify(res.body), /private database/);
  }
  const mock = mockSession({ usageError: true }); let calls = 0;
  const res = response();
  await createChatHandler(async () => mock.session, async () => { calls++; return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Plan' }], usage: { input_tokens: 10, output_tokens: 20 } }) }; })(request(), res);
  assert.equal(res.code, 503); assert.equal(calls, 1); assert.equal(mock.documents.length, 0);
  assert.equal(mock.job.status, 'failed');
}));

test('provider and document failures retain reserved project spend and known token usage', async () => withProviderConfig(async () => {
  const db = await budgetDatabase();
  try {
    await db.exec('set role service_role;');
    const budgetRpc = async args => ({ data: (await db.query('select student_reserve_ai_budget($1,$2,$3) as budget', [args.p_estimated_usd, args.p_daily_limit, args.p_monthly_limit])).rows[0].budget });
    const failedSave = mockSession({ budgetRpc, saveError: true }); let calls = 0;
    const res = response();
    await createChatHandler(async () => failedSave.session, async () => { calls++; return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Plan' }], usage: { input_tokens: 123, output_tokens: 456 } }) }; })(request(), res);
    assert.equal(res.code, 503); assert.equal(calls, 1);
    assert.deepEqual(failedSave.job, { input_tokens: 123, output_tokens: 456, status: 'failed' });
    assert.equal(failedSave.events[0].type, 'job'); assert.equal(failedSave.events[1].type, 'document');
    const firstReservation = failedSave.rpcCalls.find(call => call.name === 'student_reserve_ai_budget').args.p_estimated_usd;
    for (const row of (await db.query('select reserved_usd from student_ai_budget')).rows) assert.equal(Number(row.reserved_usd), firstReservation);
    const upstreamFailure = mockSession({ budgetRpc }); const res2 = response();
    await createChatHandler(async () => upstreamFailure.session, async () => { calls++; return { ok: false, status: 500 }; })(request(), res2);
    assert.equal(res2.code, 502); assert.equal(calls, 2, 'no automatic paid provider retries');
    assert.equal(upstreamFailure.job.status, 'failed');
    for (const row of (await db.query('select reserved_usd from student_ai_budget')).rows) assert.equal(Number(row.reserved_usd), firstReservation * 2);
  } finally { await db.close(); }
}));
