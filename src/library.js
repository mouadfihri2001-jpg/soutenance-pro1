export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/[’'\-]/g, ' ').trim();
}

export function matchesResource(resource, query, topic = 'all') {
  const terms = normalizeSearch(query).slice(0, 240).split(/\s+/).filter(Boolean);
  const text = normalizeSearch(resource.text);
  return (topic === 'all' || String(resource.topic).split(' ').includes(topic)) && terms.every(term => text.includes(term));
}

export function setupLibrary(doc) {
  const form = doc.querySelector('[data-library-form]');
  if (!form) return;
  const query = form.querySelector('[name="q"]');
  const topic = form.querySelector('[name="topic"]');
  const resultCount = doc.querySelector('#library-count');
  const empty = doc.querySelector('#library-empty');
  const reset = form.querySelector('[type="reset"]');
  const items = [...doc.querySelectorAll('[data-resource]')];
  const groups = [...doc.querySelectorAll('[data-resource-group]')];
  const filter = () => {
    let count = 0;
    for (const item of items) {
      item.hidden = !matchesResource({ text: item.dataset.search, topic: item.dataset.topic }, query.value, topic.value);
      if (!item.hidden) count++;
    }
    for (const group of groups) group.hidden = ![...group.querySelectorAll('[data-resource]')].some(item => !item.hidden);
    resultCount.textContent = `${count} ressource${count === 1 ? '' : 's'} disponible${count === 1 ? '' : 's'}`;
    empty.hidden = count !== 0;
    reset.hidden = !query.value && topic.value === 'all';
  };
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  query.addEventListener('input', filter);
  topic.addEventListener('change', filter);
  form.addEventListener('reset', event => { event.preventDefault(); query.value = ''; topic.value = 'all'; filter(); query.focus(); });
  form.hidden = false;
  filter();
}

if (typeof document !== 'undefined') setupLibrary(document);
