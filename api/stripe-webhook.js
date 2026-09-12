import { createClient } from '@supabase/supabase-js';
import { inspectConfiguration } from '../server/runtime-config.js';
import { billingConfiguration, createStripeClient, createBillingService } from '../server/billing.js';
import { createBillingStore } from '../server/billing-store.js';

const respond = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const BODY_LIMIT = 512 * 1024;

async function rawBody(request) {
  const size = Number(request.headers.get('content-length'));
  if (size > BODY_LIMIT) throw new Error('Body too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > BODY_LIMIT) { await reader.cancel(); throw new Error('Body too large'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, total);
}

function adminClient(env) {
  const inspected = inspectConfiguration(env);
  if (!inspected.authReady || inspected.missing.includes('SUPABASE_SERVICE_ROLE_KEY') || inspected.invalid.includes('SUPABASE_SERVICE_ROLE_KEY')) throw new Error('Server configuration unavailable');
  return createClient(inspected.supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY.trim(), { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(10000) }) } });
}

export function createStripeWebhookHandler({ env = () => process.env, stripeFactory = createStripeClient, adminFactory = adminClient, serviceFactory = createBillingService } = {}) {
  return async request => {
    if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
    const environment = env();
    const config = billingConfiguration(environment);
    if (!config.ready) return respond({ error: 'Billing unavailable' }, 503);
    const stripe = stripeFactory(config);
    let event;
    try {
      const signature = request.headers.get('stripe-signature');
      if (!signature || signature.length > 2000) throw new Error('Missing signature');
      // Native Vercel Web Request: never use parsed request.body or JSON
      // reserialization for Stripe signature verification.
      event = stripe.webhooks.constructEvent(await rawBody(request), signature, config.webhookSecret);
    } catch { return respond({ error: 'Invalid webhook signature or payload' }, 400); }
    try {
      const store = createBillingStore(adminFactory(environment));
      const service = serviceFactory({ stripe, store, config });
      return respond(await service.event(event));
    } catch (error) {
      // Retries must remain enabled after a lock conflict or failed ledger write.
      return respond({ error: 'Webhook processing unavailable' }, error.status === 400 ? 400 : 503);
    }
  };
}

export const POST = createStripeWebhookHandler();
