import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNotes, readNotes, saveNotes, readingNotesText, normalizeReadingReference, readSavedReadings, saveReadingReference, removeSavedReading, findSavedReading } from '../src/library-notes.js';

const record = {id:'hal-04862084',title:'Une recherche',authors:['Autrice Exemple'],year:2026,sourceUrl:'https://hal.science/hal-04862084'};
const fullRecord = {...record,type:'ART',fileUrl:'https://hal.science/hal-04862084/document'};
const memoryStorage = () => {
  const values = new Map();
  return {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,value),values};
};

test('notes survive storage round trip without mixing documents or carrying unknown fields', () => {
  const values = new Map();
  const storage = {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,value)};
  const result = saveNotes(storage, record.id, {question:'Quel effet ?',passage:'« Une citation. »\r\nMa note.',page:'18–19',unsafe:'ignored'});
  assert.equal(result.saved,true);
  assert.equal(readNotes(storage,record.id).notes.passage,'« Une citation. »\nMa note.');
  assert.equal(Object.hasOwn(readNotes(storage,record.id).notes,'unsafe'),false);
  assert.equal(readNotes(storage,'hal-01234567').status,'empty');
  const raw = [...values.values()][0];
  assert.equal(readNotes({getItem:()=>raw},'hal-01234567').status,'invalid');
});

test('saved reading index keeps only safe metadata and never incorporates note bodies or untrusted URLs', () => {
  const storage = memoryStorage();
  assert.equal(saveReadingReference(storage,{...fullRecord,notes:{question:'PERSONAL-NOTE'},token:'PRIVATE'}).saved,true);
  const metadata = [...storage.values.values()][0];
  assert.equal(metadata.includes('PERSONAL-NOTE'),false); assert.equal(metadata.includes('PRIVATE'),false);
  assert.deepEqual(findSavedReading(storage,fullRecord.id),fullRecord);
  for (const fileUrl of ['javascript:alert(1)','https://hal.science.evil.invalid/file','https://user:pass@hal.science/file','http://hal.science/file','https://hal.science:1234/file','https://hal.science/\nsecret']) {
    assert.equal(normalizeReadingReference({...fullRecord,fileUrl}),null);
    assert.equal(saveReadingReference(storage,{...fullRecord,fileUrl}).saved,false);
  }
  assert.equal(findSavedReading(storage,'https://outside.example/file'),null);
  assert.equal(findSavedReading(storage,'../../secret'),null);
  assert.equal(normalizeReadingReference({...fullRecord,authors:Array(101).fill('Auteur')}),null);
});

test('historical multilingual references retain source types and languages after local storage and reopening', () => {
  const storage = memoryStorage();
  const historical = {...fullRecord,year:1899,type:'OUV',sourceType:'OUV',languages:['fr','ar','eng']};
  const result = saveReadingReference(storage,historical);
  assert.equal(result.saved,true);
  assert.deepEqual(result.record,historical);
  historical.languages.push('de');
  assert.deepEqual(findSavedReading(storage,historical.id).languages,['fr','ar','eng']);
  assert.deepEqual(readSavedReadings(storage).records,[result.record]);
  for (const type of ['COMM','COUV','UNDEFINED','LECTURE','POSTER','OTHER']) {
    const reference = {...fullRecord,type,sourceType:type};
    assert.equal(saveReadingReference(storage,reference).saved,true);
    assert.deepEqual(findSavedReading(storage,reference.id),reference);
  }
  const otherSource = {...fullRecord,type:'OTHER',sourceType:'VIDEO',languages:['en']};
  assert.equal(saveReadingReference(storage,otherSource).saved,true);
  assert.deepEqual(findSavedReading(storage,otherSource.id),otherSource);
  assert.equal(saveReadingReference(storage,fullRecord).saved,true);
  assert.equal(Object.hasOwn(findSavedReading(storage,fullRecord.id),'languages'),false);
  assert.equal(Object.hasOwn(findSavedReading(storage,fullRecord.id),'sourceType'),false);
});

test('saved references reject unsupported years, unsafe types and malformed language metadata', () => {
  const invalid = [
    {year:999},{year:2027},{year:1899.5},
    {type:'UNKNOWN'},{type:'<script>'},{type:'art'},
    {sourceType:''},{sourceType:'A'.repeat(41)},{sourceType:'ART\nSCRIPT'},{sourceType:'art'},{sourceType:42},{sourceType:null},
    {languages:'fr'},{languages:null},{languages:['FR']},{languages:['fr-FR']},{languages:['f']},
    {languages:['fren']},{languages:['fr\n']},{languages:['fr','fr']},{languages:['fr',42]},{languages:Array(1)},
    {languages:['fr','en','ar','de','it','es','pt','nl','ru']}
  ];
  for (const fields of invalid) {
    const storage = memoryStorage();
    assert.equal(normalizeReadingReference({...fullRecord,...fields}),null,JSON.stringify(fields));
    assert.equal(saveReadingReference(storage,{...fullRecord,...fields}).saved,false,JSON.stringify(fields));
    assert.equal(storage.values.size,0);
  }
  assert.equal(normalizeReadingReference({...fullRecord,year:1000}).year,1000);
  assert.deepEqual(normalizeReadingReference({...fullRecord,languages:[]}).languages,[]);
});

test('100 most recently saved readings can be reopened and removed without deleting their notes', () => {
  const storage = memoryStorage();
  saveNotes(storage,fullRecord.id,{question:'Keep these notes'});
  saveReadingReference(storage,fullRecord);
  for (let i=0;i<100;i++) {
    const id = 'hal-' + String(i).padStart(8,'0');
    assert.equal(saveReadingReference(storage,{...fullRecord,id,sourceUrl:`https://hal.science/${id}`,fileUrl:`https://hal.science/${id}/document`}).saved,true);
  }
  assert.equal(readSavedReadings(storage).records.length,100);
  assert.equal(findSavedReading(storage,fullRecord.id),null);
  assert.equal(readNotes(storage,fullRecord.id).notes.question,'Keep these notes');
  saveReadingReference(storage,fullRecord);
  assert.equal(readSavedReadings(storage).records[0].id,fullRecord.id);
  assert.equal(readSavedReadings(storage).records.length,100);
  assert.equal(removeSavedReading(storage,fullRecord.id),true);
  assert.equal(findSavedReading(storage,fullRecord.id),null);
  assert.equal(readNotes(storage,fullRecord.id).notes.question,'Keep these notes');
});

test('corrupt or unavailable reading indexes fail safely while existing note storage remains independent', () => {
  const blocked = {getItem(){throw new Error('SecurityError');},setItem(){throw new Error('QuotaExceededError');}};
  assert.equal(readSavedReadings(blocked).status,'unavailable');
  assert.equal(saveReadingReference(blocked,fullRecord).saved,false);
  assert.equal(removeSavedReading(blocked,fullRecord.id),false);
  assert.equal(readSavedReadings({getItem:()=>'{bad'}).status,'unavailable');
  const malicious = {...fullRecord,fileUrl:'https://outside.invalid/file'};
  const mixed = {getItem:()=>JSON.stringify({version:1,records:[malicious,fullRecord]})};
  assert.equal(readSavedReadings(mixed).status,'partial');
  assert.deepEqual(readSavedReadings(mixed).records,[fullRecord]);
  assert.equal(saveReadingReference(mixed,fullRecord).saved,false);
  assert.equal(readSavedReadings({getItem:()=> 'a'.repeat(1800001)}).status,'invalid');
  const storage = memoryStorage();
  saveNotes(storage,fullRecord.id,{question:'My note survives a full metadata index'});
  const quotaStorage = {getItem:storage.getItem,setItem(){throw new Error('QuotaExceededError');}};
  assert.equal(saveReadingReference(quotaStorage,fullRecord).saved,false);
  assert.equal(readNotes(storage,fullRecord.id).notes.question,'My note survives a full metadata index');
});

test('blocked, full, malformed or overlarge storage cannot discard the current note', () => {
  const blocked = {getItem(){throw new Error('SecurityError');},setItem(){throw new Error('QuotaExceededError');}};
  assert.equal(readNotes(blocked,record.id).status,'unavailable');
  const result = saveNotes(blocked,record.id,{question:'Conserver cette note'});
  assert.equal(result.saved,false);
  assert.equal(result.notes.question,'Conserver cette note');
  assert.equal(readNotes({getItem:()=>'{invalid'},record.id).status,'unavailable');
  assert.equal(readNotes({getItem:()=> 'a'.repeat(50001)},record.id).status,'invalid');
  assert.equal(saveNotes(null,record.id,{question:'Toujours exportable'}).notes.question,'Toujours exportable');
});

test('notes are bounded plain text and exports distinguish user notes from publication content', () => {
  const notes = normalizeNotes({question:{toString(){throw new Error('not text');}},passage:'<script>alert(1)</script>\u0000\nCitation',page:'a'.repeat(500),limits:'b'.repeat(5000)});
  assert.equal(notes.question,'');
  assert.equal(notes.page.length,80); assert.equal(notes.limits.length,4000);
  assert.equal(notes.passage,'<script>alert(1)</script>\nCitation');
  const exported = readingNotesText({...record,title:'Titre\nInjecté'},notes);
  assert.match(exported,/Titre Injecté/);
  assert.match(exported,/notes ci-dessous ont été saisies par leur utilisateur/);
  assert.match(exported,/https:\/\/hal.science\/hal-04862084/);
  assert.match(exported,/MA QUESTION DE RECHERCHE\n\(Non renseigné\)/);
});
