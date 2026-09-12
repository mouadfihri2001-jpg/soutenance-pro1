import { LIBRARY_SCOPE } from '../shared/library-scope.js';

const prefix = 'soutenancepro:reading-notes:v1:';
const readingIndexKey = 'soutenancepro:saved-readings:v1';
export const savedReadingsLimit = 100;
const validId = value => typeof value === 'string' && /^[a-z][a-z0-9-]{1,99}$/.test(value);
const readingTypes = new Set(['ART','THESE','MEM','REPORT','HDR']);

function safeArchiveUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (url.hostname === 'hal.inrae.fr' || ['hal.science','archives-ouvertes.fr','ccsd.cnrs.fr'].some(host => url.hostname === host || url.hostname.endsWith('.' + host)));
  } catch { return false; }
}

/** Store bibliographic metadata only. Never copy note bodies or other object fields. */
export function normalizeReadingReference(record) {
  if (!record || !validId(record.id) || typeof record.title !== 'string' || !record.title.trim() || record.title.length > 2000 ||
      !Array.isArray(record.authors) || record.authors.length > 100 || record.authors.some(author => typeof author !== 'string' || author.length > 200) ||
      !Number.isInteger(record.year) || record.year < LIBRARY_SCOPE.minYear || record.year > LIBRARY_SCOPE.maxYear ||
      !readingTypes.has(record.type) || !safeArchiveUrl(record.sourceUrl) || !safeArchiveUrl(record.fileUrl)) return null;
  const plain = value => value.replace(/[\r\n\u0000-\u001f\u007f]/g,' ').trim();
  const clean = {id:record.id,title:plain(record.title),authors:record.authors.map(plain),year:record.year,type:record.type,sourceUrl:record.sourceUrl,fileUrl:record.fileUrl};
  if (typeof record.doi === 'string' && record.doi.length <= 500) clean.doi = plain(record.doi);
  return clean;
}

export function readSavedReadings(storage) {
  if (!storage) return {records:[],status:'unavailable'};
  try {
    const raw = storage.getItem(readingIndexKey);
    if (raw === null) return {records:[],status:'empty'};
    if (typeof raw !== 'string' || raw.length > 1800000) return {records:[],status:'invalid'};
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !Array.isArray(value.records) || value.records.length > savedReadingsLimit) return {records:[],status:'invalid'};
    const records = [], seen = new Set();
    let invalid = false;
    for (const item of value.records) {
      const record = normalizeReadingReference(item);
      if (!record) { invalid = true; continue; }
      if (!seen.has(record.id)) {records.push(record); seen.add(record.id);}
    }
    return {records,status:invalid ? 'partial' : 'saved'};
  } catch { return {records:[],status:'unavailable'}; }
}

export function saveReadingReference(storage, record) {
  const clean = normalizeReadingReference(record);
  if (!clean || !storage) return {saved:false,record:null};
  const previous = readSavedReadings(storage);
  if (['unavailable','invalid','partial'].includes(previous.status)) return {saved:false,record:clean};
  const records = [clean,...previous.records.filter(item => item.id !== clean.id)].slice(0,savedReadingsLimit);
  try {
    const payload = JSON.stringify({version:1,records});
    if (payload.length > 1800000) return {saved:false,record:clean};
    storage.setItem(readingIndexKey,payload);
    return {saved:true,record:clean};
  } catch { return {saved:false,record:clean}; }
}

export function removeSavedReading(storage, recordId) {
  if (!validId(recordId) || !storage) return false;
  const previous = readSavedReadings(storage);
  if (['unavailable','invalid','partial'].includes(previous.status)) return false;
  try {
    storage.setItem(readingIndexKey,JSON.stringify({version:1,records:previous.records.filter(record => record.id !== recordId)}));
    return true;
  } catch { return false; }
}

/** A reading URL can select a local reference; it can never select a network destination. */
export function findSavedReading(storage, recordId) {
  if (!validId(recordId)) return null;
  return readSavedReadings(storage).records.find(record => record.id === recordId) || null;
}
export const noteFields = Object.freeze([
  {name:'question', label:'Ma question de recherche', max:2000, rows:3, placeholder:'À quelle question ce document peut-il répondre ?'},
  {name:'method', label:'Méthode et population étudiée', max:4000, rows:4, placeholder:'Décris ce que tu as vérifié dans le document : méthode, terrain, population…'},
  {name:'passage', label:'Passage utile ou note de lecture', max:6000, rows:5, placeholder:'Distingue une citation entre guillemets de ta propre reformulation.'},
  {name:'page', label:'Page(s) du passage', max:80, rows:1, placeholder:'Ex. p. 18–19'},
  {name:'limits', label:'Limites et points à vérifier', max:4000, rows:4, placeholder:'Ce que cette source ne permet pas de conclure ; ce qui reste à vérifier.'}
]);

export function normalizeNotes(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(noteFields.map(({name,max}) => [name,
    (typeof input[name] === 'string' ? input[name] : '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0,max)
  ]));
}

export function readNotes(storage, recordId) {
  const empty = normalizeNotes({});
  if (!validId(recordId) || !storage) return {notes:empty, status:'unavailable'};
  try {
    const raw = storage.getItem(prefix + recordId);
    if (raw === null) return {notes:empty, status:'empty'};
    if (typeof raw !== 'string' || raw.length > 50000) return {notes:empty, status:'invalid'};
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || saved.recordId !== recordId || !saved.notes || typeof saved.notes !== 'object' || Array.isArray(saved.notes)) return {notes:empty, status:'invalid'};
    return {notes:normalizeNotes(saved.notes), status:'saved'};
  } catch { return {notes:empty, status:'unavailable'}; }
}

export function saveNotes(storage, recordId, notes) {
  const clean = normalizeNotes(notes);
  if (!validId(recordId) || !storage) return {notes:clean, saved:false};
  try {
    storage.setItem(prefix + recordId, JSON.stringify({version:1, recordId, notes:clean}));
    return {notes:clean, saved:true};
  } catch { return {notes:clean, saved:false}; }
}

export function readingNotesText(record, notes) {
  const singleLine = value => typeof value === 'string' ? value.replace(/[\r\n\u0000-\u001f\u007f]/g,' ').trim() : '';
  const clean = normalizeNotes(notes);
  return [
    'SOUTENANCE PRO — FICHE DE LECTURE PERSONNELLE',
    '', singleLine(record.title),
    `Auteur(s) : ${(record.authors || []).map(singleLine).join(', ')}`,
    `Année : ${Number.isInteger(record.year) ? record.year : ''}`,
    `Référence HAL : ${singleLine(record.id)}`,
    `Source : ${singleLine(record.sourceUrl)}`,
    '', 'Les notes ci-dessous ont été saisies par leur utilisateur. Elles ne sont ni le texte intégral, ni un résumé validé de la publication.',
    ...noteFields.flatMap(({name,label}) => ['',label.toUpperCase(),clean[name] || '(Non renseigné)']),
    '', 'Vérifie les citations, les pages et les droits de réutilisation dans le document original.', ''
  ].join('\n');
}

let worksheetSequence = 0;

/** Mount a personal worksheet. It uses this browser's storage only, never a server. */
export function mountLibraryNotes(container, record, options = {}) {
  if (!container?.ownerDocument || !record || !validId(record.id)) return null;
  const doc = container.ownerDocument;
  const make = (tag, className, text) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  let storage;
  try { storage = doc.defaultView.localStorage; } catch { storage = null; }
  const saved = readNotes(storage, record.id);
  const hasDraft = options.initialNotes !== undefined;
  const notes = hasDraft ? normalizeNotes(options.initialNotes) : saved.notes;
  const idPrefix = `library-notes-${++worksheetSequence}-`;
  const form = make('form', 'library-workspace-notes');
  form.append(make('h3', '', 'Ma fiche de lecture'));
  const privacy = make('p', 'fine', 'Tes propres notes, enregistrées uniquement dans ce navigateur sur cet appareil. Elles ne sont pas synchronisées avec ton compte. Exporte-les pour les conserver.');
  privacy.id = idPrefix + 'privacy'; form.append(privacy);
  form.setAttribute('aria-describedby', privacy.id);
  const controls = {};
  for (const field of noteFields) {
    const wrapper = make('div', 'library-note-field');
    const label = make('label', '', field.label);
    const input = make(field.rows === 1 ? 'input' : 'textarea');
    input.id = idPrefix + field.name; input.name = field.name;
    input.maxLength = field.max; input.placeholder = field.placeholder;
    input.value = notes[field.name];
    if (field.rows === 1) input.type = 'text'; else input.rows = field.rows;
    label.htmlFor = input.id; controls[field.name] = input;
    wrapper.append(label,input); form.append(wrapper);
  }
  const getNotes = () => normalizeNotes(Object.fromEntries(Object.entries(controls).map(([name,input]) => [name,input.value])));
  const onChange = () => {const value = getNotes(); options.onChange?.(value); return value;};
  const status = make('p', 'library-note-status');
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  status.textContent = hasDraft ? 'Notes reprises de cette session. Enregistre-les pour les retrouver après fermeture.' : saved.status === 'saved' ? 'Notes précédemment enregistrées sur cet appareil.' : ['unavailable','invalid'].includes(saved.status) ? 'L’enregistrement local est indisponible ou les anciennes notes ne peuvent pas être lues. Tu peux écrire et exporter ta fiche.' : 'Complète ta fiche, puis enregistre-la ou exporte-la.';
  form.addEventListener('input', () => {
    onChange();
    status.textContent = 'Modifications en cours. Enregistre ou exporte ta fiche avant de quitter la page.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = saveNotes(storage, record.id, onChange());
    if (result.saved) {
      const reference = saveReadingReference(storage,record);
      status.textContent = reference.saved ? 'Notes enregistrées. Tu retrouveras cette fiche dans « Mes lectures sur cet appareil ».' : 'Notes enregistrées, mais la référence n’a pas pu être ajoutée à ta liste de lectures. Exporte ta fiche pour la retrouver facilement.';
      revisit.href = reference.saved ? '/bibliotheque?scope=hal&reading=' + encodeURIComponent(record.id) : '/bibliotheque?scope=hal';
      options.onSaved?.({record:reference.record,referenceSaved:reference.saved});
    } else {
      status.textContent = 'L’enregistrement local est impossible (stockage plein ou bloqué). Tes notes restent affichées : utilise « Exporter ma fiche » pour les conserver.';
    }
  });
  const actions = make('div', 'library-note-actions');
  const save = make('button', 'site-button', 'Enregistrer mes notes'); save.type = 'submit';
  const download = make('button', '', 'Exporter ma fiche · TXT'); download.type = 'button';
  download.addEventListener('click', () => {
    const draft = onChange();
    try {
      const url = URL.createObjectURL(new Blob([readingNotesText(record,draft)], {type:'text/plain;charset=utf-8'}));
      const anchor = doc.createElement('a');
      anchor.href = url; anchor.download = record.id + '-fiche-lecture.txt'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url),1000);
      status.textContent = 'Export demandé. Vérifie le fichier dans tes téléchargements.';
    } catch { status.textContent = 'Ce navigateur ne permet pas l’export. Copie tes notes pour les conserver.'; }
  });
  const revisit = make('a','library-notes-revisit','Retrouver mes lectures sur cet appareil →');
  revisit.href = findSavedReading(storage,record.id) ? '/bibliotheque?scope=hal&reading=' + encodeURIComponent(record.id) : '/bibliotheque?scope=hal';
  actions.append(save,download); form.append(actions,status,revisit);
  container.replaceChildren(form);
  return {getNotes};
}
