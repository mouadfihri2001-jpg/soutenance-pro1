// Progressive enhancement: public content remains visible when motion is unavailable.
const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const running = new Set();
const elementAnimations = new WeakMap();
const demoCleanups = [];
const revealSelector = '[data-reveal], .discovery-collection, .home-topic, .home-price, .home-tool-link, .home-step-grid > article, .library-pathways > a, .library-owned-card, .library-country-card, .template-card, .guide-card, .provider-card, .library-project-bridge, .start-action, .start-research, .start-metrics, .product-demo';
let observer;

function reveal(element, delay = 0, duration = 480, distance = 14) {
  if (reduced?.matches || typeof element.animate !== 'function') return;
  // A panel change may happen while its demo container is entering the viewport.
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (elementAnimations.has(parent)) return;
  }
  elementAnimations.get(element)?.cancel();
  const animation = element.animate([
    { opacity: 0.55, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration, delay, easing: 'cubic-bezier(.22,.7,.25,1)', fill: 'none' });
  running.add(animation);
  elementAnimations.set(element, animation);
  const finished = () => {
    running.delete(animation);
    if (elementAnimations.get(element) === animation) elementAnimations.delete(element);
  };
  animation.finished.then(finished, finished);
}

if (!reduced?.matches && 'IntersectionObserver' in window) {
  observer = new IntersectionObserver(entries => {
    let index = 0;
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting || target.closest('[hidden]')) continue;
      observer.unobserve(target);
      // Do not animate a child independently when its parent is already being revealed.
      if (!target.parentElement?.closest(revealSelector)) reveal(target, (index++ % 3) * 55);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  [...document.querySelectorAll(revealSelector)].slice(0, 100).forEach(element => observer.observe(element));
}

function setupDemo(root) {
  const tablist = root.querySelector('[data-demo-tabs]');
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll('[data-demo-tab]')];
  const panels = [...root.querySelectorAll('[data-demo-panel]')];
  const orderedPanels = tabs.map(tab => panels.find(panel => panel.dataset.demoPanel === tab.dataset.demoTab));
  // Keep the static example usable if the markup is incomplete.
  if (tabs.length < 2 || panels.length !== tabs.length || new Set(orderedPanels).size !== tabs.length ||
      orderedPanels.some((panel, index) => !panel || !panel.id || !tabs[index].id ||
        tabs[index].getAttribute('aria-controls') !== panel.id ||
        panel.getAttribute('aria-labelledby') !== tabs[index].id)) return;

  let active = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
  function select(index, focus = false, animate = true) {
    const changed = index !== active;
    active = index;
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      orderedPanels[position].hidden = !selected;
      if (!selected) elementAnimations.get(orderedPanels[position])?.cancel();
    });
    if (focus) tabs[index].focus();
    if (changed && animate) reveal(orderedPanels[index], 0, 220, 8);
  }
  function eventTab(event) {
    return tabs.indexOf(event.target.closest?.('[data-demo-tab]'));
  }
  function click(event) {
    const index = eventTab(event);
    if (index !== -1) select(index);
  }
  function keydown(event) {
    const index = eventTab(event);
    if (index === -1 || event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    select(next, true);
  }
  select(active, false, false);
  tablist.addEventListener('click', click);
  tablist.addEventListener('keydown', keydown);
  tablist.hidden = false;
  demoCleanups.push(() => {
    tablist.removeEventListener('click', click);
    tablist.removeEventListener('keydown', keydown);
    tablist.hidden = true;
  });
}
document.querySelectorAll('[data-product-demo]').forEach(setupDemo);

function revealAnswer(event) {
  const details = event.target;
  if (!details.matches?.('.home-faq-list details[open]') || reduced?.matches) return;
  const content = details.querySelector('p');
  if (content) reveal(content);
}
document.addEventListener('toggle', revealAnswer, true);

function stopMotion(event) {
  if (!event.matches) return;
  observer?.disconnect();
  for (const animation of running) animation.cancel();
  running.clear();
}
reduced?.addEventListener?.('change', stopMotion);
function cleanupPage(event) {
  observer?.disconnect();
  for (const animation of running) animation.cancel();
  running.clear();
  // A page restored from the back-forward cache still needs its tab controls.
  if (event.persisted) return;
  reduced?.removeEventListener?.('change', stopMotion);
  document.removeEventListener('toggle', revealAnswer, true);
  window.removeEventListener('pagehide', cleanupPage);
  demoCleanups.forEach(cleanup => cleanup());
}
window.addEventListener('pagehide', cleanupPage);
