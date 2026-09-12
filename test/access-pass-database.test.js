import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const owner = '71000000-0000-4000-8000-000000000001';
const other = '71000000-0000-4000-8000-000000000002';
const project = '73000000-0000-4000-8000-000000000003';
const campaign = 'september-launch';
// These deliberately fake digests never appear in deployment configuration.
const hashes = { offre: 'a'.repeat(64), max: 'b'.repeat(64) };
const migrations = await Promise.all([
  '001_platform.sql', '002_restrict_student_helpers.sql',
  '20260912175718_student_billing.sql', '20260912190303_student_access_passes.sql'
].map(name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')));

async function database() {
  const db = await PGlite.create();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      alter default privileges in schema public grant execute on functions to anon, authenticated;
    `);
    for (const sql of migrations) {
      assert.ok(sql.trim(), 'every migration must be present before this suite runs');
      await db.exec(sql);
    }
    await db.query('insert into auth.users(id) values ($1),($2)', [owner, other]);
    await db.query('insert into public.student_projects(id,user_id,title) values ($1,$2,$3)', [project, owner, 'Projet de recherche']);
    await db.exec('set role service_role;');
    await db.query("insert into public.student_access_campaigns(id,redeem_until) values ($1,now()+interval '7 days')", [campaign]);
    for (const plan of ['offre', 'max']) {
      await db.query('insert into public.student_access_passes(campaign_id,token_hash,plan) values ($1,$2,$3)', [campaign, hashes[plan], plan]);
    }
    return db;
  } catch (error) { await db.close(); throw error; }
}

const redeem = async (db, user = owner, hash = hashes.offre) => (await db.query(
  'select public.student_redeem_access_pass($1::uuid,$2::text) as result', [user, hash]
)).rows[0].result;
const reserve = async db => (await db.query(
  "select public.student_reserve_ai_job($1::uuid,$2::uuid,'plan') as result", [owner, project]
)).rows[0].result;
const account = async (db, user = owner) => (await db.query(
  'select plan,subscription_period_start,subscription_expires_at from public.student_accounts where user_id=$1', [user]
)).rows[0];
const ledger = async (db, user = owner) => (await db.query(
  'select * from public.student_access_redemptions where user_id=$1 and campaign_id=$2', [user, campaign]
)).rows[0];
const counters = async db => (await db.query(
  'select plan,redemption_count from public.student_access_passes order by plan'
)).rows;
async function seedUser(db, user = randomUUID()) {
  await db.exec('reset role;');
  await db.query('insert into auth.users(id) values ($1)', [user]);
  await db.exec('set role service_role;');
  return user;
}

test('access passes and their redemption RPC are service-only with RLS enabled', async () => {
  const db = await database();
  try {
    await db.exec('reset role;');
    for (const table of ['student_access_campaigns', 'student_access_passes', 'student_access_redemptions']) {
      const qualified = `public.${table}`;
      assert.equal((await db.query('select relrowsecurity from pg_class where oid=$1::regclass', [qualified])).rows[0].relrowsecurity, true);
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        assert.equal((await db.query('select has_table_privilege($1,$2,$3) as allowed', ['service_role', qualified, privilege])).rows[0].allowed, true);
        for (const role of ['anon', 'authenticated']) {
          assert.equal((await db.query('select has_table_privilege($1,$2,$3) as allowed', [role, qualified, privilege])).rows[0].allowed, false);
        }
      }
    }
    const fn = 'public.student_redeem_access_pass(uuid,text)';
    assert.equal((await db.query('select prosecdef from pg_proc where oid=$1::regprocedure', [fn])).rows[0].prosecdef, false, 'the RPC must run with its service caller privileges');
    assert.equal((await db.query("select has_function_privilege('service_role',$1,'EXECUTE') as allowed", [fn])).rows[0].allowed, true);
    assert.equal((await db.query("select count(*)::int as grants from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl where p.oid=$1::regprocedure and acl.grantee=0", [fn])).rows[0].grants, 0);
    for (const role of ['anon', 'authenticated']) {
      assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, fn])).rows[0].allowed, false);
      await db.exec(`set role ${role};`);
      await assert.rejects(redeem(db), /permission denied/);
      await assert.rejects(db.query('select token_hash from public.student_access_passes'), /permission denied/);
      await assert.rejects(db.query('delete from public.student_access_redemptions'), /permission denied/);
      await db.exec('reset role;');
    }
    assert.equal((await account(db)).plan, 'free');
  } finally { await db.close(); }
});

test('each pass starts exactly 30 days with its full 60 or 150 generation allowance', async () => {
  for (const [plan, cap] of [['offre', 60], ['max', 150]]) {
    const db = await database();
    try {
      await db.query(`insert into public.student_ai_jobs(user_id,project_id,module,status,created_at)
        select $1,$2,'plan','completed',now()-interval '1 hour' from generate_series(1,3)`, [owner, project]);
      const result = await redeem(db, owner, hashes[plan]);
      assert.equal(result.status, 'activated');
      assert.equal(result.plan, plan);
      assert.equal(result.active, true);
      assert.equal(new Date(result.expiresAt).getTime() - new Date(result.startsAt).getTime(), 30 * 86400000);
      const granted = await account(db), redeemed = await ledger(db);
      assert.equal(granted.plan, plan);
      assert.equal(granted.subscription_period_start.getTime(), new Date(result.startsAt).getTime());
      assert.equal(granted.subscription_expires_at.getTime(), new Date(result.expiresAt).getTime());
      assert.equal(redeemed.plan, plan);
      assert.equal((await reserve(db)).remaining, cap - 1, 'free use before activation does not consume the pass');
      // Shift the entire test period into the past to exercise quota independently of the minute rate limit.
      await db.query("update public.student_accounts set subscription_period_start=now()-interval '30 minutes' where user_id=$1", [owner]);
      await db.query("update public.student_ai_jobs set status='completed',created_at=now()-interval '10 minutes' where user_id=$1 and created_at>now()-interval '1 minute'", [owner]);
      await db.query(`insert into public.student_ai_jobs(user_id,project_id,module,status,created_at)
        select $1,$2,'plan','completed',now()-interval '10 minutes' from generate_series(1,$3::int)`, [owner, project, cap - 1]);
      assert.deepEqual(await reserve(db), { allowed: false, reason: 'quota' });
    } finally { await db.close(); }
  }
});

test('replay and visiting the other tier preserve the first plan, dates and consumed quota', async () => {
  const db = await database();
  try {
    const first = await redeem(db), originalAccount = await account(db), originalLedger = await ledger(db);
    assert.equal((await reserve(db)).remaining, 59);
    const [same, otherTier] = await Promise.all([redeem(db), redeem(db, owner, hashes.max)]);
    for (const response of [same, otherTier]) {
      assert.equal(response.status, 'already_used');
      assert.equal(response.plan, 'offre');
      assert.equal(response.startsAt, first.startsAt);
      assert.equal(response.expiresAt, first.expiresAt);
      assert.equal(response.active, true);
    }
    assert.deepEqual(await account(db), originalAccount);
    assert.deepEqual(await ledger(db), originalLedger);
    assert.deepEqual(await counters(db), [{ plan: 'max', redemption_count: 0 }, { plan: 'offre', redemption_count: 1 }]);
    assert.equal((await reserve(db)).remaining, 58);
  } finally { await db.close(); }
});

test('expired redemption cannot be refreshed even when the campaign has closed or exhausted its cap', async () => {
  const db = await database();
  try {
    await redeem(db);
    await db.query("update public.student_access_campaigns set enabled=false,redeem_until=now()-interval '1 day' where id=$1", [campaign]);
    await db.query('update public.student_access_passes set redemption_count=max_redemptions');
    await db.query("update public.student_access_redemptions set starts_at=now()-interval '31 days',expires_at=now()-interval '1 day' where user_id=$1", [owner]);
    await db.query(`update public.student_accounts set subscription_period_start=r.starts_at,subscription_expires_at=r.expires_at
      from public.student_access_redemptions r where student_accounts.user_id=r.user_id and r.user_id=$1`, [owner]);
    const before = await account(db), original = await ledger(db);
    for (const hash of Object.values(hashes)) {
      const response = await redeem(db, owner, hash);
      assert.equal(response.status, 'already_used');
      assert.equal(response.active, false);
      assert.equal(response.plan, 'offre');
      assert.equal(new Date(response.startsAt).getTime(), original.starts_at.getTime());
      assert.equal(new Date(response.expiresAt).getTime(), original.expires_at.getTime());
    }
    assert.deepEqual(await account(db), before);
    assert.deepEqual(await ledger(db), original);
  } finally { await db.close(); }
});

test('unknown tokens, expired and disabled campaigns do not grant new access', async () => {
  const db = await database();
  try {
    for (const hash of ['c'.repeat(64), 'not-a-digest', '']) {
      assert.equal((await redeem(db, owner, hash)).status, 'unavailable');
    }
    assert.equal((await redeem(db, randomUUID())).status, 'account_missing');
    await db.query('update public.student_access_campaigns set enabled=false where id=$1', [campaign]);
    assert.equal((await redeem(db)).status, 'unavailable');
    await db.query("update public.student_access_campaigns set enabled=true,redeem_until=now()-interval '1 second' where id=$1", [campaign]);
    assert.equal((await redeem(db)).status, 'unavailable');
    assert.equal(await ledger(db), undefined);
    assert.equal((await account(db)).plan, 'free');
    assert.deepEqual(await counters(db), [{ plan: 'max', redemption_count: 0 }, { plan: 'offre', redemption_count: 0 }]);
  } finally { await db.close(); }
});

test('the hundred-redemption boundary grants only the remaining slot and leaves the other pass independent', async () => {
  const db = await database();
  try {
    const users = [owner, other];
    for (let index = 0; index < 99; index++) users.push(await seedUser(db));
    for (const user of users.slice(0, 99)) assert.equal((await redeem(db, user)).status, 'activated');
    const results = await Promise.all(users.slice(99).map(user => redeem(db, user)));
    assert.equal(results.filter(result => result.status === 'activated').length, 1);
    assert.equal(results.filter(result => result.status === 'unavailable').length, 1);
    assert.equal((await db.query('select count(*)::int as count from public.student_access_redemptions')).rows[0].count, 100);
    const rejected = users[99 + results.findIndex(result => result.status === 'unavailable')];
    assert.equal((await account(db, rejected)).plan, 'free');
    assert.equal((await redeem(db, rejected, hashes.max)).status, 'activated');
    assert.deepEqual(await counters(db), [{ plan: 'max', redemption_count: 1 }, { plan: 'offre', redemption_count: 100 }]);
    assert.equal((await redeem(db, owner)).status, 'already_used', 'a full pass still reports previous activation idempotently');
  } finally { await db.close(); }
});

test('passes preserve existing manual and Stripe subscriptions including canceled Stripe bindings', async () => {
  const db = await database();
  try {
    await db.query("update public.student_accounts set plan='max',subscription_expires_at=now()+interval '10 days' where user_id=$1", [owner]);
    const paid = await account(db);
    assert.equal((await redeem(db)).status, 'existing_subscription');
    assert.deepEqual(await account(db), paid);
    for (const [index, status] of ['active', 'past_due', 'canceled', 'incomplete_expired'].entries()) {
      const user = await seedUser(db);
      await db.query('insert into public.student_billing_accounts(user_id,livemode,subscription_id,subscription_status) values ($1,true,$2,$3)', [user, `sub_Existing${index}`, status]);
      const before = await account(db, user);
      assert.equal((await redeem(db, user)).status, 'existing_subscription');
      assert.deepEqual(await account(db, user), before);
      assert.equal(await ledger(db, user), undefined);
    }
    assert.deepEqual(await counters(db), [{ plan: 'max', redemption_count: 0 }, { plan: 'offre', redemption_count: 0 }]);
    // An expired manual period without any Stripe binding may redeem for the first time.
    await db.query("update public.student_accounts set subscription_expires_at=now()-interval '1 day' where user_id=$1", [owner]);
    assert.equal((await redeem(db)).status, 'activated');
  } finally { await db.close(); }
});

test('ledger and final-counter failures roll back the plan, period and redemption as one transaction', async () => {
  const db = await database();
  try {
    const beforeAccount = await account(db), beforeCounters = await counters(db);
    await db.exec(`reset role;
      create function public.fail_access_ledger() returns trigger language plpgsql as $$ begin
        raise exception 'Simulated access ledger failure';
      end $$;
      create trigger fail_access_ledger before insert on public.student_access_redemptions
        for each row execute function public.fail_access_ledger();
      set role service_role;
    `);
    await assert.rejects(redeem(db), /Simulated access ledger failure/);
    assert.deepEqual(await account(db), beforeAccount);
    assert.deepEqual(await counters(db), beforeCounters);
    assert.equal(await ledger(db), undefined);
    await db.exec(`reset role;
      drop trigger fail_access_ledger on public.student_access_redemptions;
      create function public.fail_access_counter() returns trigger language plpgsql as $$ begin
        raise exception 'Simulated access counter failure';
      end $$;
      create trigger fail_access_counter before update on public.student_access_passes
        for each row execute function public.fail_access_counter();
      set role service_role;
    `);
    await assert.rejects(redeem(db), /Simulated access counter failure/);
    assert.deepEqual(await account(db), beforeAccount, 'the account update before the failed counter write must roll back');
    assert.deepEqual(await counters(db), beforeCounters);
    assert.equal(await ledger(db), undefined, 'the earlier redemption INSERT must roll back as well');
    await db.exec('reset role; drop trigger fail_access_counter on public.student_access_passes; set role service_role;');
    assert.equal((await redeem(db)).status, 'activated', 'the failed attempt must not poison a later valid redemption');
  } finally { await db.close(); }
});
