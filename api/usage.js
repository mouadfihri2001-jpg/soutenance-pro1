import { authenticate, HttpError, jsonError, method } from '../server/http.js';

const LIMITS = { free: 3, offre: 60, max: 150 };

export function createUsageHandler(auth = authenticate, clock = () => new Date()) {
  return async function handler(req, res) {
    try {
      method(req, res, 'GET');
      const { db, user } = await auth(req);
      const now = clock();
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const [account, jobs] = await Promise.all([
        db.from('student_accounts').select('plan,subscription_expires_at').eq('user_id', user.id).single(),
        db.from('student_ai_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'failed').gte('created_at', month.toISOString())
      ]);
      if (account.error || !account.data || jobs.error || !Number.isSafeInteger(jobs.count) || jobs.count < 0) {
        throw new HttpError(503, 'Le compteur ne peut pas être chargé. Réessaie dans un instant.', 'usage_unavailable');
      }
      const a = account.data;
      const paid = ['offre', 'max'].includes(a.plan) && a.subscription_expires_at && new Date(a.subscription_expires_at) > now;
      const plan = paid ? a.plan : 'free';
      const limit = LIMITS[plan];
      return res.status(200).json({ plan, limit, used: jobs.count, remaining: Math.max(0, limit - jobs.count), resetsAt: nextMonth.toISOString() });
    } catch (error) {
      return jsonError(res, error);
    }
  };
}

export default createUsageHandler();
