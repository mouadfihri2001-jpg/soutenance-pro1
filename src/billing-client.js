// URL parameters only choose a verification flow. They never grant an offer.
export function paymentReturnData(search = '') {
  const query = new URLSearchParams(search);
  if (query.get('checkout') === 'cancelled') return { status: 'cancelled' };
  if (query.get('checkout') !== 'success') return null;
  const sessionId = query.get('session_id');
  if (!sessionId || !/^cs_(?:test_|live_)?[A-Za-z0-9]{8,220}$/.test(sessionId)) return { status: 'invalid' };
  return { status: 'pending', sessionId };
}

export function safeStripeUrl(value, kind = 'checkout') {
  if (typeof value !== 'string' || value.length > 4096) throw new Error('Le lien de paiement reçu n’est pas valide.');
  let url;
  try { url = new URL(value); } catch { throw new Error('Le lien de paiement reçu n’est pas valide.'); }
  const host = kind === 'portal' ? 'billing.stripe.com' : 'checkout.stripe.com';
  if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password || url.port) throw new Error('Le lien de paiement reçu n’est pas valide.');
  return url.href;
}
