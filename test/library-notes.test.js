import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNotes, readNotes, saveNotes, readingNotesText } from '../src/library-notes.js';

const record = {id:'hal-04862084',title:'Une recherche',authors:['Autrice Exemple'],year:2026,sourceUrl:'https://hal.science/hal-04862084'};

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
