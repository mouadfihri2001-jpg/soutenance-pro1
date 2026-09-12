import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const owner = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const project = '30000000-0000-4000-8000-000000000003';
const migrations = await Promise.all([
  '001_platform.sql',
  '002_restrict_student_helpers.sql',
  '20260912175718_student_billing.sql'
].map(name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')));

async function database() {
  const db = await PGlite.create();
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
  for (const sql of migrations) await db.exec(sql);
  await db.query('insert into auth.users(id) values ($1), ($2)', [owner, other]);
  await db.query('insert into public.student_projects(id,user_id,title) values ($1,$2,$3)', [project, owner, 'Projet de recherche']);
  await db.exec('set role service_role;');
  return db;
}

const rpc = async (db, name, values, casts) => (await db.query(
  `select public.${name}(${values.map((_, i) => `$${i + 1}${casts?.[i] ? `::${casts[i]}` : ''}`).join(',')}) as result`, values
)).rows[0].result;
const lock = (db, user = owner, token = randomUUID(), mode = true) => rpc(db, 'student_billing_lock', [user, mode, token]);
const release = (db, token, user = owner) => rpc(db, 'student_billing_release', [user, token]);
const save = (db, token, change, user = owner) => rpc(db, 'student_billing_save', [user, token, JSON.stringify(change)], ['uuid', 'uuid', 'jsonb']);
const reserve = db => rpc(db, 'student_reserve_ai_job', [owner, project, 'plan']);
const account = async db => (await db.query('select plan,subscription_expires_at,subscription_period_start from public.student_accounts where user_id=$1', [owner])).rows[0];
const billingAccount = async db => (await db.query('select * from public.student_billing_accounts where user_id=$1', [owner])).rows[0];

async function checkout(db, { user = owner, plan = 'offre', customer = 'cus_Owner', mode = true } = {}) {
  const token = randomUUID(), attempt = randomUUID();
  assert.equal((await lock(db, user, token, mode)).acquired, true);
  await save(db, token, { kind: 'customer', customerId: customer }, user);
  await save(db, token, { kind: 'attempt', attemptId: attempt, plan }, user);
  await save(db, token, { kind: 'session', attemptId: attempt, sessionId: `cs_${mode ? 'live' : 'test'}_${customer}`, url: `https://checkout.stripe.com/c/pay/${customer}` }, user);
  return { token, attempt, user, plan };
}

async function paidChange(db, attempt, changes = {}) {
  const { start, end } = (await db.query("select (now()-interval '2 hours')::text as start, (now()+interval '30 days'-interval '2 hours')::text as end")).rows[0];
  return { kind: 'subscription', subscriptionId: 'sub_Owner', attemptId: attempt, plan: 'offre', status: 'active', periodStart: start, paidUntil: end, invoiceId: 'in_First', eventId: 'evt_First', ...changes };
}

test('billing tables and RPCs are service-only, and browser roles cannot change plan or reserve jobs', async () => {
  const db = await database();
  try {
    await db.exec('reset role;');
    const functions = [
      'public.student_billing_lock(uuid,boolean,uuid)',
      'public.student_billing_release(uuid,uuid)',
      'public.student_billing_save(uuid,uuid,jsonb)',
      'public.student_reserve_ai_job(uuid,uuid,text)'
    ];
    for (const table of ['student_billing_accounts', 'student_billing_attempts', 'student_billing_events']) {
      assert.equal((await db.query('select relrowsecurity from pg_class where oid=$1::regclass', [`public.${table}`])).rows[0].relrowsecurity, true);
      assert.equal((await db.query("select has_table_privilege('service_role',$1,'SELECT,INSERT,UPDATE,DELETE') as allowed", [`public.${table}`])).rows[0].allowed, true);
      for (const role of ['anon', 'authenticated']) {
        for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
          assert.equal((await db.query('select has_table_privilege($1,$2,$3) as allowed', [role, `public.${table}`, privilege])).rows[0].allowed, false);
        }
      }
    }
    for (const fn of functions) {
      for (const role of ['anon', 'authenticated']) {
        assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, fn])).rows[0].allowed, false);
      }
      assert.equal((await db.query("select count(*)::integer as grants from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl where p.oid=$1::regprocedure and acl.grantee=0", [fn])).rows[0].grants, 0, 'PUBLIC receives no implicit execute grant');
    }
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role};`);
      await assert.rejects(lock(db), /permission denied/);
      await assert.rejects(release(db, randomUUID()), /permission denied/);
      await assert.rejects(save(db, randomUUID(), { kind: 'subscription', plan: 'max' }), /permission denied/);
      await assert.rejects(reserve(db), /permission denied/);
      await assert.rejects(db.query('select * from public.student_billing_accounts'), /permission denied/);
      await assert.rejects(db.query("update public.student_accounts set plan='max',subscription_expires_at=now()+interval '1 year' where user_id=$1", [owner]), /permission denied/);
      await db.exec('reset role;');
    }
    assert.equal((await account(db)).plan, 'free');
  } finally { await db.close(); }
});

test('billing leases admit one caller, fence old tokens and reject a different Stripe mode', async () => {
  const db = await database();
  try {
    const tokens = Array.from({ length: 8 }, () => randomUUID());
    const results = await Promise.all(tokens.map(token => lock(db, owner, token)));
    assert.equal(results.filter(result => result.acquired).length, 1);
    const winner = tokens[results.findIndex(result => result.acquired)], wrong = randomUUID();
    await assert.rejects(save(db, wrong, { kind: 'customer', customerId: 'cus_Forged' }), /Billing lease expired/);
    assert.equal(await release(db, wrong), false);
    await assert.rejects(lock(db, owner, randomUUID(), false), /Billing mode mismatch/);
    await db.query("update public.student_billing_accounts set lock_until=clock_timestamp()-interval '1 second' where user_id=$1", [owner]);
    await assert.rejects(save(db, winner, { kind: 'customer', customerId: 'cus_Expired' }), /Billing lease expired/);
    const successor = randomUUID();
    assert.equal((await lock(db, owner, successor)).acquired, true);
    await assert.rejects(save(db, winner, { kind: 'customer', customerId: 'cus_Stale' }), /Billing lease expired/);
    assert.equal(await release(db, winner), false, 'an expired worker cannot release its successor');
    await save(db, successor, { kind: 'customer', customerId: 'cus_Current' });
    assert.equal((await billingAccount(db)).customer_id, 'cus_Current');
    assert.equal(await release(db, successor), true);
  } finally { await db.close(); }
});

test('customers are immutable and checkout attempts and sessions stay bound to one owner', async () => {
  const db = await database();
  try {
    const token = randomUUID();
    await lock(db, owner, token);
    await assert.rejects(save(db, token, { kind: 'attempt', attemptId: randomUUID(), plan: 'offre' }), /Invalid checkout attempt/);
    await save(db, token, { kind: 'customer', customerId: 'cus_Owner' });
    await save(db, token, { kind: 'customer', customerId: 'cus_Owner' });
    await assert.rejects(save(db, token, { kind: 'customer', customerId: 'cus_Other' }), /Customer binding mismatch/);
    const attempt = randomUUID();
    await save(db, token, { kind: 'attempt', attemptId: attempt, plan: 'offre' });
    await assert.rejects(save(db, token, { kind: 'attempt', attemptId: randomUUID(), plan: 'max' }), /Checkout already pending/);
    const otherCheckout = await checkout(db, { user: other, customer: 'cus_Other' });
    for (const change of [
      { attemptId: otherCheckout.attempt, sessionId: 'cs_live_Owner', url: 'https://checkout.stripe.com/c/pay/owner' },
      { attemptId: attempt, sessionId: 'cs_live_Owner', url: 'https://checkout.stripe.com.evil.test/pay' },
      { attemptId: attempt, sessionId: 'invalid', url: 'https://checkout.stripe.com/c/pay/owner' }
    ]) await assert.rejects(save(db, token, { kind: 'session', ...change }), /Session binding mismatch/);
    const session = { kind: 'session', attemptId: attempt, sessionId: 'cs_live_Owner', url: 'https://checkout.stripe.com/c/pay/owner' };
    await save(db, token, session);
    await save(db, token, session);
    await assert.rejects(save(db, token, { ...session, sessionId: 'cs_live_Replacement' }), /Session binding mismatch/);
    await db.query("update public.student_billing_attempts set expires_at=now()-interval '1 second' where id=$1", [attempt]);
    const next = await save(db, token, { kind: 'attempt', attemptId: randomUUID(), plan: 'max' });
    assert.equal(next.plan, 'max');
    assert.equal((await billingAccount(db)).attempt_id, next.id);
  } finally { await db.close(); }
});

test('first subscription binding requires an owned persisted session matching plan and Stripe mode', async () => {
  const db = await database();
  try {
    const own = await checkout(db);
    const foreign = await checkout(db, { user: other, customer: 'cus_Other', plan: 'max' });
    const paid = await paidChange(db, own.attempt);
    for (const change of [
      { attemptId: randomUUID() },
      { attemptId: foreign.attempt },
      { attemptId: own.attempt, plan: 'max' }
    ]) await assert.rejects(save(db, own.token, { ...paid, ...change }), /Checkout binding missing/);
    await db.query('update public.student_billing_attempts set session_id=null where id=$1', [own.attempt]);
    await assert.rejects(save(db, own.token, paid), /Checkout binding missing/);
    await db.query("update public.student_billing_attempts set session_id='cs_live_Owner',livemode=false where id=$1", [own.attempt]);
    await assert.rejects(save(db, own.token, paid), /Checkout binding missing/);
    await db.query('update public.student_billing_attempts set livemode=true where id=$1', [own.attempt]);
    await save(db, own.token, { ...paid, paidUntil: undefined, eventId: 'evt_Unpaid' });
    assert.equal((await account(db)).plan, 'free', 'a checkout or active subscription alone proves no paid period');
    await assert.rejects(save(db, own.token, { ...paid, subscriptionId: 'sub_Replacement' }), /Subscription already bound/);
    await save(db, own.token, paid);
    assert.equal((await account(db)).plan, 'offre');
  } finally { await db.close(); }
});

test('only a valid paid monthly invoice grants allowance; duplicate and older invoices cannot reset it', async () => {
  const db = await database();
  try {
    const own = await checkout(db), paid = await paidChange(db, own.attempt);
    for (const changes of [
      { invoiceId: undefined },
      { periodStart: undefined },
      { status: 'past_due' },
      { periodStart: new Date(Date.now() + 3_600_000).toISOString() },
      { paidUntil: new Date(Date.now() + 365 * 86_400_000).toISOString() },
      { paidUntil: new Date(Date.now() - 86_400_000).toISOString() }
    ]) await assert.rejects(save(db, own.token, { ...paid, ...changes }), /Invalid paid invoice period/);
    assert.equal((await account(db)).plan, 'free');
    await save(db, own.token, paid);
    const entitled = await account(db);
    assert.equal(entitled.plan, 'offre');
    assert.equal(new Date(entitled.subscription_expires_at).getTime(), new Date(paid.paidUntil).getTime());
    assert.equal(new Date(entitled.subscription_period_start).getTime(), new Date(paid.periodStart).getTime());
    assert.equal((await reserve(db)).remaining, 59, 'Essentiel grants 60 generations');
    await save(db, own.token, { ...paid, plan: 'max' });
    assert.deepEqual(await account(db), entitled, 'a duplicate event cannot upgrade or reset the allowance');
    assert.equal((await reserve(db)).remaining, 58);
    const older = await paidChange(db, own.attempt, {
      periodStart: new Date(new Date(paid.periodStart).getTime() - 86_400_000).toISOString(),
      paidUntil: new Date(new Date(paid.paidUntil).getTime() - 86_400_000).toISOString(),
      invoiceId: 'in_Older', eventId: 'evt_Older'
    });
    await save(db, own.token, older);
    assert.deepEqual(await account(db), entitled, 'out-of-order invoices cannot move the paid boundary backwards');
    assert.equal((await db.query('select count(*)::integer as count from public.student_billing_events')).rows[0].count, 2);
    await save(db, own.token, { ...paid, paidUntil: undefined, status: 'past_due', eventId: 'evt_RenewalFailed' });
    assert.deepEqual(await account(db), entitled, 'failed renewal grants no next period and preserves only the already paid period');
    await save(db, own.token, { ...paid, paidUntil: undefined, status: 'canceled', eventId: 'evt_Canceled' });
    assert.deepEqual(await account(db), { plan: 'free', subscription_expires_at: null, subscription_period_start: null });
    assert.equal((await billingAccount(db)).subscription_status, 'canceled');
  } finally { await db.close(); }
});

test('event-ledger failure rolls back subscription binding and paid entitlement together', async () => {
  const db = await database();
  try {
    const own = await checkout(db), paid = await paidChange(db, own.attempt);
    const beforeAccount = await account(db), beforeBilling = await billingAccount(db);
    await db.exec(`reset role;
      create function public.fail_billing_event() returns trigger language plpgsql as $$ begin
        raise exception 'Simulated event ledger failure';
      end $$;
      create trigger fail_billing_event before insert on public.student_billing_events
        for each row execute function public.fail_billing_event();
      set role service_role;
    `);
    await assert.rejects(save(db, own.token, paid), /Simulated event ledger failure/);
    assert.deepEqual(await account(db), beforeAccount);
    assert.deepEqual(await billingAccount(db), beforeBilling);
    assert.equal((await db.query('select count(*)::integer as count from public.student_billing_events')).rows[0].count, 0);
  } finally { await db.close(); }
});

test('paid quotas count the paid billing cycle, preserve same-cycle use and enforce both plan limits', async () => {
  const db = await database();
  try {
    const own = await checkout(db), paid = await paidChange(db, own.attempt);
    await db.query(`insert into public.student_ai_jobs(user_id,project_id,module,status,created_at)
      select $1,$2,'plan','completed',now()-interval '3 hours' from generate_series(1,3)`, [owner, project]);
    await save(db, own.token, paid);
    assert.equal((await reserve(db)).remaining, 59, 'free usage from before purchase does not consume paid allowance');
    await db.query("update public.student_ai_jobs set created_at=now()-interval '10 minutes' where created_at>now()-interval '1 minute'");
    await save(db, own.token, { ...paid, eventId: 'evt_SameInvoiceAgain' });
    assert.equal((await reserve(db)).remaining, 58, 'reconciling the same invoice never resets successful generations');
    await db.query(`insert into public.student_ai_jobs(user_id,project_id,module,status,created_at)
      select $1,$2,'plan','completed',now()-interval '10 minutes' from generate_series(1,58)`, [owner, project]);
    assert.deepEqual(await reserve(db), { allowed: false, reason: 'quota' });
    await db.query("update public.student_ai_jobs set status='failed' where id=(select id from public.student_ai_jobs where user_id=$1 and created_at>=now()-interval '2 hours' limit 1)", [owner]);
    assert.equal((await reserve(db)).remaining, 0, 'a failed generation refunds one slot');
    await db.query("update public.student_ai_jobs set created_at=now()-interval '10 minutes' where created_at>now()-interval '1 minute'");
    await save(db, own.token, { ...paid, plan: 'max', invoiceId: 'in_Upgrade', eventId: 'evt_Upgrade' });
    assert.equal((await account(db)).plan, 'max');
    assert.equal((await reserve(db)).remaining, 89, 'Signature allows 150 and retains 60 already used in the same cycle');
    await db.query(`insert into public.student_ai_jobs(user_id,project_id,module,status,created_at)
      select $1,$2,'plan','completed',now()-interval '10 minutes' from generate_series(1,89)`, [owner, project]);
    assert.deepEqual(await reserve(db), { allowed: false, reason: 'quota' });
  } finally { await db.close(); }
});

test('a paid renewal starts a fresh quota only when its new invoice is confirmed', async () => {
  const db = await database();
  try {
    const own = await checkout(db), paid = await paidChange(db, own.attempt);
    await save(db, own.token, { ...paid, paidUntil: undefined, eventId: 'evt_InitialBinding' });
    // Persist an expired paid month and its exhausted allowance as historical data.
    await db.query(`update public.student_billing_accounts set
      period_start=now()-interval '30 days 2 hours', paid_until=now()-interval '2 hours',
      paid_plan='offre', invoice_id='in_PreviousMonth' where user_id=$1`, [owner]);
    await db.query(`update public.student_accounts a set plan='offre',
      subscription_period_start=b.period_start, subscription_expires_at=b.paid_until
      from public.student_billing_accounts b where a.user_id=b.user_id and a.user_id=$1`, [owner]);
    await db.query(`insert into public.student_ai_jobs(user_id,project_id,module,status,created_at)
      select $1,$2,'plan','completed',now()-interval '3 hours' from generate_series(1,60)`, [owner, project]);
    const expired = await account(db);
    await save(db, own.token, { ...paid, paidUntil: undefined, status: 'past_due', eventId: 'evt_UnpaidRenewal' });
    const unpaid = await account(db);
    assert.equal(unpaid.plan, 'free');
    assert.deepEqual(unpaid.subscription_expires_at, expired.subscription_expires_at);
    assert.deepEqual(unpaid.subscription_period_start, expired.subscription_period_start);
    assert.equal((await billingAccount(db)).paid_until.getTime(), expired.subscription_expires_at.getTime(), 'an unpaid renewal grants no new paid period');
    await save(db, own.token, { ...paid, invoiceId: 'in_Renewal', eventId: 'evt_PaidRenewal' });
    assert.equal((await reserve(db)).remaining, 59, 'the confirmed new month excludes all 60 older generations');
    await save(db, own.token, { ...paid, invoiceId: 'in_Renewal', eventId: 'evt_PaidRenewalReplay' });
    assert.equal((await reserve(db)).remaining, 58, 'another event for the same paid month keeps its consumed quota');
  } finally { await db.close(); }
});
