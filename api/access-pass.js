import { authenticate, method, parseBody, HttpError, jsonError } from '../server/http.js';
import { redeemAccessPass } from '../server/access-pass.js';

export function createAccessPassHandler({ auth = authenticate, redeem = redeemAccessPass } = {}) {
  return async function handler(req, res) {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    try {
      method(req, res, 'POST');
      const { user, admin } = await auth(req);
      const body = parseBody(req);
      if (Object.keys(body).length !== 1 || !Object.hasOwn(body, 'token')) {
        throw new HttpError(400, 'La demande d’activation est invalide.', 'access_pass_invalid');
      }
      return res.status(200).json(await redeem(admin, user.id, body.token));
    } catch (error) { return jsonError(res, error); }
  };
}

export default createAccessPassHandler();
