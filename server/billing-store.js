import { HttpError } from './http.js';

const unavailable = () => new HttpError(503, 'Le paiement est momentanément indisponible. Réessaie dans un instant.', 'billing_unavailable');

// This adapter receives the server-only service client. Browser roles have no
// table or RPC privileges, including through Supabase default function grants.
export function createBillingStore(admin) {
  async function rpc(name, args) {
    const result = await admin.rpc(name, args);
    if (result.error || result.data === null || result.data === undefined) throw unavailable();
    return result.data;
  }
  async function read(table, key, value) {
    const { data, error } = await admin.from(table).select('*').eq(key, value).maybeSingle();
    if (error) throw unavailable();
    return data;
  }
  return {
    account: userId => read('student_billing_accounts', 'user_id', userId),
    customer: customerId => read('student_billing_accounts', 'customer_id', customerId),
    attempt: id => read('student_billing_attempts', 'id', id),
    session: id => read('student_billing_attempts', 'session_id', id),
    async lock(userId, livemode, token) {
      const value = await rpc('student_billing_lock', { p_user_id: userId, p_livemode: livemode, p_token: token });
      if (!value.acquired) throw new HttpError(409, 'Une vérification du paiement est déjà en cours. Réessaie dans quelques secondes.', 'billing_busy');
      return value.account;
    },
    save: (userId, token, change) => rpc('student_billing_save', { p_user_id: userId, p_token: token, p_change: change }),
    release: (userId, token) => rpc('student_billing_release', { p_user_id: userId, p_token: token })
  };
}
