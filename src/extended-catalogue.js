import { LIBRARY_SCOPE, LIBRARY_LANGUAGES, LIBRARY_PERIODS, HAL_DOCUMENT_TYPES } from '../shared/library-scope.js';
import { referenceRIS, referenceBib } from '../shared/reference-format.js';
import { mountLibraryNotes, readSavedReadings, removeSavedReading, findSavedReading, normalizeReadingReference } from './library-notes.js';

const types = {...HAL_DOCUMENT_TYPES, OTHER:'Autre document'};
export function recordLanguageLabel(record) {
  const codes = Array.isArray(record.languages) ? record.languages.filter(code => typeof code === 'string' && /^[a-z]{2,3}$/.test(code)).slice(0,8) : [];
  if (!codes.length) return 'Langue non précisée';
  const labels = {fr:'Français',en:'Anglais',ar:'Arabe',es:'Espagnol',de:'Allemand',it:'Italien',pt:'Portugais'};
  return [...new Set(codes)].map(code => labels[code] || code.toUpperCase()).join(', ');
}
const currentYear = () => LIBRARY_SCOPE.maxYear;

export function extendedParams(values = {}, page = 1) {
  const params = new URLSearchParams();
  params.set('q', String(values.q || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, LIBRARY_SCOPE.queryLength));
  const discipline = String(values.discipline || 'all');
  params.set('discipline', /^[a-z-]{1,40}$/.test(discipline) ? discipline : 'all');
  params.set('type', Object.hasOwn(HAL_DOCUMENT_TYPES, values.type) ? values.type : 'all');
  params.set('language', LIBRARY_LANGUAGES.includes(values.language) ? values.language : 'all');
  const period = LIBRARY_PERIODS.includes(values.period) ? values.period : 'all';
  params.set('period', period);
  const year = Number(values.year);
  params.set('year', Number.isInteger(year) && year >= (period === 'recent' ? LIBRARY_SCOPE.minYear : LIBRARY_SCOPE.archiveMinYear) && year <= currentYear() ? String(year) : 'all');
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
    Array.isArray(record.authors) && record.authors.length <= 100 && record.authors.every(a => typeof a === 'string' && a.length <= 200) &&
    Number.isInteger(record.year) && record.year >= LIBRARY_SCOPE.archiveMinYear && record.year <= currentYear() &&
    Object.hasOwn(types, record.type) &&
    (record.languages === undefined || (Array.isArray(record.languages) && record.languages.length <= 8 && record.languages.every(code => typeof code === 'string' && /^[a-z]{2,3}$/.test(code)))) &&
    (record.sourceType === undefined || (typeof record.sourceType === 'string' && /^[A-Z_]{1,40}$/.test(record.sourceType))) && archiveUrl(record.sourceUrl) && archiveUrl(record.fileUrl));
}

function node(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function exportText(doc, content, filename) {
  const url = URL.createObjectURL(new Blob([content], {type:'text/plain;charset=utf-8'}));
  const anchor = doc.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportReference(doc, record, format) {
  const reference = {...record, url:record.sourceUrl};
  exportText(doc, format === 'ris' ? referenceRIS(reference) : referenceBib(reference), record.id + '.' + format);
}

function sourceLink(doc, href, label) {
  const link = node(doc, 'a', '', label);
  link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
}

function resultCard(doc, record, openWorkspace) {
  const article = node(doc, 'article', 'search-result extended-result');
  article.append(node(doc, 'p', 'resource-type', `${types[record.type]} · ${record.year} · ${recordLanguageLabel(record)}`));
  const heading = node(doc, 'h3');
  const title = node(doc, 'button', 'extended-open-title', record.title);
  title.type = 'button'; title.setAttribute('aria-controls', 'library-reading-workspace');
  title.addEventListener('click', () => openWorkspace(record, title));
  heading.append(title); article.append(heading);
  article.append(node(doc, 'p', 'document-authors', record.authors.slice(0, 4).join(', ') + (record.authors.length > 4 ? ' et al.' : '')));
  article.append(node(doc, 'p', 'document-origin', `HAL · ${record.id} · Fichier déclaré par le dépôt`));
  const actions = node(doc, 'div', 'search-result-actions');
  const open = node(doc, 'button', 'open-library-workspace', 'Étudier cette source');
  open.type = 'button'; open.setAttribute('aria-controls', 'library-reading-workspace');
  open.addEventListener('click', () => openWorkspace(record, open));
  actions.append(open);
  for (const [format, label] of [['ris', 'Zotero · RIS'], ['bib', 'BibTeX']]) {
    const button = node(doc, 'button', 'save-reference', label);
    button.type = 'button'; button.addEventListener('click', () => exportReference(doc, record, format));
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
  let storage;
  try { storage = doc.defaultView.localStorage; } catch { storage = null; }
  const savedSection = node(doc,'section','saved-library-readings');
  const savedDetails = node(doc,'details');
  const savedSummary = node(doc,'summary','','Mes lectures sur cet appareil');
  const savedHelp = node(doc,'p','fine','Retrouve les références de tes fiches enregistrées dans ce navigateur, sans compte. Cette liste conserve les 100 dernières lectures enregistrées. Retirer une référence de la liste n’efface pas ses notes.');
  const savedStatus = node(doc,'p','saved-library-status');
  savedStatus.setAttribute('role','status'); savedStatus.setAttribute('aria-live','polite');
  const savedList = node(doc,'ul','saved-library-list');
  savedDetails.append(savedSummary,savedHelp,savedStatus,savedList); savedSection.append(savedDetails);
  form.before(savedSection);
  const workspace = node(doc, 'section', 'library-workspace');
  workspace.id = 'library-reading-workspace'; workspace.hidden = true;
  workspace.setAttribute('aria-labelledby', 'library-reading-title');
  results.before(workspace);
  const drafts = new Map();
  let currentRecord, workspaceTrigger, readDraft, paginationWasHidden = true;
  const captureDraft = () => {
    if (currentRecord && readDraft) drafts.set(currentRecord.id, readDraft());
  };
  const closeWorkspace = (restoreFocus = true) => {
    if (workspace.hidden) return;
    captureDraft(); workspace.hidden = true; results.hidden = false;
    pagination.hidden = paginationWasHidden;
    currentRecord = null; readDraft = null;
    if (restoreFocus) (workspaceTrigger?.isConnected ? workspaceTrigger : savedSummary).focus();
  };
  const openWorkspace = (record, trigger, fromSaved = false) => {
    if (!safeExtendedRecord(record) || (fromSaved && !normalizeReadingReference(record))) return;
    if (!fromSaved && results.getAttribute('aria-busy') === 'true') return;
    captureDraft();
    if (workspace.hidden) paginationWasHidden = pagination.hidden;
    currentRecord = record; workspaceTrigger = trigger;
    const top = node(doc, 'div', 'library-workspace-top');
    const back = node(doc, 'button', 'library-workspace-back', '← Retour aux résultats');
    back.type = 'button'; back.addEventListener('click', () => closeWorkspace());
    top.append(back, node(doc, 'span', 'eyebrow', 'Mon espace de lecture'));
    const title = node(doc, 'h2', 'library-workspace-title', record.title);
    title.id = 'library-reading-title'; title.tabIndex = -1;
    const meta = node(doc, 'p', 'library-workspace-meta', `${types[record.type]} · ${record.year} · ${recordLanguageLabel(record)} · HAL ${record.id}`);
    const grid = node(doc, 'div', 'library-workspace-grid');
    const reference = node(doc, 'div', 'library-workspace-reference');
    reference.append(node(doc, 'h3', '', 'La référence'));
    reference.append(node(doc, 'p', 'document-authors', record.authors.join(', ') || 'Auteur non renseigné dans la notice.'));
    reference.append(node(doc, 'p', 'fine', 'Métadonnées transmises par HAL. Consulte le document original pour vérifier la méthode, les résultats et les pages citées.'));
    const sourceActions = node(doc, 'div', 'library-source-actions');
    sourceActions.append(sourceLink(doc, record.fileUrl, 'Texte intégral chez HAL ↗'), sourceLink(doc, record.sourceUrl, 'Notice d’origine ↗'));
    reference.append(sourceActions);
    const exports = node(doc, 'div', 'search-result-actions');
    for (const [format,label] of [['ris','Exporter RIS · Zotero'],['bib','Exporter BibTeX']]) {
      const button = node(doc, 'button', 'save-reference', label);
      button.type = 'button'; button.addEventListener('click', () => exportReference(doc, record, format));
      exports.append(button);
    }
    reference.append(exports);
    reference.append(node(doc, 'p', 'library-workspace-help', 'La fiche et tes notes restent ici. Le texte intégral s’ouvre dans un nouvel onglet chez son hébergeur ; son accès et ses droits dépendent du dépôt.'));
    const guide = node(doc, 'a', 'library-workspace-help', 'Comment lire un article et vérifier ses sources →');
    guide.href = '/guides/recherche-hal'; reference.append(guide);
    const projectBridge = node(doc,'section','library-project-bridge');
    projectBridge.append(node(doc,'h3','','Prêt à construire ton projet ?'));
    projectBridge.append(node(doc,'p','','Passe à ton plan, tes sections et ta présentation dans ton espace Soutenance Pro.'));
    projectBridge.append(node(doc,'p','fine','1 projet gratuit · 3 générations par mois · Sans carte bancaire. Tes notes de lecture restent dans cet onglet.'));
    const projectActions = node(doc,'div','library-project-actions');
    const startProject = sourceLink(doc,'/#inscription','Commencer mon projet ↗');
    startProject.className = 'site-button';
    startProject.setAttribute('aria-label','Commencer mon projet dans un nouvel onglet');
    projectActions.append(startProject,sourceLink(doc,'/tarifs','Comparer les offres ↗'));
    projectBridge.append(projectActions); reference.append(projectBridge);
    const noteContainer = node(doc, 'div', 'library-workspace-worksheet');
    const worksheet = mountLibraryNotes(noteContainer,record,{
      initialNotes:drafts.get(record.id),
      onChange:notes => drafts.set(record.id,notes),
      onSaved:() => renderSavedReadings()
    });
    readDraft = worksheet.getNotes;
    grid.append(reference,noteContainer); workspace.replaceChildren(top,title,meta,grid);
    workspace.hidden = false; results.hidden = true; pagination.hidden = true;
    title.focus(); workspace.scrollIntoView({block:'start',behavior:'auto'});
  };
  const renderSavedReadings = (message = '') => {
    const saved = readSavedReadings(storage);
    savedSummary.textContent = `Mes lectures sur cet appareil · ${saved.records.length}`;
    savedStatus.textContent = message || (['invalid','unavailable','partial'].includes(saved.status) ? 'Certaines références locales ne peuvent pas être lues. Les notes ne sont pas effacées ; tu peux toujours exporter les fiches déjà ouvertes.' : saved.records.length ? 'Ouvre une lecture pour reprendre tes notes ici.' : 'Enregistre une fiche de lecture pour la retrouver ici.');
    savedList.replaceChildren(...saved.records.map(record => {
      const item = node(doc,'li','saved-library-entry');
      const title = node(doc,'button','saved-library-title',record.title);
      title.type = 'button'; title.setAttribute('aria-controls','library-reading-workspace');
      title.addEventListener('click',() => openWorkspace(record,title,true));
      const meta = node(doc,'p','fine',`${types[record.type]} · ${record.year} · ${record.id}`);
      const actions = node(doc,'div','saved-library-actions');
      const open = node(doc,'button','','Reprendre ma lecture'); open.type = 'button';
      open.setAttribute('aria-controls','library-reading-workspace');
      open.addEventListener('click',() => openWorkspace(record,open,true));
      const remove = node(doc,'button','','Retirer de la liste'); remove.type = 'button';
      remove.setAttribute('aria-label',`Retirer de la liste : ${record.title}`);
      remove.addEventListener('click',() => {
        if (removeSavedReading(storage,record.id)) {
          renderSavedReadings('Référence retirée de la liste. Ses notes restent enregistrées sur cet appareil.');
          savedSummary.focus();
        } else savedStatus.textContent = 'Le stockage local ne permet pas de modifier la liste pour le moment. Rien n’a été effacé.';
      });
      actions.append(open,remove); item.append(title,meta,actions); return item;
    }));
  };
  renderSavedReadings();
  doc.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !workspace.hidden) { event.preventDefault(); closeWorkspace(); }
  });
  const query = new URLSearchParams(doc.defaultView.location.search);
  const initial = extendedParams(Object.fromEntries(query));
  for (const name of ['q','language','period','type','discipline','year']) {
    if (form.elements[name]) form.elements[name].value = name === 'year' && initial.get(name) === 'all' ? '' : initial.get(name);
    if (form.elements[name]?.tagName === 'SELECT' && !form.elements[name].value) form.elements[name].value = 'all';
  }
  const syncYearRange = () => {
    const min = form.elements.period.value === 'recent' ? LIBRARY_SCOPE.minYear : LIBRARY_SCOPE.archiveMinYear;
    form.elements.year.min = String(min);
    if (form.elements.year.value && Number(form.elements.year.value) < min) form.elements.year.value = '';
  };
  syncYearRange();
  form.elements.period.addEventListener('change', syncYearRange);
  let request = 0, controller, loaded = false, active = {}, page = 1, maxPage = 1;

  const search = async (values, targetPage = 1) => {
    closeWorkspace(false);
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
      const params = extendedParams(values, targetPage);
      const response = await fetcher('/api/library-search?' + params, {signal:requestController.signal});
      if (!response.ok) throw new Error('search-unavailable');
      const data = await response.json();
      if (token !== request) return;
      if (data.language !== params.get('language') || data.period !== params.get('period')) throw new Error('unexpected-scope');
      if (!Array.isArray(data.records) || data.records.length > 24 || !data.records.every(safeExtendedRecord) || !Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.page) || data.page < 1 || data.page > 100 || data.pageSize !== 24) throw new Error('invalid-response');
      page = data.page; maxPage = Math.min(100, Math.max(1, Math.ceil(data.total / 24)));
      loaded = true;
      results.replaceChildren(...data.records.map(record => resultCard(doc, record, openWorkspace)));
      const periodLabel = params.get('year') !== 'all' ? params.get('year') : data.period === 'recent' ? '2016–2026' : 'Toutes périodes';
      const scopeLabel = `${data.language === 'all' ? 'Toutes langues' : recordLanguageLabel({languages:[data.language]})} · ${periodLabel}`;
      status.textContent = data.total ? `${data.total.toLocaleString('fr-FR')} dépôts trouvés dans HAL · ${scopeLabel} · ${data.records.length} références affichées sur cette page` : 'Aucun dépôt trouvé. Essaie un terme plus large ou une autre discipline.';
      const limited = page >= maxPage && data.total > maxPage * 24;
      limitation.hidden = !limited;
      limitation.textContent = limited ? 'Pour explorer d’autres résultats, précise un sujet, une discipline, un type de publication ou une année.' : '';
      pagination.querySelector('[data-extended-page]').textContent = `Page ${page} / ${maxPage}`;
      paginationWasHidden = data.total <= 24;
      pagination.hidden = !workspace.hidden || paginationWasHidden;
      previous.disabled = page <= 1; next.disabled = !data.hasMore || page >= maxPage;
      if (data.total && !data.records.length) status.textContent += '. Les liens de cette page n’ont pas pu être validés ; essaie la page suivante ou consulte HAL directement.';
    } catch {
      if (token !== request) return;
      results.replaceChildren(); paginationWasHidden = true; pagination.hidden = true; limitation.hidden = true;
      status.textContent = 'HAL ne répond pas pour le moment. Réessaie, ou ouvre « Guides & sélection » pour consulter les ressources déjà disponibles.';
    } finally {
      clearTimeout(timer);
      if (token === request) {
        results.setAttribute('aria-busy', 'false');
        form.querySelector('[type="submit"]').disabled = false;
      }
    }
  };

  const mode = (name, skipSearch = false) => {
    closeWorkspace(false);
    const isExtended = name === 'hal';
    local.hidden = isExtended; extended.hidden = !isExtended;
    for (const button of modeNav.querySelectorAll('[data-scope]')) button.setAttribute('aria-pressed', String(button.dataset.scope === name));
    if (isExtended) renderSavedReadings();
    if (isExtended && !loaded && !skipSearch) search(Object.fromEntries(new FormData(form)));
  };
  modeNav.addEventListener('click', event => {
    const name = event.target.closest('[data-scope]')?.dataset.scope;
    if (name === 'local' || name === 'hal') mode(name);
  });
  form.addEventListener('submit', event => {event.preventDefault(); search(Object.fromEntries(new FormData(form)));});
  form.addEventListener('reset', () => setTimeout(() => {syncYearRange(); search(Object.fromEntries(new FormData(form)));}, 0));
  extended.querySelector('[data-extended-presets]')?.addEventListener('click', event => {
    const preset = event.target.closest('[data-preset]')?.dataset.preset;
    if (!['all','french','theses'].includes(preset)) return;
    form.elements.language.value = preset === 'french' ? 'fr' : 'all';
    form.elements.period.value = preset === 'french' ? 'recent' : 'all';
    form.elements.type.value = preset === 'theses' ? 'THESE' : 'all';
    form.elements.year.value = '';
    if (preset === 'all') form.elements.discipline.value = 'all';
    syncYearRange();
    search(Object.fromEntries(new FormData(form)));
  });
  pagination.addEventListener('click', event => {
    const direction = event.target.closest('[data-direction]')?.dataset.direction;
    if (direction !== 'previous' && direction !== 'next') return;
    search(active, Math.max(1, Math.min(maxPage, page + (direction === 'next' ? 1 : -1))));
    status.scrollIntoView({block:'start', behavior:'auto'});
  });
  modeNav.hidden = false;
  const requestedReading = query.get('reading');
  const savedReading = findSavedReading(storage,requestedReading);
  mode(savedReading || query.get('scope') === 'hal' ? 'hal' : 'local',Boolean(savedReading));
  if (savedReading) {
    status.textContent = 'Lecture enregistrée ouverte. Tu peux aussi lancer une nouvelle recherche.';
    openWorkspace(savedReading,savedSummary,true);
  } else if (requestedReading) {
    savedDetails.open = true;
    savedStatus.textContent = 'Cette lecture n’est pas dans la liste de ce navigateur. Recherche à nouveau le document pour retrouver ses notes éventuelles, ou ouvre une lecture enregistrée ci-dessous.';
  }
}
