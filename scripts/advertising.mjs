// Publisher identifiers are public, but must come from the owner's AdSense account.
// Preview builds never verify ownership or request ads, even with inherited settings.
export function advertisingConfiguration(env = process.env) {
  const off = { mode: 'off', clientId: '', slotId: '' };
  if (env.VERCEL_ENV !== 'production') return off;
  const mode = env.ADSENSE_MODE?.trim() || 'off';
  if (!['off', 'verify', 'ads'].includes(mode)) {
    throw new Error('ADSENSE_MODE must be off, verify or ads.');
  }
  if (mode === 'off') return off;
  const clientId = env.ADSENSE_CLIENT_ID?.trim() || '';
  if (!/^ca-pub-\d{16}$/.test(clientId)) {
    throw new Error('ADSENSE_CLIENT_ID must be the publisher ID supplied by AdSense.');
  }
  const slotId = mode === 'ads' ? env.ADSENSE_GUIDE_SLOT_ID?.trim() || '' : '';
  if (mode === 'ads' && !/^\d{1,20}$/.test(slotId)) {
    throw new Error('ADSENSE_GUIDE_SLOT_ID is required for ads mode.');
  }
  return { mode, clientId, slotId };
}

export function advertisingVerification(config) {
  return config.mode === 'off' ? '' : `<meta name="google-adsense-account" content="${config.clientId}">`;
}

export function adsTxt(config) {
  return config.mode === 'off' ? '' : `google.com, ${config.clientId.slice(3)}, DIRECT, f08c47fec0942fa0\n`;
}

// Only substantive, original guides get a single, clearly labelled display unit.
// The shared homepage also hosts login, workspace and activation routes, so it
// must not load advertising scripts. Catalogue notices and policy pages do not either.
export function guideAdvertising(page, context) {
  const config = context.advertising;
  if (!context.production || config?.mode !== 'ads' || page.kind !== 'guide' || !page.slug.startsWith('guides/')) {
    return { head: '', body: '' };
  }
  return {
    head: `<link rel="stylesheet" href="/assets/advertising.css"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}" crossorigin="anonymous"></script>`,
    body: `<aside class="guide-ad" aria-label="Publicité"><span class="guide-ad-label">Publicité</span><ins class="adsbygoogle" style="display:block" data-ad-client="${config.clientId}" data-ad-slot="${config.slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside><script>(window.adsbygoogle = window.adsbygoogle || []).push({});</script>`
  };
}
