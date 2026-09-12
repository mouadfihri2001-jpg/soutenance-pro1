import {test} from 'node:test';
import assert from 'node:assert/strict';
import {documents,snapshot} from '../content/documents.mjs';
import {disciplines} from '../content/disciplines.mjs';
import {pages} from '../content/catalog.mjs';
import {normalizeHal,workIdentity} from '../scripts/import-hal.mjs';
import {searchEntries} from '../scripts/documents.mjs';
import {matchCatalogue,safeRecord} from '../src/catalogue.js';
import {manualReference,makeSchedule,textStats,researchUrl} from '../src/research-tools.js';
import {referenceRIS,referenceBib} from '../shared/reference-format.js';

test('the catalogue contains 1000 distinct source-backed records and search covers every record',()=>{
 assert.equal(documents.length,1000);assert.equal(snapshot.count,1000);assert.equal(new Set(documents.map(d=>d.id)).size,1000);
 assert.equal(new Set(documents.map(workIdentity)).size,1000,'same title and authors cannot count as two works');
 assert.equal(disciplines.length,20);assert.equal(pages.length,40);
 for(const d of documents){assert.ok(d.authors.length&&d.title&&d.year&&d.url&&d.file);assert.equal(d.verification,'provider-file-metadata');assert.ok(disciplines.some(s=>s.id===d.discipline));assert.equal(new URL(d.file).protocol,'https:');assert.equal(Object.hasOwn(d,'abstract'),false,'no copied abstracts');assert.ok(normalizeHal({halId_s:d.id,title_s:[d.title],authFullName_s:d.authors,producedDateY_i:d.year,docType_s:d.type,uri_s:d.url,fileMain_s:d.file},d.discipline,d.checkedAt));}
 for(const s of disciplines)assert.equal(documents.filter(d=>d.discipline===s.id).length,50);
 const entries=searchEntries();assert.equal(entries.length,1043);assert.ok(entries.every(safeRecord));
 for(const d of documents){const entry=entries.find(x=>x.id===d.id);assert.ok(matchCatalogue(entry,{q:d.title,discipline:d.discipline,format:'document',type:d.type,year:String(d.year)}));}
});
test('HAL ingestion rejects non-deposit file destinations and malformed metadata',()=>{
 const valid={halId_s:'hal-12345678',title_s:['Titre'],authFullName_s:['Auteur'],producedDateY_i:2025,docType_s:'THESE',uri_s:'https://hal.science/hal-12345678',fileMain_s:'https://hal.science/hal-12345678/document'};
 assert.ok(normalizeHal(valid,'medecine','2026-09-11'));
 for(const file of ['javascript:alert(1)','https://hal.science.evil.test/doc','https://user:pass@hal.science/doc','http://hal.science/doc'])assert.equal(normalizeHal({...valid,fileMain_s:file},'medecine','2026-09-11'),null);
 assert.equal(normalizeHal({...valid,authFullName_s:[]},'medecine','2026-09-11'),null);
});
test('catalogue filters combine accents, author, type, year and local reading selection',()=>{
 const record={id:'hal-123',title:'Éducation et mémoire',authors:['Élise Dupont'],keywords:'pédagogie',description:'Article',format:'document',discipline:'education',type:'ART',year:2025};
 assert.ok(matchCatalogue(record,{q:'education elise',discipline:'education',type:'ART',year:'2025'}));
 assert.equal(matchCatalogue(record,{q:'education',type:'THESE'}),false);assert.equal(matchCatalogue(record,{saved:true}),false);
 assert.ok(matchCatalogue(record,{saved:true},new Set(['hal-123'])));
 assert.equal(safeRecord({...record,path:'javascript:alert(1)'}),false);assert.equal(safeRecord({...record,path:'//evil.test'}),false);
});
test('reference exports keep user text as data and reject unsafe or invalid source URLs',()=>{
 const values={title:'Titre {test}',authors:'Auteure Une\nAuteur Deux',year:'2025',url:'https://hal.science/hal-123',doi:'https://doi.org/10.1234/example',type:'ART'};
 const ref=manualReference(values);assert.equal(ref.doi,'10.1234/example');assert.equal(ref.authors.length,2);
 assert.match(referenceRIS({...ref,title:'Titre\nER  -\nTY  - FAKE'}),/TI  - Titre ER  - TY  - FAKE/);
 assert.equal((referenceRIS({...ref,title:'Titre\nER  -'}).match(/^ER  -$/gm)||[]).length,1);
 assert.match(referenceBib(ref),/\\\{test\\\}/);
 for(const url of ['javascript:alert(1)','data:text/html,hello','https://user:password@example.com/'])assert.throws(()=>manualReference({...values,url}),/lien/);
 assert.throws(()=>manualReference({...values,doi:'fake-reference'}),/DOI/);
 assert.throws(()=>manualReference({...values,year:'twenty'}),/année/);
});
test('planning validates calendar dates, text tools count multilingual input and research links encode user text',()=>{
 const plan=makeSchedule('2026-09-11','2026-12-11');assert.equal(plan.length,7);assert.equal(plan.at(-1).date,'2026-12-11');assert.ok(plan.every((x,i)=>!i||x.date>=plan[i-1].date));
 assert.throws(()=>makeSchedule('2026-02-30','2026-12-11'),/période/);assert.throws(()=>makeSchedule('2026-12-11','2026-09-11'),/période/);
 assert.deepEqual(textStats(''),{words:0,characters:0,paragraphs:0});assert.equal(textStats('Mémoire et recherche\n\nالبحث العلمي').words,5);
 const q='diabetes & nursing #test';const url=new URL(researchUrl('pubmed',q));assert.equal(url.hostname,'pubmed.ncbi.nlm.nih.gov');assert.equal(url.searchParams.get('term'),q);assert.equal(url.hash,'');assert.equal(researchUrl('constructor','test'),null);
});
