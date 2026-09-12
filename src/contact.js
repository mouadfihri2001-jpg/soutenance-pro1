export const INSTAGRAM_URL = 'https://www.instagram.com/soutenancepro.co/';
export const WHATSAPP_URL = 'https://wa.me/212680241471';
export const CONTACT_EMAIL = 'contact@soutenancepro.com';
export const CONTACT_EMAIL_URL = 'mailto:' + CONTACT_EMAIL;

const instagramIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg>';
const whatsappIcon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.7A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="m8.1 7.4 1.3-.1 1.1 2.5-1 1.1a7.2 7.2 0 0 0 3.5 3.4l1.1-1 2.5 1.1-.1 1.3c-.1 1-1.2 1.6-2.1 1.3a11.6 11.6 0 0 1-7.6-7.5c-.3-.9.3-2 1.3-2.1Z"/></svg>';

export const contactStyles = `
.sp-contact-floating{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));z-index:1100;display:flex;align-items:center;gap:8px}
.sp-contact-floating a,.sp-contact-inline a{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:48px;font:600 14px/1.4 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none}
.sp-contact-floating a{padding:11px 16px;border:1px solid #c4d6cb;border-radius:28px;background:#fff;color:#004d35;box-shadow:0 4px 18px #00372618}
.sp-contact-floating a:hover{background:#edf5ef;border-color:#004d35}
.sp-contact-floating .sp-contact-whatsapp{background:#004d35;color:#fff;border-color:#004d35}
.sp-contact-floating .sp-contact-whatsapp:hover{background:#003726;color:#fff}
.sp-contact-floating a:focus-visible,.sp-contact-inline a:focus-visible{outline:3px solid #bd7b1e;outline-offset:4px}
.sp-contact-floating svg,.sp-contact-inline svg{flex:none}
.sp-contact-inline{display:flex;align-items:center;flex-wrap:wrap;gap:4px 22px;margin:16px 0 0;font-size:14px}
.sp-contact-inline a{color:#005b3e;text-decoration:underline;text-underline-offset:4px}
.sp-contact-inline .sp-contact-email{max-width:100%;text-align:left;overflow-wrap:anywhere}
body.sp-open .sp-contact-floating,.sp-notice:not([hidden])~.sp-contact-floating{display:none}
@media(max-width:550px){.sp-contact-floating{right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom))}.sp-contact-floating a{padding:11px 13px;font-size:13px}.sp-contact-floating .sp-contact-instagram span{display:none}.sp-contact-floating .sp-contact-instagram{width:48px;padding:11px}}
@media print{.sp-contact-floating,.sp-contact-inline{display:none}}
`;

export function renderContactLinks({ floating = false } = {}) {
  const links = `<a class="sp-contact-whatsapp" href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" aria-label="Contacter Soutenance Pro sur WhatsApp au +212 680 241 471 (nouvel onglet)">${whatsappIcon}<span>WhatsApp</span></a><a class="sp-contact-instagram" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Contacter Soutenance Pro sur Instagram (nouvel onglet)">${instagramIcon}<span>Instagram</span></a>`;
  return floating
    ? `<nav class="sp-contact-floating" aria-label="Contact Soutenance Pro">${links}</nav>`
    : `<nav class="sp-contact-inline" aria-label="Contacter Soutenance Pro">${links}<a class="sp-contact-email" href="${CONTACT_EMAIL_URL}" aria-label="Écrire à Soutenance Pro pour une question ou une collaboration"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg><span>${CONTACT_EMAIL}</span></a></nav>`;
}

export const renderInstagramContact = renderContactLinks;

export function installPublicContact() {
  if (!document.getElementById('sp-contact-styles')) {
    const style = document.createElement('style');
    style.id = 'sp-contact-styles';
    style.textContent = contactStyles;
    document.head.append(style);
  }
  if (!document.querySelector('.sp-contact-floating')) {
    document.body.insertAdjacentHTML('beforeend', renderContactLinks({ floating: true }));
  }
}
