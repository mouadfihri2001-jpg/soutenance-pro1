import { mountLibraryNotes } from './library-notes.js';
import { setupExtendedCatalogue } from './extended-catalogue.js';
import { normalizeSearch } from './library.js';
const KEY='soutenance-pro:reading-list:v1',PAGE_SIZE=24;
export function matchCatalogue(record,{q='',discipline='all',format='all',type='all',year='all',saved=false},selected=new Set()){
  if(saved&&!selected.has(record.id))return false;
  if(discipline!=='all'&&record.discipline!==discipline||format!=='all'&&record.format!==format||type!=='all'&&record.type!==type||year!=='all'&&String(record.year)!==String(year))return false;
  const words=normalizeSearch(String(q).slice(0,240)).split(/\s+/).filter(Boolean);
  const text=normalizeSearch([record.title,...record.authors||[],record.keywords,record.description,record.doi,record.label].join(' '));
  return words.every(word=>text.includes(word));
}
export function safeRecord(record){return record&&typeof record.id==='string'&&typeof record.title==='string'&&typeof record.path==='string'&&/^\/(?:guides\/|bibliotheque\/document\/|modeles\/)?[a-z0-9-]+(?:\.docx)?$/.test(record.path)&&Array.isArray(record.authors)&&record.authors.every(a=>typeof a==='string');}
function readSaved(){try{const values=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(values)?values.filter(x=>typeof x==='string'&&/^[a-z0-9/-]{1,150}$/.test(x)).slice(0,1000):[]);}catch{return new Set();}}
function setSaved(id,button){const saved=readSaved(),on=!saved.has(id);if(on)saved.add(id);else saved.delete(id);try{localStorage.setItem(KEY,JSON.stringify([...saved].slice(-1000)));button.setAttribute('aria-pressed',String(on));button.textContent=on?'Dans ma sélection ✓':'Garder dans ma sélection';}catch{button.textContent='Sélection indisponible sur cet appareil';}}
const element=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
function card(record,saved){
  const article=element('article','search-result'),head=element('p','resource-type',record.label+' · '+(record.format==='document'?record.year:'Accès libre'));
  const title=element('h3'),link=element('a','',record.title);link.href=record.path;if(record.format==='template')link.download='';title.append(link);
  article.append(head,title,element('p','document-authors',record.authors.join(', ')),element('p','',record.description));
  const footer=element('div','search-result-actions'),open=element('a','',record.format==='template'?'Télécharger le modèle ↓':'Consulter →');open.href=record.path;if(record.format==='template')open.download='';footer.append(open);
  const save=element('button','save-reference',saved.has(record.id)?'Dans ma sélection ✓':'Garder dans ma sélection');save.type='button';save.setAttribute('aria-pressed',String(saved.has(record.id)));save.addEventListener('click',()=>setSaved(record.id,save));footer.append(save);article.append(footer);return article;
}
async function setupCatalogue(){
  for(const button of document.querySelectorAll('[data-save]')){const id=button.dataset.save;button.hidden=false;button.setAttribute('aria-pressed',String(readSaved().has(id)));button.textContent=readSaved().has(id)?'Dans ma sélection ✓':'Garder dans ma sélection';button.addEventListener('click',()=>setSaved(id,button));}
  const root=document.querySelector('[data-catalogue]');if(!root)return;
  const form=root.querySelector('[data-catalogue-form]'),results=root.querySelector('#catalogue-results'),status=root.querySelector('#catalogue-status'),pagination=root.querySelector('#catalogue-pagination'),fallback=root.querySelector('[data-catalogue-fallback]');
  try{
    const response=await fetch('/assets/catalogue-index.json',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('catalogue');
    const payload=await response.json();if(!Array.isArray(payload)||payload.length>10000||!payload.every(safeRecord))throw new Error('catalogue');
    let currentPage=1,filtered=[];
    form.elements.q.value=(new URLSearchParams(location.search).get('q')||'').slice(0,240);
    const draw=()=>{const saved=readSaved(),lastPage=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));currentPage=Math.max(1,Math.min(lastPage,currentPage));results.replaceChildren(...filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE).map(record=>card(record,saved)));status.textContent=filtered.length?`${filtered.length.toLocaleString('fr-FR')} ressource${filtered.length===1?'':'s'} · sélection enregistrée sur cet appareil`:'Aucun résultat. Essaie un terme plus large ou réinitialise les filtres.';pagination.querySelector('#catalogue-page').textContent=`Page ${currentPage} / ${lastPage}`;pagination.querySelector('[data-page="previous"]').disabled=currentPage===1;pagination.querySelector('[data-page="next"]').disabled=currentPage===lastPage;pagination.hidden=lastPage<2;};
    const filter=()=>{const filters=Object.fromEntries(new FormData(form));filters.saved=form.elements.saved.checked;filtered=payload.filter(r=>matchCatalogue(r,filters,readSaved()));const q=normalizeSearch(filters.q);filtered.sort((a,b)=>filters.sort==='title'?a.title.localeCompare(b.title,'fr'):filters.sort==='recent'?b.year-a.year:a.format!==b.format&&!q?(a.format==='guide'?-1:b.format==='guide'?1:0):(Number(normalizeSearch(b.title).includes(q))-Number(normalizeSearch(a.title).includes(q))||b.year-a.year));currentPage=1;draw();};
    form.addEventListener('submit',event=>{event.preventDefault();filter();});form.addEventListener('input',filter);form.addEventListener('change',filter);form.addEventListener('reset',()=>setTimeout(filter,0));
    pagination.addEventListener('click',event=>{const direction=event.target.closest('button')?.dataset.page;if(!direction)return;currentPage+=direction==='next'?1:-1;draw();results.scrollIntoView({block:'start',behavior:'auto'});});
    filter();form.hidden=false;results.hidden=false;fallback.hidden=true;
  }catch{status.textContent='Les filtres ne sont pas disponibles pour le moment. Les guides et le catalogue paginé ci-dessous restent accessibles.';}
}
if(typeof document!=='undefined'){
  for(const section of document.querySelectorAll('.record-note-workspace')){
    const container=section.querySelector('[data-library-notes]'), data=section.querySelector('[data-library-note-record]');
    if(!container||!data)continue;
    try { const record=JSON.parse(data.textContent); if(record.id===container.dataset.libraryNotes)mountLibraryNotes(container,record); } catch { /* Keep the accessible Word fallback. */ }
  }
  setupExtendedCatalogue();setupCatalogue();
}
