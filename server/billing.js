import Stripe from 'stripe';
import { randomUUID, createHash } from 'node:crypto';
import { HttpError } from './http.js';

export const STRIPE_API_VERSION = '2026-07-29.dahlia';
export const BILLING_PLANS = Object.freeze({ offre: { amount: 1900, credits: 60 }, max: { amount: 2900, credits: 150 } });
const objectId = value => typeof value === 'string' ? value : value?.id;
const paidStatuses = new Set(['active', 'past_due']);
const terminalStatuses = new Set(['canceled', 'incomplete_expired']);
const unavailable = () => new HttpError(503, 'Le paiement automatique est en cours de configuration.', 'billing_unavailable');
const mismatch = () => new HttpError(409, 'Ce paiement ne correspond pas à cet abonnement. Contacte le support.', 'billing_mismatch');

export function billingConfiguration(env = process.env) {
  const key = env.STRIPE_SECRET_KEY?.trim() || '';
  const mode = env.STRIPE_MODE;
  const livemode = mode === 'live';
  let origin = '';
  try {
    const url = new URL(env.SITE_URL || '');
    if (url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) origin = url.origin;
  } catch { /* Configuration remains unavailable. */ }
  const prices = { offre: env.STRIPE_PRICE_ESSENTIEL?.trim() || '', max: env.STRIPE_PRICE_SIGNATURE?.trim() || '' };
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() || '';
  const ready = env.STRIPE_BILLING_ENABLED === 'true' && ['test', 'live'].includes(mode) &&
    new RegExp(`^(?:sk|rk)_${mode}_[A-Za-z0-9]+$`).test(key) && /^whsec_[A-Za-z0-9]+$/.test(webhookSecret) &&
    Object.values(prices).every(value => /^price_[A-Za-z0-9]+$/.test(value)) && prices.offre !== prices.max &&
    Boolean(origin) && !(env.VERCEL_ENV === 'production' && !livemode);
  return { ready, key, livemode, mode, origin, prices, webhookSecret };
}

export function createStripeClient(config) {
  if (!config.ready) throw unavailable();
  return new Stripe(config.key, { apiVersion: STRIPE_API_VERSION, timeout: 10000, maxNetworkRetries: 1 });
}

export function validatePrice(price, plan, config, requireActive = true) {
  if (!Object.hasOwn(BILLING_PLANS, plan) || price?.id !== config.prices[plan] || price.livemode !== config.livemode ||
    (requireActive && price.active !== true) || price.currency !== 'eur' || price.unit_amount !== BILLING_PLANS[plan].amount ||
    price.type !== 'recurring' || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1 ||
    price.recurring.usage_type !== 'licensed' || price.recurring.trial_period_days || price.billing_scheme !== 'per_unit' || price.transform_quantity) throw mismatch();
  return plan;
}

// Only a retrieved, fully paid invoice for the single allowed monthly price
// can advance the allowance period. A redirect, event payload or email cannot.
export function verifiedInvoicePeriod(subscription, invoice, config, now = Date.now()) {
  const items = subscription?.items;
  if (subscription?.livemode !== config.livemode || items?.has_more || items?.data?.length !== 1) throw mismatch();
  const item = items.data[0];
  const plan = Object.keys(config.prices).find(name => config.prices[name] === objectId(item.price));
  validatePrice(item.price, plan, config, false);
  if (item.quantity !== 1 || subscription.collection_method !== 'charge_automatically') throw mismatch();
  const base = { plan, status: subscription.status, subscriptionId: subscription.id };
  if (subscription.status !== 'active' || !invoice || invoice.status !== 'paid' || invoice.amount_remaining !== 0) return base;
  const line = invoice.lines?.data?.[0];
  const start = line?.period?.start;
  const end = line?.period?.end;
  if (invoice.livemode !== config.livemode || objectId(invoice.customer) !== objectId(subscription.customer) ||
    objectId(invoice.parent?.subscription_details?.subscription) !== subscription.id || invoice.currency !== 'eur' ||
    !['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason) || invoice.lines?.has_more || invoice.lines?.data?.length !== 1 ||
    objectId(line.pricing?.price_details?.price) !== config.prices[plan] || line.quantity !== 1 ||
    line.parent?.subscription_item_details?.subscription_item !== item.id ||
    line.parent?.subscription_item_details?.proration === true || invoice.amount_paid < BILLING_PLANS[plan].amount ||
    line.amount !== BILLING_PLANS[plan].amount || invoice.total < BILLING_PLANS[plan].amount ||
    !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start || end - start > 32 * 86400 ||
    end - start < 27 * 86400 || start * 1000 > now + 60000 || end * 1000 <= now ||
    start !== item.current_period_start || end !== item.current_period_end) return base;
  return { ...base, periodStart: new Date(start * 1000).toISOString(), paidUntil: new Date(end * 1000).toISOString(), invoiceId: invoice.id };
}

export function createBillingService({ stripe, store, config, clock = () => Date.now(), nonce = randomUUID }) {
  async function withLock(userId, work) {
    if (!config.ready) throw unavailable();
    const token = nonce();
    const account = await store.lock(userId, config.livemode, token);
    try { return await work(account, change => store.save(userId, token, change)); }
    finally { await store.release(userId, token); }
  }

  async function invoicePaymentValid(invoiceId, account, plan) {
    const payments = await stripe.invoicePayments.list({ invoice: invoiceId, status: 'paid', limit: 10 });
    if (payments.has_more || payments.data.length !== 1) return false;
    const payment = payments.data[0];
    if (objectId(payment.invoice) !== invoiceId || payment.livemode !== config.livemode || payment.currency !== 'eur' || payment.amount_paid < BILLING_PLANS[plan].amount) return false;
    let charge;
    if (payment.payment?.type === 'payment_intent') {
      const intent = await stripe.paymentIntents.retrieve(objectId(payment.payment.payment_intent), { expand: ['latest_charge'] });
      if (intent.status !== 'succeeded' || intent.livemode !== config.livemode || objectId(intent.customer) !== account.customer_id || intent.currency !== 'eur' || intent.amount_received < BILLING_PLANS[plan].amount) return false;
      charge = typeof intent.latest_charge === 'string' ? await stripe.charges.retrieve(intent.latest_charge) : intent.latest_charge;
    } else if (payment.payment?.type === 'charge') {
      charge = await stripe.charges.retrieve(objectId(payment.payment.charge));
    } else return false;
    return Boolean(charge && charge.livemode === config.livemode && objectId(charge.customer) === account.customer_id && charge.currency === 'eur' &&
      charge.paid === true && charge.captured === true && charge.status === 'succeeded' && charge.amount_captured >= BILLING_PLANS[plan].amount &&
      charge.amount_refunded === 0 && charge.refunded === false && charge.disputed === false);
  }

  async function sync(account, save, subscriptionId, eventId = null) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice'] });
    if (objectId(subscription.customer) !== account.customer_id || subscription.livemode !== config.livemode) throw mismatch();
    // An already bound subscription can lose access independently of whether
    // its former price was archived or replaced in Stripe's catalog.
    if (account.subscription_id === subscription.id && !paidStatuses.has(subscription.status)) {
      await save({ kind: 'subscription', subscriptionId: subscription.id, status: subscription.status, plan: account.paid_plan || 'offre', eventId });
      return { paid: false };
    }
    let attempt = null;
    if (account.subscription_id !== subscription.id) {
      if (account.subscription_id && !terminalStatuses.has(account.subscription_status)) return { paid: false, ignored: true };
      const attemptId = subscription.metadata?.checkout_attempt_id;
      if (!attemptId || !/^[0-9a-f-]{36}$/i.test(attemptId)) return { paid: false, ignored: true };
      attempt = await store.attempt(attemptId);
      if (!attempt || attempt.user_id !== account.user_id || attempt.livemode !== config.livemode) return { paid: false, ignored: true };
      if (!attempt.session_id) {
        // Recover when Stripe created the session but the initial response or
        // database write was lost. The server nonce and bound customer must both
        // match; arbitrary Payment Link subscriptions cannot claim an account.
        const sessions = await stripe.checkout.sessions.list({ subscription: subscription.id, limit: 2 });
        const matching = sessions.data.filter(value => value.client_reference_id === attempt.id && objectId(value.customer) === account.customer_id && value.livemode === config.livemode);
        if (sessions.has_more || matching.length !== 1) throw new HttpError(409, 'Le paiement est en cours de synchronisation.', 'billing_pending');
        // Completed Checkout sessions no longer return a URL. The stored URL is
        // not used for fulfillment and only needs the documented Stripe origin.
        attempt = await save({ kind: 'session', attemptId: attempt.id, sessionId: matching[0].id, url: matching[0].url || 'https://checkout.stripe.com/' });
      }
      // The persisted Checkout session is independently retrieved before binding
      // its subscription, including when a webhook arrives before the redirect.
      const session = await stripe.checkout.sessions.retrieve(attempt.session_id);
      if (objectId(session.subscription) !== subscription.id || objectId(session.customer) !== account.customer_id || session.client_reference_id !== attempt.id || session.mode !== 'subscription') throw mismatch();
    }
    const latest = subscription.latest_invoice;
    const invoice = typeof latest === 'string' ? await stripe.invoices.retrieve(latest) : latest;
    let verified = verifiedInvoicePeriod(subscription, invoice, config, clock());
    if (attempt && attempt.plan !== verified.plan) throw mismatch();
    if (verified.paidUntil && !await invoicePaymentValid(verified.invoiceId, account, verified.plan)) {
      verified = { plan: verified.plan, status: verified.status, subscriptionId: verified.subscriptionId, clearPaid: true };
    } else if (!verified.paidUntil && account.invoice_id && account.paid_until && new Date(account.paid_until).getTime() > clock() &&
      !await invoicePaymentValid(account.invoice_id, account, account.paid_plan)) {
      verified.clearPaid = true;
    }
    const state = await save({ kind: 'subscription', ...verified, attemptId: attempt?.id || null, eventId });
    const paid = paidStatuses.has(state.subscription_status) && state.paid_until && new Date(state.paid_until).getTime() > clock();
    return { paid: Boolean(paid), ...(paid ? { plan: state.paid_plan, expiresAt: state.paid_until } : {}) };
  }

  return {
    async status(userId) {
      if (!config.ready) return { ready: false, canManage: false, canSubscribe: false };
      const account = await store.account(userId);
      if (account && account.livemode !== config.livemode) return { ready: false, canManage: false, canSubscribe: false };
      return {
        ready: true,
        canManage: Boolean(account?.customer_id && account?.subscription_id),
        canSubscribe: !account?.subscription_id || terminalStatuses.has(account.subscription_status)
      };
    },

    async checkout(user, plan) {
      if (!Object.hasOwn(BILLING_PLANS, plan)) throw new HttpError(400, 'Choisis une offre disponible.', 'billing_plan');
      return withLock(user.id, async (account, save) => {
        validatePrice(await stripe.prices.retrieve(config.prices[plan]), plan, config);
        if (!account.customer_id) {
          const customer = await stripe.customers.create({ metadata: { soutenance_user_id: user.id } }, { idempotencyKey: `sp-customer-${config.mode}-${user.id}` });
          if (customer.livemode !== config.livemode || !/^cus_[A-Za-z0-9]+$/.test(customer.id)) throw mismatch();
          account = await save({ kind: 'customer', customerId: customer.id });
        }
        if (account.subscription_id) {
          await sync(account, save, account.subscription_id);
          account = await store.account(user.id);
        }
        const subscriptions = await stripe.subscriptions.list({ customer: account.customer_id, status: 'all', limit: 100 });
        if (subscriptions.has_more || subscriptions.data.some(value => !terminalStatuses.has(value.status))) {
          throw new HttpError(409, 'Un abonnement existe déjà. Utilise « Gérer mon abonnement ».', 'billing_existing');
        }
        let attempt = account.attempt_id ? await store.attempt(account.attempt_id) : null;
        if (attempt && new Date(attempt.expires_at).getTime() > clock()) {
          if (attempt.plan !== plan) throw new HttpError(409, 'Un paiement pour une autre offre est déjà ouvert. Termine-le ou attends son expiration.', 'billing_pending');
          if (attempt.session_id) {
            const session = await stripe.checkout.sessions.retrieve(attempt.session_id);
            if (session.status === 'open' && session.url && objectId(session.customer) === account.customer_id) return { url: session.url };
            throw new HttpError(409, 'Ce paiement est en cours de vérification. Retourne dans ton espace.', 'billing_pending');
          }
        } else {
          attempt = await save({ kind: 'attempt', attemptId: nonce(), plan });
        }
        const suffix = createHash('sha256').update(attempt.id).digest().subarray(0, 8).map(value => value % 26 + 97).toString();
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription', customer: account.customer_id, client_reference_id: attempt.id,
          adaptive_pricing: { enabled: false },
          line_items: [{ price: config.prices[plan], quantity: 1 }],
          subscription_data: { metadata: { checkout_attempt_id: attempt.id } },
          metadata: { checkout_attempt_id: attempt.id }, integration_identifier: `soutenancepro-${suffix}`,
          expires_at: Math.floor(new Date(attempt.expires_at).getTime() / 1000),
          success_url: `${config.origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}#workspace`,
          cancel_url: `${config.origin}/?checkout=cancelled#workspace`
        }, { idempotencyKey: `sp-checkout-${attempt.id}` });
        if (session.livemode !== config.livemode || !session.url || objectId(session.customer) !== account.customer_id) throw mismatch();
        await save({ kind: 'session', attemptId: attempt.id, sessionId: session.id, url: session.url });
        return { url: session.url };
      });
    },

    async confirm(userId, sessionId) {
      if (typeof sessionId !== 'string' || !/^cs_(?:test_|live_)?[A-Za-z0-9]{10,250}$/.test(sessionId)) throw new HttpError(400, 'Référence de paiement invalide.');
      return withLock(userId, async (account, save) => {
        const attempt = await store.session(sessionId);
        if (!attempt || attempt.user_id !== userId || attempt.livemode !== config.livemode) throw new HttpError(404, 'Paiement introuvable pour ce compte.');
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.livemode !== config.livemode || objectId(session.customer) !== account.customer_id || session.client_reference_id !== attempt.id || session.mode !== 'subscription') throw mismatch();
        if (session.status !== 'complete' || session.payment_status !== 'paid' || !session.subscription) return { paid: false };
        return sync(account, save, objectId(session.subscription));
      });
    },

    async portal(userId) {
      return withLock(userId, async account => {
        if (!account.customer_id || !account.subscription_id) throw new HttpError(409, 'Aucun abonnement à gérer pour ce compte.');
        const portal = await stripe.billingPortal.sessions.create({ customer: account.customer_id, return_url: `${config.origin}/#workspace` });
        return { url: portal.url };
      });
    },

    async event(event) {
      if (event.livemode !== config.livemode || event.account) throw new HttpError(400, 'Événement Stripe non autorisé.');
      const object = event.data?.object;
      let subscriptionId;
      let customerId = objectId(object?.customer);
      if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) subscriptionId = objectId(object?.subscription);
      else if (['invoice.paid', 'invoice.payment_failed', 'invoice.payment_action_required', 'invoice.voided', 'invoice.marked_uncollectible'].includes(event.type)) subscriptionId = objectId(object?.parent?.subscription_details?.subscription);
      else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.resumed'].includes(event.type)) subscriptionId = object?.id;
      else if (['charge.refunded', 'charge.dispute.created', 'charge.dispute.updated', 'charge.dispute.closed'].includes(event.type)) {
        const chargeId = event.type === 'charge.refunded' ? object?.id : objectId(object?.charge);
        if (!chargeId) return { received: true, ignored: true };
        const charge = await stripe.charges.retrieve(chargeId);
        if (charge.livemode !== config.livemode) throw mismatch();
        customerId = objectId(charge.customer);
        const relatedAccount = customerId ? await store.customer(customerId) : null;
        subscriptionId = relatedAccount?.subscription_id;
      }
      else return { received: true, ignored: true };
      if (!subscriptionId || !customerId) return { received: true, ignored: true };
      const account = await store.customer(customerId);
      if (!account || account.livemode !== config.livemode) return { received: true, ignored: true };
      await withLock(account.user_id, (fresh, save) => sync(fresh, save, subscriptionId, event.id));
      return { received: true };
    }
  };
}
