const QUERY_LIMIT = 240;

export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/[’'\-]/g, ' ').trim();
}

const matchesText = (text, query) => {
  const terms = normalizeSearch(String(query || '').slice(0, QUERY_LIMIT)).split(/\s+/).filter(Boolean);
  const haystack = normalizeSearch(text);
  return terms.every(term => haystack.includes(term));
};
const matchesChoice = (values, choice) => choice === 'all' || String(values || '').split(/\s+/).includes(choice);

export function matchesResource(resource, query, topic = 'all', format = 'all') {
  return matchesChoice(resource.topic, topic) && matchesChoice(resource.format, format) && matchesText(resource.text, query);
}

export function matchesInstitution(institution, query, country = 'all') {
  return matchesChoice(institution.country, country) && matchesText(institution.text, query);
}

function setupSearch(doc, { prefix, itemSelector, groupSelector, choices, matches, describe }) {
  const form = doc.querySelector(`[data-${prefix}-form]`);
  if (!form) return;
  const query = form.querySelector('[name="q"]');
  const controls = choices.map(name => form.querySelector(`[name="${name}"]`));
  const resultCount = doc.querySelector(`#${prefix}-count`);
  const empty = doc.querySelector(`#${prefix}-empty`);
  const reset = form.querySelector('[type="reset"]');
  if (!query || controls.some(control => !control) || !resultCount || !empty || !reset) return;
  const items = [...doc.querySelectorAll(itemSelector)];
  const groups = groupSelector ? [...doc.querySelectorAll(groupSelector)] : [];

  // Country guides may link into an allowlisted institutional selection.
  const params = new URLSearchParams(doc.defaultView?.location?.search || '');
  const initial = params.get('q');
  if (initial !== null) query.value = initial.slice(0, QUERY_LIMIT);
  if(prefix==='institutions'){
    const country=params.get('country');
    if(['FR','MA','DZ','TN'].includes(country))controls[choices.indexOf('country')].value=country;
  }

  const filter = () => {
    let count = 0;
    for (const item of items) {
      item.hidden = !matches({ ...item.dataset, text: item.dataset.search }, query.value, ...controls.map(control => control.value));
      if (!item.hidden) count++;
    }
    for (const group of groups) group.hidden = ![...group.querySelectorAll(itemSelector)].some(item => !item.hidden);
    resultCount.textContent = describe(count);
    empty.hidden = count !== 0;
    reset.hidden = !query.value && controls.every(control => control.value === 'all');
  };
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  query.addEventListener('input', filter);
  controls.forEach(control => control.addEventListener('change', filter));
  form.addEventListener('reset', event => {
    event.preventDefault();
    query.value = '';
    controls.forEach(control => { control.value = 'all'; });
    filter();
    query.focus();
  });
  filter();
  form.hidden = false;
}

export function setupLibrary(doc) {
  setupSearch(doc, {
    prefix: 'library', itemSelector: '[data-resource]', groupSelector: '[data-resource-group]', choices: ['topic', 'format'], matches: matchesResource,
    describe: count => `${count} ressource${count === 1 ? '' : 's'} disponible${count === 1 ? '' : 's'}`
  });
}

export function setupInstitutions(doc) {
  setupSearch(doc, {
    prefix: 'institutions', itemSelector: '[data-institution]', choices: ['country'], matches: matchesInstitution,
    describe: count => `${count} établissement${count === 1 ? '' : 's'} dans cette sélection`
  });
}

if (typeof document !== 'undefined') {
  setupLibrary(document);
  setupInstitutions(document);
}
