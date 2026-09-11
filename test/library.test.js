import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesResource, matchesInstitution, setupLibrary, setupInstitutions } from '../src/library.js';
import { pages, resourceTopic } from '../content/catalog.mjs';
import { institutions } from '../content/institutions.mjs';
import { renderInstitutions, renderLibrary } from '../scripts/library.mjs';

test('library search handles French accents and all relevant health guides belong to the health filter', () => {
  assert.ok(matchesResource({text:'Préparer une présentation de soutenance',topic:'oral health'},'PRESENTATION soutenance','oral'));
  assert.ok(matchesResource({text:'Préparer une présentation de soutenance',topic:'oral health'},'présentation','health'));
  assert.equal(matchesResource({text:'rapport de stage',topic:'stage'},'stage','health'),false);
  assert.equal(matchesResource({text:'rapport de stage',topic:'stage'},'stage inconnu'),false);
  for(const slug of ['pfe-ispits','these-medecine','guides/problematique-pfe-infirmier','guides/questionnaire-recherche-sante','guides/analyse-spss-pfe-sante','guides/recherche-bibliographique-sante']) {
    const page=pages.find(p=>p.slug===slug);
    assert.ok(matchesResource({text:page.title,topic:resourceTopic(page)},'','health'),slug);
  }
});

function fixture({prefix='library', choices=['topic','format'], search='', records=[]}={}) {
  const element = (value='') => ({value,hidden:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){this.focused=true;},set innerHTML(_){throw new Error('Search must never interpolate HTML');}});
  const query=element(),reset=element(),form=element();form.hidden=true;
  const count=element(),empty=element();empty.hidden=true;
  const controls=Object.fromEntries(choices.map(name=>[name,element('all')]));
  const items=records.map(dataset=>({dataset,hidden:false}));
  const groups=['guide','template'].map(format=>({hidden:false,querySelectorAll:()=>items.filter(item=>item.dataset.format===format)}));
  form.querySelector=selector=>({'[name="q"]':query,'[type="reset"]':reset,...Object.fromEntries(choices.map(name=>[`[name="${name}"]`,controls[name]]))})[selector];
  const doc={
    defaultView:{location:{search}},
    querySelector:selector=>({[`[data-${prefix}-form]`]:form,[`#${prefix}-count`]:count,[`#${prefix}-empty`]:empty})[selector],
    querySelectorAll:selector=>selector==='[data-resource-group]'?groups:items
  };
  return {doc,query,reset,form,count,empty,controls,items,groups};
}

const libraryRecords=[
  {search:'Introduction du rapport de stage',topic:'stage',format:'guide'},
  {search:'Méthode de recherche bibliographique',topic:'method health',format:'guide'},
  {search:'Plan de rapport de stage Word',topic:'stage',format:'template'}
];

test('theme and format filters combine with text; empty state and reset restore all resources and groups', () => {
  const f=fixture({records:libraryRecords});
  setupLibrary(f.doc);
  assert.equal(f.form.hidden,false);assert.equal(f.count.textContent,'3 ressources disponibles');
  f.controls.topic.value='stage';f.controls.format.value='template';f.query.value='plan';f.query.listeners.input();
  assert.deepEqual(f.items.map(i=>i.hidden),[true,true,false]);assert.deepEqual(f.groups.map(g=>g.hidden),[true,false]);
  assert.equal(f.count.textContent,'1 ressource disponible');assert.equal(f.reset.hidden,false);
  f.controls.topic.value='health';f.controls.topic.listeners.change();
  assert.equal(f.empty.hidden,false);assert.equal(f.count.textContent,'0 ressources disponibles');
  let prevented=false;f.form.listeners.reset({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(f.query.value,'');assert.equal(f.query.focused,true);
  assert.ok(Object.values(f.controls).every(control=>control.value==='all'));
  assert.ok(f.items.every(i=>!i.hidden));assert.ok(f.groups.every(g=>!g.hidden));assert.equal(f.empty.hidden,true);assert.equal(f.reset.hidden,true);
});

test('a homepage GET query is restored and matched while facet parameters do not create alternate catalog states', () => {
  const f=fixture({records:libraryRecords,search:'?q=rapport+de+stage&format=guide&topic=health'});
  setupLibrary(f.doc);
  assert.equal(f.query.value,'rapport de stage');
  assert.deepEqual(f.items.map(i=>i.hidden),[false,true,false]);
  assert.equal(f.controls.format.value,'all');assert.equal(f.controls.topic.value,'all');
  let prevented=false;f.form.listeners.submit({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(f.count.textContent,'2 ressources disponibles');
});

test('URL queries stay bounded plain text, including markup and malformed percent sequences', () => {
  for(const value of ['<img src=x onerror=alert(1)>','%E0%A4%A','x'.repeat(500)]) {
    const f=fixture({records:libraryRecords,search:'?q='+encodeURIComponent(value)});
    setupLibrary(f.doc);
    assert.equal(f.query.value,value.slice(0,240));
    assert.equal(f.empty.hidden,false);assert.equal(f.count.textContent,'0 ressources disponibles');
  }
});

test('institution discovery combines names, domains and levels with country and reset', () => {
  const records=institutions.map(item=>({country:item.country,search:[item.name,item.shortName,item.level,...item.subjects,item.city].join(' ')}));
  const f=fixture({prefix:'institutions',choices:['country'],records,search:'?q=medecine'});
  setupInstitutions(f.doc);
  assert.equal(f.form.hidden,false);
  assert.ok(f.items.some(i=>!i.hidden));
  f.controls.country.value='TN';f.controls.country.listeners.change();
  assert.ok(f.items.every(i=>i.hidden));assert.equal(f.empty.hidden,false);
  f.query.value='licence';f.query.listeners.input();
  assert.equal(f.items.filter(i=>!i.hidden).length,1);
  assert.equal(f.count.textContent,'1 établissement dans cette sélection');
  f.form.listeners.reset({preventDefault(){}});
  assert.ok(f.items.every(i=>!i.hidden));assert.equal(f.query.focused,true);
  assert.ok(matchesInstitution({text:'École supérieure de commerce Licence 3',country:'TN'},'ecole licence','TN'));
});

test('catalog pages expose all resources without JavaScript and keep canonical URLs independent of search', () => {
  const context={origin:'https://soutenancepro.com',production:true};
  const library=renderLibrary(context),directory=renderInstitutions(context);
  assert.equal((library.match(/data-resource data-format=/g)||[]).length,15);
  assert.match(library,/<link rel="canonical" href="https:\/\/soutenancepro.com\/bibliotheque">/);
  assert.equal((directory.match(/data-institution data-country=/g)||[]).length,institutions.length);
  assert.match(directory,/<link rel="canonical" href="https:\/\/soutenancepro.com\/etablissements">/);
  assert.match(directory,/<noscript>/);
  assert.match(directory,/Année du document : non précisée/);
  assert.match(directory,/Lien consulté le <time/);
  assert.match(directory,/pas un annuaire complet/);
  for(const item of institutions) {
    assert.ok(directory.includes(`id="${item.id}"`));
    assert.ok(directory.includes(item.sourceTitle.replace(/&/g,'&amp;')));
    assert.ok(directory.includes(`href="${item.guidePath}"`));
  }
  assert.deepEqual(new Set(institutions.map(item=>item.country)),new Set(['FR','MA','DZ','TN']));
});
