const prefix = 'soutenancepro:reading-notes:v1:';
const validId = value => typeof value === 'string' && /^[a-z][a-z0-9-]{1,99}$/.test(value);
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
    status.textContent = result.saved ? 'Notes enregistrées sur cet appareil.' : 'L’enregistrement local est impossible (stockage plein ou bloqué). Tes notes restent affichées : utilise « Exporter ma fiche » pour les conserver.';
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
  actions.append(save,download); form.append(actions,status);
  container.replaceChildren(form);
  return {getNotes};
}
