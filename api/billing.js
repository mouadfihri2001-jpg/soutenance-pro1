import { authenticate, parseBody, HttpError, jsonError } from '../server/http.js';
import { billingConfiguration, createStripeClient, createBillingService } from '../server/billing.js';
import { createBillingStore } from '../server/billing-store.js';

export function createBillingHandler({ auth = authenticate, env = () => process.env, serviceFactory = createBillingService, stripeFactory = createStripeClient } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (!['GET', 'POST'].includes(req.method)) {
        res.setHeader('Allow', 'GET, POST');
        throw new HttpError(405, 'Méthode non autorisée.');
      }
      const { user, admin } = await auth(req);
      const config = billingConfiguration(env());
      if (!config.ready) {
        if (req.method === 'GET') return res.status(200).json({ ready: false, canManage: false, canSubscribe: false });
        throw new HttpError(503, 'Le paiement automatique est en cours de configuration.', 'billing_unavailable');
      }
      const service = serviceFactory({ config, stripe: stripeFactory(config), store: createBillingStore(admin) });
      if (req.method === 'GET') return res.status(200).json(await service.status(user.id));
      const body = parseBody(req);
      let result;
      if (body.action === 'checkout') result = await service.checkout(user, body.plan);
      else if (body.action === 'confirm') result = await service.confirm(user.id, body.sessionId);
      else if (body.action === 'portal') result = await service.portal(user.id);
      else throw new HttpError(400, 'Action de paiement invalide.');
      return res.status(200).json(result);
    } catch (error) { return jsonError(res, error); }
  };
}

export default createBillingHandler();
