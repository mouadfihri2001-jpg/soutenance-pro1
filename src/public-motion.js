// Progressive enhancement: public content remains visible when motion is unavailable.
const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const running = new Set();
let observer;

function reveal(element, delay = 0) {
  if (reduced?.matches || typeof element.animate !== 'function') return;
  const animation = element.animate([
    { opacity: 0.55, transform: 'translateY(14px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 480, delay, easing: 'cubic-bezier(.22,.7,.25,1)', fill: 'none' });
  running.add(animation);
  animation.finished.then(() => running.delete(animation), () => running.delete(animation));
}

if (!reduced?.matches && 'IntersectionObserver' in window) {
  const selector = '[data-reveal], .discovery-collection, .home-topic, .home-price, .home-tool-link, .home-step-grid > article, .library-pathways > a, .library-owned-card, .library-country-card, .template-card, .guide-card, .provider-card, .library-project-bridge';
  observer = new IntersectionObserver(entries => {
    let index = 0;
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting || target.closest('[hidden]')) continue;
      observer.unobserve(target);
      // Do not animate a child independently when its parent is already being revealed.
      if (!target.parentElement?.closest('[data-reveal]')) reveal(target, (index++ % 3) * 55);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  [...document.querySelectorAll(selector)].slice(0, 100).forEach(element => observer.observe(element));
}

document.addEventListener('toggle', event => {
  const details = event.target;
  if (!details.matches?.('.home-faq-list details[open]') || reduced?.matches) return;
  const content = details.querySelector('p');
  if (content) reveal(content);
}, true);

function stopMotion(event) {
  if (!event.matches) return;
  observer?.disconnect();
  for (const animation of running) animation.cancel();
  running.clear();
}
reduced?.addEventListener?.('change', stopMotion);
window.addEventListener('pagehide', () => {
  observer?.disconnect();
  for (const animation of running) animation.cancel();
  running.clear();
}, { once: true });
