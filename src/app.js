import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MODULES, sourceReady, validateInputs } from '../shared/modules.js';
import { requestAuth, authLinkErrorFromHash } from './auth.js';
import { authModeFromHash, projectPreset } from './onboarding.js';
import { renderInstagramContact, WHATSAPP_URL } from './contact.js';
import { normalizeUsage, usageAfterGeneration, usageLimitReached } from './usage.js';
import './landing.js';

const root = document.getElementById('workspace');
const state = { db: null, aiReady: false, user: null, projects: [], project: null, docs: [], route: 'projects', doc: null, account: null, usage: null, usageBlocked: false, results: [], dirty: false, sourceDirty: false, busy: false, authMode: 'login', authPending: false, authEmail: '' };
let saveTimer, saving, usageRefreshVersion = 0, searchTerm = '', fromYear = String(new Date().getFullYear() - 10);
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const markdown = value => DOMPurify.sanitize(marked.parse(value || ''), { USE_PROFILES: { html: true }, FORBID_TAGS: ['img','video','audio','iframe','style','form','input'], FORBID_ATTR: ['style'] });
const button = (label, action, value = '', cls = 'sp-button') => `<button type="button" class="${cls}" data-action="${action}" data-value="${e(value)}">${label}</button>`;
const date = value => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
function notify(message, error = false) {
  const el = document.getElementById('sp-notice');
  el.textContent = message; el.className = error ? 'sp-notice error' : 'sp-notice'; el.hidden = false;
}
function clearNotice() { const el = document.getElementById('sp-notice'); el.hidden = true; el.textContent = ''; }
function setStatus(message) { const el = document.getElementById('save-status'); if (el) el.textContent = message; }
function shell(content, title = 'Mes projets') {
  const project = state.project;
  root.innerHTML = `<div class="sp-shell"><aside class="sp-sidebar"><button class="sp-brand" data-action="route" data-value="projects">Soutenance <strong>Pro</strong> AI</button>
    <div class="sp-project-name">${e(project?.title || 'Ton espace académique')}</div>
    <nav aria-label="Espace de travail">${button('Mes projets', 'route', 'projects', 'sp-nav')}
    ${project ? button('Profil et consignes', 'edit-project', '', 'sp-nav') + button('Sources de recherche', 'route', 'sources', 'sp-nav') + Object.entries(MODULES).map(([id,m]) => button(m.label,'route',id,`sp-nav ${state.route === id ? 'active' : ''}`)).join('') : ''}</nav>
    <div class="sp-account">${e(state.user.email)}<br><span id="plan-name">${e(activePlan())}</span>${button('Voir les offres', 'show-plans', '', 'sp-link')}${button('Se déconnecter', 'logout', '', 'sp-link')}</div></aside>
    <main class="sp-main"><header class="sp-topbar"><h1>${e(title)}</h1>${button('Accueil du site','close','','sp-link')}</header>
    <div class="sp-body"><div id="usage-status" aria-live="polite">${usagePanel()}</div><div id="upgrade-panel" hidden></div>${content}</div></main></div>`;
}
function activePlan() {
  if (state.usage) return { free: 'Découverte', offre: 'Essentiel', max: 'Signature' }[state.usage.plan];
  const a = state.account;
  if (!a || a.plan === 'free' || !a.subscription_expires_at || new Date(a.subscription_expires_at) <= new Date()) return 'Découverte';
  return a.plan === 'offre' ? 'Essentiel' : 'Signature';
}
function generationDisabled() {
  return !state.aiReady || state.busy || usageLimitReached(state.usage, state.usageBlocked)
    || (state.route === 'redaction' && !(state.project?.profile.planValidated && state.project.sources.some(sourceReady)));
}
function usagePanel() {
  const usage = state.usage, exhausted = usageLimitReached(usage, state.usageBlocked);
  const reset = usage ? new Date(usage.resetsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '';
  if (state.busy) return '<section class="sp-usage" aria-label="Génération en cours"><div><strong>Ton résultat est en préparation…</strong><p>Le compteur sera actualisé à la fin. Tu peux consulter et exporter tes documents.</p></div></section>';
  if (exhausted) return `<section class="sp-usage sp-usage-exhausted" aria-label="Limite de génération atteinte"><div><strong>${usage?.plan === 'free' ? 'Tes 3 générations gratuites de ce mois sont utilisées.' : 'Ton quota de génération est atteint.'}</strong><p>Tu peux toujours consulter, modifier et exporter tes documents.${reset ? ` Ton quota se renouvelle le ${e(reset)} à 00 h UTC.` : ''}</p></div>${usage?.plan === 'max' ? button('Actualiser le quota', 'refresh-usage') : button('Découvrir les offres 199 / 299 DH', 'show-plans', '', 'sp-button primary')}</section>`;
  return `<section class="sp-usage" aria-label="Utilisation des générations"><div><strong>${usage ? `${usage.remaining} / ${usage.limit} génération${usage.remaining === 1 ? '' : 's'} restante${usage.remaining === 1 ? '' : 's'} ce mois-ci` : 'Ton utilisation'}</strong><p>${usage ? `${e(activePlan())} · Quota partagé entre tes projets.` : 'Compteur momentanément indisponible. Tes documents restent accessibles.'}</p></div>${button(usage ? 'Voir les offres' : 'Actualiser', usage ? 'show-plans' : 'refresh-usage', '', 'sp-link')}</section>`;
}
function syncUsagePanel() {
  const panel = root.querySelector('#usage-status'); if (panel) panel.innerHTML = usagePanel();
  const submit = root.querySelector('#generation-form [type="submit"]'); if (submit) { submit.disabled = generationDisabled(); submit.textContent = state.busy ? 'Génération en cours…' : usageLimitReached(state.usage, state.usageBlocked) ? 'Quota atteint' : 'Générer et enregistrer'; }
  const plan = root.querySelector('#plan-name'); if (plan) plan.textContent = activePlan();
  const editor = root.querySelector('#document-editor'); if (editor) editor.readOnly = state.busy;
}
async function refreshUsage() {
  if (!state.user) return;
  const userId = state.user.id, version = ++usageRefreshVersion;
  try {
    const usage = normalizeUsage(await api('/api/usage', null, { signal: AbortSignal.timeout(8000) }));
    if (state.user?.id !== userId || version !== usageRefreshVersion || !usage) return;
    state.usage = usage; state.usageBlocked = usage.remaining === 0;
    syncUsagePanel();
  } catch { /* A failed counter request must not hide or replace a student's work. */ }
}
function showPlans() {
  const panel = root.querySelector('#upgrade-panel'); if (!panel) return;
  panel.innerHTML = `<section class="sp-upgrade" aria-labelledby="upgrade-heading"><div class="sp-intro"><div><span class="sp-eyebrow">Plus de place pour ton projet</span><h2 id="upgrade-heading" tabindex="-1">Choisis ton rythme de travail</h2></div>${button('Fermer', 'close-plans', '', 'sp-link')}</div><p>Les abonnements payants sont en préparation. Contacte-nous sur WhatsApp pour les disponibilités ; aucun paiement ni changement d’offre n’est effectué ici.</p><div class="sp-offer-grid"><article class="sp-offer"><span class="sp-eyebrow">Essentiel</span><h3>199 DH <small>/ mois</small></h3><p>5 projets · 60 générations par mois</p><p>Pour construire ton plan, développer tes sections et préparer ta soutenance.</p><a class="sp-button" href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer">Me renseigner sur Essentiel</a></article><article class="sp-offer sp-offer-recommended"><span class="sp-offer-badge">Recommandé</span><span class="sp-eyebrow">Signature</span><h3>299 DH <small>/ mois</small></h3><p>20 projets · 150 générations par mois</p><p>Pour avancer plus régulièrement et disposer de davantage de révisions.</p><a class="sp-button primary" href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer">Me renseigner sur Signature</a></article></div><p class="sp-muted">Les générations déjà utilisées et les documents enregistrés restent attachés à ton compte.</p></section>`;
  panel.hidden = false; panel.querySelector?.('#upgrade-heading')?.focus?.();
}
function renderAuth() {
  clearNotice();
  if (!state.db) {
    root.innerHTML = `<div class="sp-auth"><div class="sp-auth-card"><div class="sp-brand">Soutenance <strong>Pro</strong> AI</div>
      <h1>Connexion indisponible</h1><p>Ton espace n’a pas pu être chargé. Réessaie dans un instant.</p>
      ${button('Réessayer','reload-auth','','sp-button primary')}${button('Revenir au site','close','','sp-link')}</div></div>`;
    return;
  }
  const mode = state.authMode;
  root.innerHTML = `<div class="sp-auth"><div class="sp-auth-card"><div class="sp-brand">Soutenance <strong>Pro</strong> AI</div>
    <h1>${mode === 'signup' ? 'Créer mon compte' : mode === 'reset' ? 'Réinitialiser le mot de passe' : mode === 'recovery' ? 'Nouveau mot de passe' : 'Retrouver mon projet'}</h1>
    <p>${mode === 'signup' ? 'Crée ton compte et commence ton projet. Aucun email de confirmation à attendre.' : mode === 'reset' ? 'Indique ton email pour recevoir un lien de réinitialisation.' : mode === 'recovery' ? 'Choisis un nouveau mot de passe pour ton compte.' : 'Connecte-toi à ton espace personnel.'}</p>
    <form id="auth-form" data-mode="${mode}">${mode !== 'recovery' ? `<label>Email<input name="email" type="email" autocomplete="email" value="${e(state.authEmail)}" required></label>` : ''}
    ${mode !== 'reset' ? `<label>Mot de passe<input name="password" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" ${mode === 'login' ? '' : 'minlength="8"'} required>${mode === 'login' ? '' : '<small>Au moins 8 caractères.</small>'}</label>` : ''}
    <button class="sp-button primary" type="submit">${mode === 'signup' ? 'Créer mon compte gratuit' : mode === 'reset' ? 'Recevoir le lien' : mode === 'recovery' ? 'Enregistrer' : 'Se connecter'}</button></form>
    <div class="sp-auth-links">${button(mode === 'signup' ? 'Déjà un compte ? Se connecter' : mode === 'reset' ? 'Revenir à la connexion' : 'Créer un compte gratuit', 'auth-mode', mode === 'signup' || mode === 'reset' ? 'login' : 'signup', 'sp-link')}
    ${mode !== 'reset' ? button('Mot de passe oublié', 'auth-mode', 'reset', 'sp-link') : ''}${button('Revenir au site', 'close', '', 'sp-link')}</div>${renderInstagramContact()}</div></div>`;
}
async function loadProjects() {
  const [projects, account] = await Promise.all([
    state.db.from('student_projects').select('*').order('updated_at',{ascending:false}),
    state.db.from('student_accounts').select('*').single(),
    refreshUsage()
  ]);
  if (projects.error || account.error) throw new Error('Impossible de charger ton espace. Réessaie dans un instant.');
  state.projects = projects.data; state.account = account.data;
}
function renderProjects() {
  shell(`<div class="sp-intro"><p>Reprends ton travail ou démarre un nouveau projet.</p>${button('Nouveau projet','new-project','','sp-button primary')}</div>
    ${state.projects.length ? `<div class="sp-projects">${state.projects.map(p => `<article class="sp-card"><span class="sp-eyebrow">${e(p.profile.type || 'Projet académique')}</span><h2>${e(p.title)}</h2><p>${e(p.profile.university)} · ${e(p.profile.level)}</p><small>Modifié le ${date(p.updated_at)}</small>${button('Ouvrir le projet','open-project',p.id,'sp-button primary')}</article>`).join('')}</div>` : '<div class="sp-empty"><h2>Ton premier projet commence ici.</h2><p>Renseigne ton sujet et les consignes de ton établissement. Tu pourras ensuite construire le plan et rechercher tes sources.</p></div>'}`);
}
const profileFields = [
 ['name','Nom complet','text',true], ['university','Université ou école','text',true], ['field','Filière ou spécialité','text',true],
 ['level','Niveau',['Licence','Master 1','Master 2','Ingénieur','Doctorat','Doctorat en médecine']], ['language','Langue',['Français','Anglais','Arabe','Bilingue FR/EN']],
 ['type','Type de travail',['PFE','Mémoire','Rapport de stage','Thèse']], ['supervisor','Encadrant','text'], ['deadline','Date de soutenance','date'],
 ['citation','Style bibliographique',['APA 7e édition','IEEE','Chicago','Harvard','Vancouver']], ['pages','Nombre de pages attendu','text'],
 ['question','Problématique','textarea'], ['methodology','Méthodologie',['À définir','Quantitative','Qualitative','Mixte','Expérimentale','Étude de cas']],
 ['formatting','Guide de rédaction : règles de ton établissement','textarea'], ['supervisorInstructions','Instructions de ton encadrant','textarea']
];
function field(key,label,type,required=false,value='') {
  const common = `name="${key}" ${required ? 'required' : ''}`;
  return `<label class="${type === 'textarea' ? 'sp-wide' : ''}">${e(label)}${required ? ' *' : ''}${Array.isArray(type) ? `<select ${common}>${type.map(x=>`<option ${x === value ? 'selected' : ''}>${e(x)}</option>`).join('')}</select>` : type === 'textarea' ? `<textarea ${common} maxlength="24000" rows="5">${e(value)}</textarea>` : `<input ${common} type="${type}" maxlength="500" value="${e(value)}">`}</label>`;
}
function renderProjectForm(isNew=false) {
  const p = isNew ? projectPreset(location.search) : state.project.profile;
  shell(`<form id="project-form" data-new="${isNew}" class="sp-card"><p>Ces informations guideront les modules. Tu peux les modifier à tout moment.</p>
    <div class="sp-form-grid">${field('title','Sujet ou titre du projet','text',true,isNew ? '' : state.project.title)}${profileFields.map(([k,l,t,r])=>field(k,l,t,r,p[k]||'')).join('')}</div>
    <div class="sp-actions"><button type="submit" class="sp-button primary">${isNew ? 'Créer le projet' : 'Enregistrer les consignes'}</button>${button('Retour aux projets','route','projects')}</div></form>`,isNew?'Nouveau projet':'Profil et consignes');
}
async function openProject(id) {
  const p = state.projects.find(p=>p.id===id);
  if (!p) throw new Error('Projet introuvable.');
  const docs = await state.db.from('student_documents').select('*').eq('project_id',id).order('updated_at',{ascending:false});
  if (docs.error) throw new Error('Impossible de charger les documents.');
  state.project=p; state.docs=docs.data; state.route='plan'; state.doc=null; renderModule();
}
function history() {
  const docs=state.docs.filter(d=>d.module===state.route);
  return docs.length ? `<label class="sp-history">Documents enregistrés<select id="document-picker"><option value="">Choisir un document</option>${docs.map(d=>`<option value="${d.id}" ${state.doc?.id===d.id?'selected':''}>${e(d.title)} · ${date(d.updated_at)}</option>`).join('')}</select></label>` : '';
}
function renderModule() {
  const m=MODULES[state.route];
  const p=state.project;
  const ready=p.profile.planValidated && p.sources.some(sourceReady);
  shell(`<div class="sp-progress"><span class="${p.profile.planValidated?'done':''}">1. Plan validé</span><span class="${p.sources.some(sourceReady)?'done':''}">2. Sources consultées</span><span>3. Rédaction et révision</span></div>
    <p class="sp-lead">${e(m.hint)}</p>
    ${!state.aiReady ? '<div class="sp-warning" role="status">La génération est temporairement indisponible. Tu peux préparer ton projet et consulter ou modifier tes documents enregistrés.</div>' : ''}
    ${state.route==='redaction'&&!ready?`<div class="sp-warning">Valide d’abord ton plan, puis ajoute une source et un extrait consulté d’au moins 50 caractères.${button('Ouvrir les sources','route','sources','sp-link')}</div>`:''}
    <form id="generation-form" class="sp-card"><div class="sp-form-grid">${m.fields.map(f=>field(...f)).join('')}</div>
    <button type="submit" class="sp-button primary" ${generationDisabled()?'disabled':''}>${state.busy?'Génération en cours…':usageLimitReached(state.usage,state.usageBlocked)?'Quota atteint':'Générer et enregistrer'}</button>
    <p class="sp-muted">Chaque résultat est enregistré dans ton projet. Ton quota s’applique aux générations réussies.</p></form>
    <div id="history-panel">${history()}</div><div id="document-panel">${state.doc?documentPanel():''}</div>`,m.label);
}
function documentPanel() {
  const d=state.doc;
  return `<section class="sp-card sp-document"><div class="sp-actions"><h2>${e(d.title)}</h2><span id="save-status" role="status">Enregistré</span></div>
    <div class="sp-actions">${button('Word (.docx)','export','word')}${button('Imprimer / PDF','export','pdf')}${d.module==='ppt'?button('PowerPoint (.pptx)','export','ppt'):''}
    ${d.module==='plan'?button(state.project.profile.planValidated?'Plan validé':'Valider ce plan','validate-plan','','sp-button primary'):''}</div>
    <label>Modifier le contenu<textarea id="document-editor" class="sp-editor" dir="auto" maxlength="120000" ${state.busy?'readonly':''}>${e(d.content)}</textarea></label>
    <details><summary>Aperçu mis en forme</summary><div class="sp-prose" dir="auto" id="document-preview">${markdown(d.content)}</div></details></section>`;
}
function sourceCard(s,index,selected=false) {
  const href=`https://doi.org/${encodeURI(s.doi).replace(/"/g,'%22')}`;
  return `<article class="sp-card"><span class="sp-eyebrow">${e(s.year||'Année non précisée')} · Métadonnées Crossref</span><h3>${e(s.title)}</h3><p>${e(s.authors)}</p><p class="sp-muted">${e(s.journal)}</p><a href="${e(href)}" target="_blank" rel="noopener noreferrer">Consulter la source · ${e(s.doi)}</a>
    ${selected ? `<label>Extrait consulté ou notes de lecture attribuées à cette source<textarea data-source="${index}" rows="4" maxlength="6000" placeholder="Colle un extrait utile et indique sa page si disponible.">${e(s.excerpt)}</textarea></label><div class="sp-actions">${button('Retirer','remove-source',String(index),'sp-link')}<span>${sourceReady(s)?'Prête pour la rédaction':'Extrait requis avant rédaction'}</span></div>` : button(state.project.sources.some(x=>x.doi===s.doi)?'Déjà sélectionnée':'Ajouter à mes sources','add-source',String(index))}</article>`;
}
function renderSources() {
  shell(`<p class="sp-lead">Recherche des publications, consulte leur contenu puis conserve les extraits utiles à ton mémoire. Un DOI retrouvé confirme la notice bibliographique, pas les affirmations de l’article ni son accès gratuit.</p>
    <form id="source-form" class="sp-card"><div class="sp-form-grid">${field('q','Sujet, titre ou DOI','text',true,searchTerm||state.project.title)}${field('fromYear','Publications depuis','number',true,fromYear)}</div><button class="sp-button primary" type="submit">Rechercher</button></form>
    <h2>Mes sources (${state.project.sources.length}/30)</h2>${button('Enregistrer les extraits','save-sources','','sp-button primary')}
    <div class="sp-source-grid">${state.project.sources.map((s,i)=>sourceCard(s,i,true)).join('')||'<p>Aucune source sélectionnée.</p>'}</div>
    ${state.results.length?`<h2>Résultats de recherche</h2><div class="sp-source-grid">${state.results.map((s,i)=>sourceCard(s,i)).join('')}</div>`:''}`,'Sources de recherche');
}
async function token() {
  const {data,error}=await state.db.auth.getSession();
  if(error||!data.session)throw new Error('Reconnecte-toi pour continuer.');
  return data.session.access_token;
}
async function api(url,body,options={}) {
  const response=await fetch(url,{...options,method:body?'POST':'GET',cache:'no-store',headers:{Authorization:`Bearer ${await token()}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  let data;try{data=await response.json();}catch{throw new Error('Le serveur n’a pas renvoyé une réponse valide. Réessaie.');}
  if(!response.ok){const error=new Error(data.error?.message||'Le service est temporairement indisponible.');error.code=data.error?.code;throw error;}
  return data;
}
async function saveDoc() {
  clearTimeout(saveTimer);
  if(saving)await saving;
  if(!state.dirty||!state.doc)return;
  const snapshot={...state.doc};
  setStatus('Enregistrement…');
  saving=(async()=>{
    const {data,error}=await state.db.from('student_documents').update({content:snapshot.content}).eq('id',snapshot.id).select().single();
    if(error){setStatus('Non enregistré — réessaie');throw new Error('Enregistrement impossible. Ton texte reste dans l’éditeur.');}
    const i=state.docs.findIndex(d=>d.id===snapshot.id); if(i>=0)state.docs[i]={...data,content:state.doc?.id===snapshot.id?state.doc.content:data.content};
    if(state.doc?.id===snapshot.id&&state.doc.content===snapshot.content){state.dirty=false;state.doc.updated_at=data.updated_at;setStatus('Enregistré');}
  })();
  try{await saving;}finally{saving=null;}
  if(state.dirty)await saveDoc();
}
async function saveSources() {
  if(!state.sourceDirty)return;
  const {error}=await state.db.from('student_projects').update({sources:state.project.sources}).eq('id',state.project.id);
  if(error)throw new Error('Les extraits n’ont pas pu être enregistrés.');
  state.sourceDirty=false;
}
async function flush() { await saveDoc(); await saveSources(); }
async function route(value) {
  await flush();state.route=value;state.doc=null;state.results=[];
  if(value==='projects'){await loadProjects();renderProjects();}
  else if(!state.project){state.route='projects';renderProjects();}
  else if(value==='sources')renderSources();else renderModule();
}
async function submitAuth(form) {
  if(!state.db)throw new Error('L’espace est temporairement indisponible. Réessaie plus tard.');
  if(state.authPending)return;
  const values=Object.fromEntries(new FormData(form)), mode=form.dataset.mode;
  state.authEmail=String(values.email||state.authEmail).trim();
  state.authPending=true;clearNotice();root.setAttribute('aria-busy','true');
  try{
    const result=await requestAuth(state.db.auth,mode,values,location.origin,fetch);
    if(!form.isConnected||root.hidden)return;
    if(mode==='reset'){notify('Si un compte existe, un lien a été envoyé à cette adresse.');return;}
    if(mode==='recovery'){state.authMode='login';notify('Mot de passe mis à jour.');}
    state.user=result.data.user;await loadProjects();state.route='projects';renderProjects();
  }finally{state.authPending=false;root.removeAttribute('aria-busy');}
}
root.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target,submit=form.querySelector('[type="submit"]');
  if(submit.disabled)return;submit.disabled=true;
  try{
    if(form.id==='auth-form')await submitAuth(form);
    if(form.id==='project-form'){
      const values=Object.fromEntries(new FormData(form)),isNew=form.dataset.new==='true';
      const title=values.title.trim();delete values.title;
      if(title.length<3)throw new Error('Précise un sujet d’au moins trois caractères.');
      const profile={...values,planValidated:false};
      const query=isNew?state.db.from('student_projects').insert({user_id:state.user.id,title,profile}):state.db.from('student_projects').update({title,profile}).eq('id',state.project.id);
      const {data,error}=await query.select().single();
      if(error)throw new Error(error.message.includes('Limite')?error.message:'Impossible d’enregistrer le projet.');
      await loadProjects();await openProject(data.id);notify('Projet enregistré.');
    }
    if(form.id==='generation-form'){
      if(!state.aiReady)throw new Error('La génération est temporairement indisponible.');
      if(usageLimitReached(state.usage,state.usageBlocked)){showPlans();throw new Error('Ton quota est atteint. Tes documents restent accessibles.');}
      if(state.busy)throw new Error('Une génération est déjà en cours.');
      const module=state.route,projectId=state.project.id;
      const inputs=validateInputs(module,Object.fromEntries(new FormData(form)));
      state.busy=true;syncUsagePanel();
      try{
        await flush();
        const data=await api('/api/chat',{module,projectId,inputs});
        state.usage=usageAfterGeneration(state.usage,data.remaining);state.usageBlocked=data.remaining===0;
        if(state.project?.id===projectId){state.docs.unshift(data.document);if(state.route===module){state.doc=data.document;document.getElementById('document-panel').innerHTML=documentPanel();document.getElementById('history-panel').innerHTML=history();}}
        notify(data.truncated?'Résultat enregistré. La limite de longueur a été atteinte : poursuis dans une section séparée.':`Résultat enregistré. ${data.remaining} génération(s) restante(s) ce mois-ci.`);
      }catch(error){
        if(error.code==='quota_exceeded')state.usageBlocked=true;
        throw error;
      }finally{state.busy=false;syncUsagePanel();void refreshUsage();}
    }
    if(form.id==='source-form'){
      const values=Object.fromEntries(new FormData(form));searchTerm=values.q;fromYear=values.fromYear;const projectId=state.project.id;
      const data=await api(`/api/references?q=${encodeURIComponent(searchTerm)}&fromYear=${encodeURIComponent(fromYear)}`);
      if(state.project?.id!==projectId||state.route!=='sources')return;
      state.results=data.sources;renderSources();if(!data.sources.length)notify('Aucune publication trouvée. Essaie des mots-clés plus précis.');
    }
  }catch(error){
    if(error.authDetails)console.warn('Authentication request failed',error.authDetails);
    if(form.id!=='auth-form'||(form.isConnected&&!root.hidden))notify(error.message,true);
  }finally{submit.disabled=form.id==='generation-form'&&generationDisabled();}
});
root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-action]');if(!el)return;
  const action=el.dataset.action,value=el.dataset.value;
  try{
    if(action==='show-plans'){showPlans();return;}
    if(action==='close-plans'){const panel=root.querySelector('#upgrade-panel');if(panel)panel.hidden=true;return;}
    if(action==='refresh-usage'){await refreshUsage();return;}
    if(action==='reload-auth'){location.reload();return;}
    if(action==='auth-mode'){
      if(state.authPending)return;
      state.authEmail=root.querySelector('[name="email"]')?.value.trim()||state.authEmail;
      state.authMode=value;renderAuth();
    }
    if(action==='close'){await flush();root.hidden=true;clearNotice();document.body.classList.remove('sp-open');}
    if(action==='route')await route(value);
    if(action==='open-project'){await flush();await openProject(value);}
    if(action==='new-project'||action==='edit-project'){await flush();renderProjectForm(action==='new-project');}
    if(action==='logout'){
      await flush();const {error}=await state.db.auth.signOut();if(error)throw error;
      Object.assign(state,{user:null,project:null,docs:[],doc:null,projects:[],usage:null,usageBlocked:false,dirty:false,sourceDirty:false,authMode:'login'});renderAuth();
    }
    if(action==='validate-plan'){
      await flush();const profile={...state.project.profile,planValidated:true,validatedPlanId:state.doc.id};
      const {error}=await state.db.from('student_projects').update({profile}).eq('id',state.project.id);if(error)throw error;
      state.project.profile=profile;notify('Plan validé. Tu peux préparer tes sources.');renderModule();
    }
    if(action==='add-source'){
      const s=state.results[Number(value)];if(!s||state.project.sources.some(x=>x.doi===s.doi))return;
      if(state.project.sources.length>=30)throw new Error('Maximum 30 sources par projet.');
      state.project.sources.push({...s});state.sourceDirty=true;await saveSources();renderSources();
    }
    if(action==='remove-source'){state.project.sources.splice(Number(value),1);state.sourceDirty=true;await saveSources();renderSources();}
    if(action==='save-sources'){await saveSources();notify('Extraits enregistrés.');}
    if(action==='export'){
      await saveDoc();const {exportDocument}=await import('./exports.js');
      await exportDocument(value,state.doc,state.project);notify(value==='pdf'?'Choisis « Enregistrer au format PDF » dans la fenêtre d’impression.':'Fichier préparé pour téléchargement.');
    }
  }catch(error){notify(error.message,true);}
});
root.addEventListener('input',event=>{
  if(event.target.id==='document-editor'){
    state.doc.content=event.target.value;state.dirty=true;setStatus('Modifications en cours…');
    if(state.doc.module==='plan'&&state.project.profile.validatedPlanId===state.doc.id){state.project.profile.planValidated=false;delete state.project.profile.validatedPlanId;}
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDoc().catch(err=>notify(err.message,true)),900);
    document.getElementById('document-preview').innerHTML=markdown(state.doc.content);
  }
  if(event.target.dataset.source!==undefined){state.project.sources[Number(event.target.dataset.source)].excerpt=event.target.value;state.sourceDirty=true;}
});
root.addEventListener('change',async event=>{
  if(event.target.id==='document-picker'){
    try{await saveDoc();state.doc=state.docs.find(d=>d.id===event.target.value)||null;document.getElementById('document-panel').innerHTML=state.doc?documentPanel():'';}catch(error){notify(error.message,true);}
  }
});
window.addEventListener('beforeunload',event=>{if(state.dirty||state.sourceDirty){event.preventDefault();event.returnValue='';}});
window.addEventListener('focus',()=>{if(state.user&&!root.hidden)void refreshUsage();});
document.getElementById('sp-notice').addEventListener('click',event=>{event.currentTarget.hidden=true;});
let ready;
window.openApp=async(mode='login')=>{
  if(state.authPending)return;
  clearNotice();
  root.hidden=false;document.body.classList.add('sp-open');root.innerHTML='<div class="sp-loading" role="status">Chargement de ton espace…</div>';
  try{
    await ready;
    if(state.authMode!=='recovery')state.authMode=mode==='signup'?'signup':'login';
    if(state.user&&state.authMode!=='recovery'){await loadProjects();renderProjects();}else renderAuth();
  }catch(error){renderAuth();notify(error.message,true);}
};
ready=(async()=>{
  const response=await fetch('/api/config');if(!response.ok)throw new Error('L’espace est temporairement indisponible.');
  const config=await response.json();if(!config.authReady)throw new Error('L’espace est temporairement indisponible. Réessaie plus tard.');
  state.aiReady=config.ready;
  state.db=createClient(config.supabaseUrl,config.supabaseAnonKey);
  state.db.auth.onAuthStateChange((event,session)=>{
    if(state.user?.id!==session?.user?.id){state.usage=null;state.usageBlocked=false;}
    state.user=session?.user||null;
    if(event==='PASSWORD_RECOVERY'){state.authMode='recovery';root.hidden=false;document.body.classList.add('sp-open');renderAuth();}
    if(event==='SIGNED_OUT'&&!root.hidden)renderAuth();
  });
  const {data}=await state.db.auth.getSession();state.user=data.session?.user||null;
})();
ready.catch(()=>{});
async function openLinkedWorkspace(){
  const linkError=authLinkErrorFromHash(location.hash);
  if(linkError){
    window.history.replaceState(null,'',`${location.pathname}${location.search}#connexion`);
    await window.openApp('login');notify(linkError,true);return;
  }
  const mode=authModeFromHash(location.hash);if(mode)await window.openApp(mode);
}
window.addEventListener('hashchange',openLinkedWorkspace);
openLinkedWorkspace();
