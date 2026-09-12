import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { billingConfiguration, createBillingService, validatePrice, verifiedInvoicePeriod } from '../server/billing.js';
import { createBillingHandler } from '../api/billing.js';
import { createStripeWebhookHandler } from '../api/stripe-webhook.js';
import { HttpError } from '../server/http.js';

const NOW = Date.parse('2026-09-15T12:00:00Z');
const START = Date.parse('2026-09-01T00:00:00Z') / 1000;
const END = Date.parse('2026-10-01T00:00:00Z') / 1000;
const USER = { id: '8fe524fb-ff44-4fdd-bb46-021f76c31190', email: 'student@example.test' };
const OTHER = 'a17f6349-fad1-45ae-9b9a-0216d0281800';
const ENV = {
  STRIPE_BILLING_ENABLED: 'true', STRIPE_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fixtureSecret',
  STRIPE_WEBHOOK_SECRET: 'whsec_fixtureSecret', STRIPE_PRICE_ESSENTIEL: 'price_essentiel',
  STRIPE_PRICE_SIGNATURE: 'price_signature', SITE_URL: 'https://soutenancepro.com', VERCEL_ENV: 'preview'
};
const CONFIG = billingConfiguration(ENV);
const copy = value => structuredClone(value);

function price(plan = 'offre') {
  return { id: CONFIG.prices[plan], object: 'price', active: true, livemode: false,
    unit_amount: plan === 'offre' ? 1900 : 2900, currency: 'eur', type: 'recurring',
    recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }, billing_scheme: 'per_unit' };
}

function paidSubscription(plan = 'offre') {
  const subscription = { id: 'sub_fixture', object: 'subscription', customer: 'cus_fixture', livemode: false,
    status: 'active', collection_method: 'charge_automatically', metadata: {},
    items: { has_more: false, data: [{ id: 'si_fixture', quantity: 1, price: price(plan), current_period_start: START, current_period_end: END }] } };
  subscription.latest_invoice = { id: 'in_fixture', object: 'invoice', status: 'paid', customer: 'cus_fixture',
    livemode: false, currency: 'eur', amount_remaining: 0, amount_paid: price(plan).unit_amount,
    total: price(plan).unit_amount, billing_reason: 'subscription_create',
    parent: { type: 'subscription_details', subscription_details: { subscription: subscription.id } },
    lines: { has_more: false, data: [{ id: 'il_fixture', amount: price(plan).unit_amount, quantity: 1,
      period: { start: START, end: END }, pricing: { type: 'price_details', price_details: { price: price(plan).id } },
      parent: { type: 'subscription_item_details', subscription_item_details: { subscription_item: 'si_fixture', proration: false } } }] } };
  return subscription;
}

// The fake records billing decisions and enforces exclusive leases. Database
// allowance accounting is independently tested against the real migration.
function harness({ config = CONFIG, account: initial = {}, subscription = paidSubscription() } = {}) {
  const accounts = new Map([[USER.id, { user_id: USER.id, livemode: false, customer_id: 'cus_fixture',
    subscription_id: null, subscription_status: null, attempt_id: null, paid_until: null, paid_plan: null, ...copy(initial) }]]);
  const attempts = new Map();
  const leases = new Map();
  const sessions = new Map();
  const subscriptions = new Map(subscription ? [[subscription.id, copy(subscription)]] : []);
  const amount = subscription?.items.data[0].price.unit_amount || 1900;
  const charge = { id: 'ch_fixture', customer: 'cus_fixture', livemode: false, currency: 'eur', paid: true,
    captured: true, status: 'succeeded', amount_captured: amount, amount_refunded: 0, refunded: false, disputed: false };
  const intent = { id: 'pi_fixture', customer: 'cus_fixture', livemode: false, currency: 'eur',
    status: 'succeeded', amount_received: amount, latest_charge: charge };
  const invoicePayment = { invoice: 'in_fixture', livemode: false, currency: 'eur', amount_paid: amount,
    payment: { type: 'payment_intent', payment_intent: 'pi_fixture' } };
  const calls = { saves: [], locks: 0, releases: 0, priceReads: 0, customerCreates: [], checkoutCreates: [],
    subscriptionReads: [], invoiceReads: [], portalCreates: [], listSubscriptions: [] };
  const store = {
    async account(id) { return copy(accounts.get(id) || null); },
    async customer(id) { return copy([...accounts.values()].find(value => value.customer_id === id) || null); },
    async attempt(id) { return copy(attempts.get(id) || null); },
    async session(id) { return copy([...attempts.values()].find(value => value.session_id === id) || null); },
    async lock(id, mode, token) {
      calls.locks++;
      if (leases.has(id)) throw new HttpError(409, 'Busy');
      if (!accounts.has(id)) accounts.set(id, { user_id: id, livemode: mode });
      leases.set(id, token);
      return copy(accounts.get(id));
    },
    async save(id, token, change) {
      assert.equal(leases.get(id), token, 'every write requires the acquired lease');
      calls.saves.push(copy(change));
      const account = accounts.get(id);
      if (change.kind === 'customer') account.customer_id = change.customerId;
      else if (change.kind === 'attempt') {
        const attempt = { id: change.attemptId, user_id: id, plan: change.plan, livemode: config.livemode,
          expires_at: new Date(NOW + 60 * 60 * 1000).toISOString(), session_id: null };
        attempts.set(attempt.id, attempt); account.attempt_id = attempt.id; return copy(attempt);
      } else if (change.kind === 'session') {
        const attempt = attempts.get(change.attemptId);
        attempt.session_id = change.sessionId; attempt.url = change.url; return copy(attempt);
      } else if (change.kind === 'subscription') {
        account.subscription_id = change.subscriptionId;
        account.subscription_status = change.status;
        if (change.paidUntil) { account.paid_until = change.paidUntil; account.paid_plan = change.plan; account.invoice_id = change.invoiceId; }
        if (change.clearPaid) { account.paid_until = null; account.paid_plan = null; }
      } else assert.fail(`unexpected billing write ${change.kind}`);
      return copy(account);
    },
    async release(id, token) {
      assert.equal(leases.get(id), token, 'release the same acquired lease');
      calls.releases++; leases.delete(id); return true;
    }
  };
  const stripe = {
    prices: { async retrieve(id) { calls.priceReads++; return price(id === CONFIG.prices.max ? 'max' : 'offre'); } },
    customers: { async create(params, options) { calls.customerCreates.push({ params, options }); return { id: 'cus_fixture', livemode: false }; } },
    subscriptions: {
      async retrieve(id) { calls.subscriptionReads.push(id); if (!subscriptions.has(id)) throw new Error('Stripe subscription missing'); return copy(subscriptions.get(id)); },
      async list(params) { calls.listSubscriptions.push(params); return { data: [], has_more: false }; }
    },
    invoices: { async retrieve(id) { calls.invoiceReads.push(id); return copy(subscription.latest_invoice); } },
    invoicePayments: { async list() { return { data: [copy(invoicePayment)], has_more: false }; } },
    paymentIntents: { async retrieve() { return copy(intent); } },
    charges: { async retrieve() { return copy(charge); } },
    checkout: { sessions: {
      async create(params, options) {
        calls.checkoutCreates.push({ params, options });
        const session = { id: 'cs_test_1234567890Fixture', mode: 'subscription', status: 'open', payment_status: 'unpaid',
          livemode: false, customer: params.customer, client_reference_id: params.client_reference_id,
          url: 'https://checkout.stripe.com/c/pay/cs_test_1234567890Fixture' };
        sessions.set(session.id, session); return copy(session);
      },
      async retrieve(id) { if (!sessions.has(id)) throw new Error('Stripe session missing'); return copy(sessions.get(id)); },
      async list() { return { data: [...sessions.values()].map(copy), has_more: false }; }
    } },
    billingPortal: { sessions: { async create(params) { calls.portalCreates.push(params); return { url: 'https://billing.stripe.com/p/session/fixture' }; } } }
  };
  function seedPurchase(plan = 'offre', userId = USER.id) {
    const id = randomUUID();
    const sessionId = 'cs_test_1234567890Purchase';
    const attempt = { id, user_id: userId, plan, livemode: false, session_id: sessionId, expires_at: new Date(NOW + 3600000).toISOString() };
    attempts.set(id, attempt); accounts.get(userId).attempt_id = id;
    sessions.set(sessionId, { id: sessionId, mode: 'subscription', status: 'complete', payment_status: 'paid', livemode: false,
      customer: 'cus_fixture', client_reference_id: id, subscription: 'sub_fixture', url: null });
    subscriptions.get('sub_fixture').metadata.checkout_attempt_id = id;
    return { attempt, sessionId };
  }
  const service = createBillingService({ stripe, store, config, clock: () => NOW });
  return { service, stripe, store, accounts, attempts, sessions, subscriptions, calls, leases, charge, intent, invoicePayment, seedPurchase };
}

test('automatic billing stays unavailable until all trusted configuration exists; production rejects test mode', async () => {
  assert.equal(CONFIG.ready, true);
  for (const change of [
    { STRIPE_BILLING_ENABLED: 'false' }, { STRIPE_SECRET_KEY: '' }, { STRIPE_WEBHOOK_SECRET: '' },
    { STRIPE_MODE: 'live' }, { STRIPE_PRICE_SIGNATURE: ENV.STRIPE_PRICE_ESSENTIEL },
    { SITE_URL: 'http://soutenancepro.com' }, { SITE_URL: 'https://attacker.test@trusted.test' },
    { SITE_URL: 'https://soutenancepro.com/path' }, { SITE_URL: 'https://soutenancepro.com/?next=https://attacker.test' },
    { VERCEL_ENV: 'production' }
  ]) assert.equal(billingConfiguration({ ...ENV, ...change }).ready, false, JSON.stringify(change));
  const config = billingConfiguration({ ...ENV, STRIPE_BILLING_ENABLED: 'false' });
  const h = harness({ config });
  assert.deepEqual(await h.service.status(USER.id), { ready: false, canManage: false, canSubscribe: false });
  await assert.rejects(h.service.checkout(USER, 'offre'), { status: 503 });
  assert.equal(h.calls.priceReads, 0);
  assert.equal(h.calls.saves.length, 0);
});

test('billing status allows resubscribing after terminal cancellation while preserving the customer portal', async () => {
  const fresh = harness();
  assert.deepEqual(await fresh.service.status(USER.id), { ready: true, canManage: false, canSubscribe: true });
  for (const status of ['canceled', 'incomplete_expired', 'active', 'past_due', 'unpaid', 'paused', 'incomplete', 'trialing']) {
    const h = harness({ account: { subscription_id: 'sub_fixture', subscription_status: status } });
    assert.deepEqual(await h.service.status(USER.id), {
      ready: true, canManage: true, canSubscribe: ['canceled', 'incomplete_expired'].includes(status)
    }, status);
    assert.equal(h.calls.saves.length, 0, 'readiness does not mutate subscription or payment state');
  }
  const wrongMode = harness({ account: { livemode: true, subscription_id: 'sub_fixture', subscription_status: 'canceled' } });
  assert.deepEqual(await wrongMode.service.status(USER.id), { ready: false, canManage: false, canSubscribe: false });
});

test('only the configured monthly EUR prices qualify; amount alone never selects an offer', () => {
  for (const plan of ['offre', 'max']) assert.equal(validatePrice(price(plan), plan, CONFIG), plan);
  for (const change of [
    { id: 'price_other' }, { unit_amount: 190 }, { currency: 'usd' }, { active: false }, { livemode: true },
    { type: 'one_time' }, { recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed' } },
    { recurring: { interval: 'month', interval_count: 2, usage_type: 'licensed' } },
    { recurring: { interval: 'month', interval_count: 1, usage_type: 'metered' } },
    { billing_scheme: 'tiered' }, { transform_quantity: { divide_by: 10 } }
  ]) assert.throws(() => validatePrice({ ...price(), ...change }, 'offre', CONFIG), { code: 'billing_mismatch' });
  assert.throws(() => validatePrice(price(), 'constructor', CONFIG), { code: 'billing_mismatch' });
});

test('Dahlia paid invoices activate the correct offer and period without an obsolete paid boolean', async () => {
  for (const plan of ['offre', 'max']) {
    const h = harness({ subscription: paidSubscription(plan) });
    const { sessionId } = h.seedPurchase(plan);
    const result = await h.service.confirm(USER.id, sessionId);
    assert.deepEqual(result, { paid: true, plan, expiresAt: new Date(END * 1000).toISOString() });
    const grant = h.calls.saves.find(value => value.kind === 'subscription');
    assert.equal(grant.invoiceId, 'in_fixture');
    assert.equal(grant.periodStart, new Date(START * 1000).toISOString());
    assert.equal(h.leases.size, 0);
  }
});

test('a payment session cannot be claimed by another signed-in account or forged URL', async () => {
  const h = harness();
  const { sessionId } = h.seedPurchase();
  await assert.rejects(h.service.confirm(OTHER, sessionId), { status: 404 });
  await assert.rejects(h.service.confirm(USER.id, 'https://checkout.stripe.com/?paid=true'), { status: 400 });
  await assert.rejects(h.service.confirm(USER.id, 'cs_test_1234567890NotPurchased'), { status: 404 });
  assert.equal(h.calls.saves.length, 0);
  assert.equal(h.calls.subscriptionReads.length, 0);
  assert.equal(h.leases.size, 0);
});

test('completed checkout alone never grants an unpaid or mismatched subscription', async () => {
  for (const change of [
    { payment_status: 'unpaid' }, { payment_status: 'no_payment_required' }, { status: 'open' },
    { customer: 'cus_other' }, { client_reference_id: randomUUID() }, { mode: 'payment' }, { livemode: true }
  ]) {
    const h = harness(); const { sessionId } = h.seedPurchase();
    Object.assign(h.sessions.get(sessionId), change);
    const result = await h.service.confirm(USER.id, sessionId).catch(error => ({ error }));
    assert.notEqual(result.paid, true, JSON.stringify(change));
    assert.equal(h.calls.saves.filter(value => value.paidUntil).length, 0);
    assert.equal(h.leases.size, 0);
  }
  const h = harness(); const { sessionId } = h.seedPurchase('max');
  await assert.rejects(h.service.confirm(USER.id, sessionId), { code: 'billing_mismatch' });
  assert.equal(h.calls.saves.length, 0, 'selected offer must match the verified price');
});

test('an active subscription without a fully paid current invoice cannot mint an allowance', () => {
  for (const change of [
    { status: 'open' }, { amount_remaining: 100 }, { amount_paid: 1800 }, { currency: 'usd' },
    { livemode: true }, { customer: 'cus_other' }, { billing_reason: 'manual' }, { billing_reason: 'subscription_update' },
    { parent: { subscription_details: { subscription: 'sub_other' } } }
  ]) {
    const sub = paidSubscription(); Object.assign(sub.latest_invoice, change);
    const verified = verifiedInvoicePeriod(sub, sub.latest_invoice, CONFIG, NOW);
    assert.equal(verified.paidUntil, undefined, JSON.stringify(change));
  }
  const sub = paidSubscription();
  assert.equal(verifiedInvoicePeriod(sub, null, CONFIG, NOW).paidUntil, undefined);
  for (const status of ['trialing', 'incomplete', 'past_due', 'unpaid', 'canceled', 'paused']) {
    sub.status = status;
    assert.equal(verifiedInvoicePeriod(sub, sub.latest_invoice, CONFIG, NOW).paidUntil, undefined, status);
  }
});

test('invoice lines must represent exactly the purchased recurring item and its paid billing window', () => {
  const alterations = [
    sub => { sub.items.data[0].quantity = 2; },
    sub => { sub.items.has_more = true; },
    sub => { sub.items.data.push(copy(sub.items.data[0])); },
    sub => { sub.collection_method = 'send_invoice'; },
    sub => { sub.latest_invoice.lines.has_more = true; },
    sub => { sub.latest_invoice.lines.data.push(copy(sub.latest_invoice.lines.data[0])); },
    sub => { sub.latest_invoice.lines.data[0].pricing.price_details.price = 'price_other'; },
    sub => { sub.latest_invoice.lines.data[0].parent.subscription_item_details.subscription_item = 'si_other'; },
    sub => { sub.latest_invoice.lines.data[0].parent.subscription_item_details.proration = true; },
    sub => { sub.latest_invoice.lines.data[0].quantity = 2; },
    sub => { sub.latest_invoice.lines.data[0].period.end = START + 365 * 86400; },
    sub => { sub.latest_invoice.lines.data[0].period.start = START - 86400; },
    sub => { sub.latest_invoice.lines.data[0].period.end = NOW / 1000 - 1; }
  ];
  for (const mutate of alterations) {
    const sub = paidSubscription(); mutate(sub);
    let verified;
    try { verified = verifiedInvoicePeriod(sub, sub.latest_invoice, CONFIG, NOW); }
    catch (error) { assert.equal(error.code, 'billing_mismatch'); continue; }
    assert.equal(verified.paidUntil, undefined, mutate.toString());
  }
});

test('expanded Stripe customer, invoice parent and line-price references remain valid', () => {
  const sub = paidSubscription();
  sub.customer = { id: sub.customer };
  sub.latest_invoice.customer = { id: 'cus_fixture' };
  sub.latest_invoice.parent.subscription_details.subscription = { id: sub.id };
  sub.latest_invoice.lines.data[0].pricing.price_details.price = price();
  assert.equal(verifiedInvoicePeriod(sub, sub.latest_invoice, CONFIG, NOW).invoiceId, 'in_fixture');
});

test('pending renewal preserves existing paid coverage without advancing the allowance window', async () => {
  const h = harness({ account: { subscription_id: 'sub_fixture', subscription_status: 'active',
    paid_plan: 'offre', paid_until: new Date(END * 1000).toISOString() } });
  const sub = h.subscriptions.get('sub_fixture');
  sub.status = 'past_due'; sub.latest_invoice.status = 'open'; sub.latest_invoice.amount_remaining = 1900;
  await h.service.event({ id: 'evt_pendingrenewal', livemode: false, type: 'invoice.payment_failed',
    data: { object: { customer: 'cus_fixture', parent: { subscription_details: { subscription: 'sub_fixture' } } } } });
  assert.equal(h.calls.saves.at(-1).paidUntil, undefined);
  assert.equal(h.accounts.get(USER.id).paid_until, new Date(END * 1000).toISOString());
  assert.equal(h.accounts.get(USER.id).subscription_status, 'past_due');
});

test('subscription webhooks retrieve current Stripe state instead of trusting stale paid event snapshots', async () => {
  const h = harness({ account: { subscription_id: 'sub_fixture', subscription_status: 'active' } });
  h.subscriptions.get('sub_fixture').status = 'canceled';
  const stale = paidSubscription();
  await h.service.event({ id: 'evt_staleactive', created: 12345, livemode: false, type: 'customer.subscription.updated', data: { object: stale } });
  assert.deepEqual(h.calls.subscriptionReads, ['sub_fixture']);
  assert.equal(h.calls.saves.at(-1).status, 'canceled');
  assert.equal(h.calls.saves.at(-1).paidUntil, undefined);
  assert.equal(h.calls.saves.at(-1).eventId, 'evt_staleactive');
});

test('events for another mode, connected account, unknown customer or unrelated type cannot write entitlements', async () => {
  const h = harness();
  const event = { id: 'evt_fixture', livemode: false, type: 'customer.subscription.updated', data: { object: paidSubscription() } };
  await assert.rejects(h.service.event({ ...event, livemode: true }), { status: 400 });
  await assert.rejects(h.service.event({ ...event, account: 'acct_other' }), { status: 400 });
  assert.equal((await h.service.event({ ...event, type: 'charge.succeeded' })).ignored, true);
  event.data.object.customer = 'cus_unknown';
  assert.equal((await h.service.event(event)).ignored, true);
  assert.equal(h.calls.saves.length, 0);
});

test('unbound Payment Link subscriptions cannot take ownership of a student account', async () => {
  const h = harness();
  await h.service.event({ id: 'evt_unbound', livemode: false, type: 'customer.subscription.created', data: { object: paidSubscription() } });
  assert.equal(h.calls.saves.length, 0);
  assert.equal(h.leases.size, 0);
});

test('refunds, disputes and incomplete payment capture prevent allowances despite a paid invoice', async () => {
  for (const change of [
    { refunded: true, amount_refunded: 1900 }, { amount_refunded: 1 }, { disputed: true },
    { paid: false }, { captured: false }, { amount_captured: 1899 }, { customer: 'cus_other' },
    { livemode: true }, { currency: 'usd' }
  ]) {
    const h = harness(); const { sessionId } = h.seedPurchase();
    Object.assign(h.charge, change);
    assert.equal((await h.service.confirm(USER.id, sessionId)).paid, false, JSON.stringify(change));
    assert.equal(h.accounts.get(USER.id).paid_until, null);
    assert.equal(h.calls.saves.at(-1).clearPaid, true);
  }
  const h = harness(); const { sessionId } = h.seedPurchase();
  h.intent.status = 'processing';
  assert.equal((await h.service.confirm(USER.id, sessionId)).paid, false);
});

test('refund and dispute notifications revalidate the charge before preserving paid access', async () => {
  for (const type of ['charge.refunded', 'charge.dispute.created']) {
    const h = harness({ account: { subscription_id: 'sub_fixture', subscription_status: 'active',
      invoice_id: 'in_fixture', paid_plan: 'offre', paid_until: new Date(END * 1000).toISOString() } });
    if (type === 'charge.refunded') { h.charge.refunded = true; h.charge.amount_refunded = 1900; }
    else h.charge.disputed = true;
    await h.service.event({ id: `evt_${type}`, livemode: false, type,
      data: { object: type === 'charge.refunded' ? { id: 'ch_fixture' } : { id: 'dp_fixture', charge: 'ch_fixture' } } });
    assert.equal(h.accounts.get(USER.id).paid_until, null, type);
    assert.equal(h.calls.saves.at(-1).clearPaid, true);
  }
});

test('terminal subscription events revoke state even after their old price has been removed from the catalog', async () => {
  const h = harness({ account: { subscription_id: 'sub_fixture', subscription_status: 'active', paid_plan: 'max' } });
  const sub = h.subscriptions.get('sub_fixture');
  sub.status = 'canceled'; sub.items.data[0].price = { id: 'price_archivedunknown', active: false };
  await h.service.event({ id: 'evt_terminal', livemode: false, type: 'customer.subscription.deleted', data: { object: sub } });
  assert.equal(h.calls.saves.at(-1).status, 'canceled');
  assert.equal(h.calls.saves.at(-1).paidUntil, undefined);
  assert.equal(h.accounts.get(USER.id).subscription_status, 'canceled');
});

test('webhook recovers a lost Checkout response only with one session bound to the server attempt and customer', async () => {
  const h = harness(); const { attempt, sessionId } = h.seedPurchase();
  h.attempts.get(attempt.id).session_id = null;
  await h.service.event({ id: 'evt_recover', livemode: false, type: 'invoice.paid', data: { object: h.subscriptions.get('sub_fixture').latest_invoice } });
  assert.equal(h.attempts.get(attempt.id).session_id, sessionId);
  assert.equal(h.calls.saves[0].kind, 'session');
  assert.equal(h.calls.saves[1].kind, 'subscription');
  assert.equal(h.accounts.get(USER.id).paid_plan, 'offre');

  const ambiguous = harness(); const seeded = ambiguous.seedPurchase();
  ambiguous.attempts.get(seeded.attempt.id).session_id = null;
  ambiguous.sessions.set('cs_test_anothermatching', { ...ambiguous.sessions.get(seeded.sessionId), id: 'cs_test_anothermatching' });
  await assert.rejects(ambiguous.service.event({ id: 'evt_ambiguous', livemode: false, type: 'invoice.paid',
    data: { object: ambiguous.subscriptions.get('sub_fixture').latest_invoice } }), { code: 'billing_pending' });
  assert.equal(ambiguous.calls.saves.length, 0);
  assert.equal(ambiguous.leases.size, 0);
});

test('checkout is bound to the logged-in account, idempotent and safely reuses an open session', async () => {
  const h = harness({ account: { customer_id: null } });
  const first = await h.service.checkout(USER, 'offre');
  const second = await h.service.checkout(USER, 'offre');
  assert.deepEqual(second, first);
  assert.equal(h.calls.customerCreates.length, 1);
  assert.equal(h.calls.checkoutCreates.length, 1);
  const { params, options } = h.calls.checkoutCreates[0];
  assert.equal(params.customer, 'cus_fixture');
  assert.equal(params.mode, 'subscription');
  assert.deepEqual(params.line_items, [{ price: CONFIG.prices.offre, quantity: 1 }]);
  assert.equal(params.subscription_data.metadata.checkout_attempt_id, params.client_reference_id);
  assert.equal(options.idempotencyKey, `sp-checkout-${params.client_reference_id}`);
  assert.match(params.success_url, /^https:\/\/soutenancepro\.com\/\?checkout=success&session_id=\{CHECKOUT_SESSION_ID\}#workspace$/);
  assert.equal(params.cancel_url, 'https://soutenancepro.com/?checkout=cancelled#workspace');
  assert.match(params.integration_identifier, /^soutenancepro-[a-z]{8}$/);
  assert.equal(h.calls.customerCreates[0].params.metadata.soutenance_user_id, USER.id);
  assert.equal(h.leases.size, 0);
  await assert.rejects(h.service.checkout(USER, 'max'), { code: 'billing_pending' });
  assert.equal(h.calls.checkoutCreates.length, 1);
});

test('checkout refuses a second nonterminal subscription, including incomplete checkout and unknown extra pages', async () => {
  for (const status of ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete']) {
    const h = harness();
    h.stripe.subscriptions.list = async () => ({ data: [{ id: 'sub_existing', status }], has_more: false });
    await assert.rejects(h.service.checkout(USER, 'offre'), { code: 'billing_existing' });
    assert.equal(h.calls.checkoutCreates.length, 0);
    assert.equal(h.leases.size, 0);
  }
  const h = harness(); h.stripe.subscriptions.list = async () => ({ data: [], has_more: true });
  await assert.rejects(h.service.checkout(USER, 'offre'), { code: 'billing_existing' });
});

test('leases release after Stripe errors and prevent competing checkout writes', async () => {
  const h = harness();
  h.stripe.prices.retrieve = async () => { throw new Error('Temporary Stripe outage'); };
  await assert.rejects(h.service.checkout(USER, 'offre'), /Temporary Stripe outage/);
  assert.equal(h.calls.releases, 1);
  assert.equal(h.leases.size, 0);
  h.leases.set(USER.id, 'other-request');
  await assert.rejects(h.service.checkout(USER, 'offre'), { status: 409 });
  assert.equal(h.leases.get(USER.id), 'other-request');
  assert.equal(h.calls.releases, 1, 'do not release another request’s lease');
});

test('subscription management uses the account customer and trusted site return URL', async () => {
  const h = harness({ account: { subscription_id: 'sub_fixture' } });
  assert.deepEqual(await h.service.portal(USER.id), { url: 'https://billing.stripe.com/p/session/fixture' });
  assert.deepEqual(h.calls.portalCreates, [{ customer: 'cus_fixture', return_url: 'https://soutenancepro.com/#workspace' }]);
  const empty = harness();
  await assert.rejects(empty.service.portal(USER.id), { status: 409 });
  assert.equal(empty.calls.portalCreates.length, 0);
});

function response() {
  return { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

test('billing API authenticates every operation and never lets request fields replace the owner or return destination', async () => {
  const invoked = [];
  const service = { checkout: async (user, plan) => { invoked.push({ user, plan }); return { url: 'https://checkout.stripe.com/fixture' }; } };
  const handler = createBillingHandler({ env: () => ENV, auth: async () => ({ user: USER, admin: {} }), stripeFactory: () => ({}), serviceFactory: () => service });
  const res = response();
  await handler({ method: 'POST', body: { action: 'checkout', plan: 'max', userId: OTHER, customer: 'cus_other', return_url: 'https://attacker.test' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(invoked, [{ user: USER, plan: 'max' }]);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  const unauthenticated = createBillingHandler({ env: () => ENV, auth: async () => { throw new HttpError(401, 'Connecte-toi'); },
    stripeFactory: () => { assert.fail('unauthenticated requests must not reach Stripe'); } });
  for (const method of ['GET', 'POST']) {
    const denied = response(); await unauthenticated({ method, body: { action: 'checkout', plan: 'offre' } }, denied);
    assert.equal(denied.statusCode, 401);
  }
});

test('billing API exposes unavailable state without constructing a Stripe client and rejects unsupported actions', async () => {
  const handler = createBillingHandler({ env: () => ({ ...ENV, STRIPE_BILLING_ENABLED: 'false' }), auth: async () => ({ user: USER }),
    stripeFactory: () => { assert.fail('disabled configuration must not create Stripe'); } });
  const get = response(); await handler({ method: 'GET' }, get);
  assert.deepEqual(get.body, { ready: false, canManage: false, canSubscribe: false });
  const post = response(); await handler({ method: 'POST', body: { action: 'checkout', plan: 'offre' } }, post);
  assert.equal(post.statusCode, 503);
  const unsupported = response(); await handler({ method: 'DELETE' }, unsupported);
  assert.equal(unsupported.statusCode, 405);
});

function webhookHarness({ eventHandler = async () => ({ received: true }), env = ENV } = {}) {
  const stripe = new Stripe('sk_test_fixtureSecret');
  const calls = { admin: 0, processed: [] };
  const handler = createStripeWebhookHandler({ env: () => env, stripeFactory: () => stripe,
    adminFactory: () => { calls.admin++; return {}; },
    serviceFactory: () => ({ event: async event => { calls.processed.push(event); return eventHandler(event); } }) });
  function request(payload, { signature, body = payload, method = 'POST', headers = {} } = {}) {
    const signed = signature ?? stripe.webhooks.generateTestHeaderString({ payload, secret: ENV.STRIPE_WEBHOOK_SECRET });
    return new Request('https://soutenancepro.com/api/stripe-webhook', { method, headers: { 'content-type': 'application/json', 'stripe-signature': signed, ...headers },
      ...(method === 'POST' ? { body } : {}) });
  }
  return { handler, calls, request };
}

test('native Web Request webhook verifies actual Stripe signatures on the untouched body', async () => {
  const h = webhookHarness();
  const payload = '{\n  "id": "evt_valid", "livemode": false, "type": "invoice.paid", "data": {"object": {"id":"in_fixture"}}\n}';
  const result = await h.handler(h.request(payload));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { received: true });
  assert.equal(h.calls.admin, 1);
  assert.equal(h.calls.processed[0].id, 'evt_valid');
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('forged, modified, expired or oversized webhook bodies are rejected before database access', async () => {
  const payload = JSON.stringify({ id: 'evt_forged', type: 'invoice.paid', livemode: false, data: { object: {} } });
  for (const options of [
    { signature: 't=1,v1=invalid' }, { signature: '' }, { body: `${payload} ` },
    { signature: new Stripe('sk_test_fixture').webhooks.generateTestHeaderString({ payload, secret: ENV.STRIPE_WEBHOOK_SECRET, timestamp: 1 }) },
    { body: 'x'.repeat(512 * 1024 + 1) }, { headers: { 'content-length': String(512 * 1024 + 1) } }
  ]) {
    const h = webhookHarness(); const result = await h.handler(h.request(payload, options));
    assert.equal(result.status, 400);
    assert.equal(h.calls.admin, 0);
    assert.equal(h.calls.processed.length, 0);
  }
});

test('webhook database failures stay retryable and disabled or non-POST requests cannot write', async () => {
  const payload = JSON.stringify({ id: 'evt_retry', type: 'invoice.paid', livemode: false, data: { object: {} } });
  for (const error of [new Error('database unavailable'), new HttpError(409, 'lease busy')]) {
    const h = webhookHarness({ eventHandler: async () => { throw error; } });
    assert.equal((await h.handler(h.request(payload))).status, 503);
  }
  const disabled = webhookHarness({ env: { ...ENV, VERCEL_ENV: 'production' } });
  assert.equal((await disabled.handler(disabled.request(payload))).status, 503);
  assert.equal(disabled.calls.admin, 0);
  const get = webhookHarness();
  assert.equal((await get.handler(get.request(payload, { method: 'GET' }))).status, 405);
  assert.equal(get.calls.admin, 0);
});
