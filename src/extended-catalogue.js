import { LIBRARY_SCOPE } from '../shared/library-scope.js';
import { referenceRIS, referenceBib } from '../shared/reference-format.js';

const types = {ART:'Article', THESE:'Thèse', MEM:'Mémoire', REPORT:'Rapport de recherche', HDR:'Habilitation'};
const currentYear = () => LIBRARY_SCOPE.maxYear;

export function extendedParams(values = {}, page = 1) {
  const params = new URLSearchParams();
  params.set('q', String(values.q || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, LIBRARY_SCOPE.queryLength));
  const discipline = String(values.discipline || 'all');
  params.set('discipline', /^[a-z-]{1,40}$/.test(discipline) ? discipline : 'all');
  params.set('type', Object.hasOwn(types, values.type) ? values.type : 'all');
  const year = Number(values.year);
  params.set('year', Number.isInteger(year) && year >= 2016 && year <= currentYear() ? String(year) : 'all');
  params.set('page', String(Math.max(1, Math.min(100, Number.isInteger(Number(page)) ? Number(page) : 1))));
  return params;
}

function archiveUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
      (u.hostname === 'hal.inrae.fr' || ['hal.science','archives-ouvertes.fr','ccsd.cnrs.fr'].some(host => u.hostname === host || u.hostname.endsWith('.' + host)));
  } catch { return false; }
}

export function safeExtendedRecord(record) {
  return Boolean(record && typeof record.id === 'string' && /^[a-z][a-z0-9-]{1,99}$/.test(record.id) &&
    typeof record.title === 'string' && record.title.length > 0 && record.title.length <= 2000 &&
    Array.isArray(record.authors) && record.authors.every(a => typeof a === 'string') &&
    Number.isInteger(record.year) && record.year >= 2016 && record.year <= currentYear() &&
    Object.hasOwn(types, record.type) && archiveUrl(record.sourceUrl) && archiveUrl(record.fileUrl));
}

function node(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function exportReference(record, format) {
  const reference = {...record, url:record.sourceUrl};
  const content = format === 'ris' ? referenceRIS(reference) : referenceBib(reference);
  const url = URL.createObjectURL(new Blob([content], {type:'text/plain;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = record.id + '.' + format; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resultCard(doc, record) {
  const article = node(doc, 'article', 'search-result extended-result');
  article.append(node(doc, 'p', 'resource-type', `${types[record.type]} · ${record.year} · Français`));
  const heading = node(doc, 'h3');
  const title = node(doc, 'a', '', record.title);
  title.href = record.sourceUrl; title.target = '_blank'; title.rel = 'noopener noreferrer';
  heading.append(title); article.append(heading);
  article.append(node(doc, 'p', 'document-authors', record.authors.slice(0, 4).join(', ') + (record.authors.length > 4 ? ' et al.' : '')));
  article.append(node(doc, 'p', 'document-origin', `HAL · ${record.id} · Fichier déclaré par le dépôt`));
  const actions = node(doc, 'div', 'search-result-actions');
  const open = node(doc, 'a', '', 'Ouvrir le document ↗');
  open.href = record.fileUrl; open.target = '_blank'; open.rel = 'noopener noreferrer';
  actions.append(open);
  for (const [format, label] of [['ris', 'Zotero · RIS'], ['bib', 'BibTeX']]) {
    const button = node(doc, 'button', 'save-reference', label);
    button.type = 'button'; button.addEventListener('click', () => exportReference(record, format));
    actions.append(button);
  }
  article.append(actions); return article;
}

export function setupExtendedCatalogue(doc = document, fetcher = fetch) {
  const root = doc.querySelector('[data-catalogue]');
  if (!root) return;
  const modeNav = root.querySelector('[data-catalogue-modes]');
  const local = root.querySelector('[data-local-panel]'), extended = root.querySelector('[data-extended-panel]');
  if (!modeNav || !local || !extended) return;
  const form = extended.querySelector('[data-extended-form]');
  const status = extended.querySelector('[data-extended-status]'), results = extended.querySelector('[data-extended-results]');
  const pagination = extended.querySelector('[data-extended-pagination]'), limitation = extended.querySelector('[data-extended-limitation]');
  const previous = pagination.querySelector('[data-direction="previous"]'), next = pagination.querySelector('[data-direction="next"]');
  const query = new URLSearchParams(doc.defaultView.location.search);
  form.elements.q.value = (query.get('q') || '').slice(0, LIBRARY_SCOPE.queryLength);
  let request = 0, controller, loaded = false, active = {}, page = 1, maxPage = 1;

  const search = async (values, targetPage = 1) => {
    const token = ++request;
    controller?.abort(); controller = new AbortController();
    const requestController = controller;
    const timer = setTimeout(() => requestController.abort(), 18000);
    active = {...values};
    results.setAttribute('aria-busy', 'true');
    status.textContent = 'Recherche dans les archives HAL…';
    previous.disabled = true; next.disabled = true;
    form.querySelector('[type="submit"]').disabled = true;
    try {
      const response = await fetcher('/api/library-search?' + extendedParams(values, targetPage), {signal:requestController.signal});
      if (!response.ok) throw new Error('search-unavailable');
      const data = await response.json();
      if (token !== request) return;
      if (!Array.isArray(data.records) || data.records.length > 24 || !data.records.every(safeExtendedRecord) || !Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.page) || data.page < 1 || data.page > 100 || data.pageSize !== 24) throw new Error('invalid-response');
      page = data.page; maxPage = Math.min(100, Math.max(1, Math.ceil(data.total / 24)));
      loaded = true;
      results.replaceChildren(...data.records.map(record => resultCard(doc, record)));
      status.textContent = data.total ? `${data.total.toLocaleString('fr-FR')} dépôts trouvés dans HAL · ${data.records.length} références affichées sur cette page` : 'Aucun dépôt trouvé. Essaie un terme plus large ou une autre discipline.';
      const limited = page >= maxPage && data.total > maxPage * 24;
      limitation.hidden = !limited;
      limitation.textContent = limited ? 'Pour explorer d’autres résultats, précise un sujet, une discipline, un type de publication ou une année.' : '';
      pagination.querySelector('[data-extended-page]').textContent = `Page ${page} / ${maxPage}`;
      pagination.hidden = data.total <= 24;
      previous.disabled = page <= 1; next.disabled = !data.hasMore || page >= maxPage;
      if (data.total && !data.records.length) status.textContent += '. Les liens de cette page n’ont pas pu être validés ; essaie la page suivante ou consulte HAL directement.';
    } catch {
      if (token !== request) return;
      results.replaceChildren(); pagination.hidden = true; limitation.hidden = true;
      status.textContent = 'HAL ne répond pas pour le moment. Réessaie, ou ouvre « Guides & sélection » pour consulter les ressources déjà disponibles.';
    } finally {
      clearTimeout(timer);
      if (token === request) {
        results.setAttribute('aria-busy', 'false');
        form.querySelector('[type="submit"]').disabled = false;
      }
    }
  };

  const mode = name => {
    const isExtended = name === 'hal';
    local.hidden = isExtended; extended.hidden = !isExtended;
    for (const button of modeNav.querySelectorAll('[data-scope]')) button.setAttribute('aria-pressed', String(button.dataset.scope === name));
    if (isExtended && !loaded) search(Object.fromEntries(new FormData(form)));
  };
  modeNav.addEventListener('click', event => {
    const name = event.target.closest('[data-scope]')?.dataset.scope;
    if (name === 'local' || name === 'hal') mode(name);
  });
  form.addEventListener('submit', event => {event.preventDefault(); search(Object.fromEntries(new FormData(form)));});
  form.addEventListener('reset', () => setTimeout(() => search(Object.fromEntries(new FormData(form))), 0));
  pagination.addEventListener('click', event => {
    const direction = event.target.closest('[data-direction]')?.dataset.direction;
    if (direction !== 'previous' && direction !== 'next') return;
    search(active, Math.max(1, Math.min(maxPage, page + (direction === 'next' ? 1 : -1))));
    status.scrollIntoView({block:'start', behavior:'auto'});
  });
  modeNav.hidden = false;
  mode(query.get('scope') === 'hal' ? 'hal' : 'local');
}
