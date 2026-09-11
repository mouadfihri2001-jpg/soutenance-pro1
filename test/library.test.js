import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesResource, setupLibrary } from '../src/library.js';
import { pages, resourceTopic } from '../content/catalog.mjs';

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

test('the actual library controls hide only unmatched resources and reset restores every group', () => {
  const control = (value='') => ({value,hidden:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},focus(){this.focused=true;}});
  const query=control(),topic=control('all'),reset=control(),form=control();form.hidden=true;
  const count={textContent:''},empty={hidden:true};
  const items=[{dataset:{search:'Introduction du rapport de stage',topic:'stage'},hidden:false},{dataset:{search:'Méthode de recherche bibliographique',topic:'method health'},hidden:false}];
  const groups=items.map(item=>({hidden:false,querySelectorAll:()=>[item]}));
  form.querySelector=selector=>({'[name="q"]':query,'[name="topic"]':topic,'[type="reset"]':reset})[selector];
  const doc={querySelector:selector=>({'[data-library-form]':form,'#library-count':count,'#library-empty':empty})[selector],querySelectorAll:selector=>selector==='[data-resource]'?items:groups};
  setupLibrary(doc);assert.equal(form.hidden,false);assert.equal(count.textContent,'2 ressources disponibles');
  topic.value='health';topic.listeners.change();assert.deepEqual(items.map(i=>i.hidden),[true,false]);assert.deepEqual(groups.map(g=>g.hidden),[true,false]);
  query.value='Aucune ressource';query.listeners.input();assert.equal(empty.hidden,false);assert.equal(count.textContent,'0 ressources disponibles');
  let prevented=false;form.listeners.reset({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(query.value,'');assert.equal(topic.value,'all');assert.equal(query.focused,true);
  assert.ok(items.every(i=>!i.hidden));assert.ok(groups.every(g=>!g.hidden));assert.equal(empty.hidden,true);assert.equal(reset.hidden,true);
});
