import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extendedParams, safeExtendedRecord } from '../src/extended-catalogue.js';

test('extended search keeps pasted input bounded and URL-encoded without accepting injected query fields', () => {
  const params = extendedParams({q:'  santé\n&url=https://example.invalid #fragment ',type:'__proto__',year:'2027',discipline:'../../admin'},999);
  assert.equal(params.get('type'),'all');
  assert.equal(params.get('year'),'all');
  assert.equal(params.get('discipline'),'all');
  assert.equal(params.get('page'),'100');
  assert.equal(params.has('url'),false);
  assert.equal(params.get('q'),'santé &url=https://example.invalid #fragment');
  assert.equal(extendedParams({q:'a'.repeat(300)}).get('q').length,160);
});

test('extended result links only open declared HTTPS archive destinations', () => {
  const item={id:'hal-04862084',title:'Une recherche',authors:['Auteur Exemple'],year:2026,type:'ART',sourceUrl:'https://hal.science/hal-04862084',fileUrl:'https://hal.science/hal-04862084/document'};
  assert.ok(safeExtendedRecord(item));
  assert.ok(safeExtendedRecord({...item,fileUrl:'https://hal.inrae.fr/hal-04862084/document'}));
  for (const fileUrl of ['javascript:alert(1)','https://hal.science.evil.invalid/file','https://user:pass@hal.science/file','https://example.invalid/file','http://hal.science/file','https://hal.science:1234/file']) assert.equal(safeExtendedRecord({...item,fileUrl}),false);
  assert.equal(safeExtendedRecord({...item,year:2027}),false);
  assert.equal(safeExtendedRecord({...item,authors:'un tableau est requis'}),false);
  assert.equal(safeExtendedRecord({...item,id:1234}),false);
});
