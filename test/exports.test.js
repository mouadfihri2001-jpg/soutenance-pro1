import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {Packer} from 'docx';
import {inflateRawSync} from 'node:zlib';
import {createWord,createPowerPoint,presentationSections} from '../src/exports.js';
const project={title:'Mémoire — éducation et recherche',profile:{name:'Étudiant Test',university:'Université de test',level:'Master 2',language:'Français'}};
const doc={title:'Résultats et méthodologie',content:'# Contexte\n\n- Première idée vérifiée\n- Résumé français : é, è, à, œ.\n\nNotes orales: Présenter le contexte.\n\n# Résultats\n\n| Indicateur | Valeur |\n|---|---|\n| Exemple | 12 |\n\nTexte à réviser.'};
function xmlPart(buffer, filename) {
 const end=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
 assert.ok(end>=0,'ZIP central directory exists');
 let offset=buffer.readUInt32LE(end+16);
 for(let index=0;index<buffer.readUInt16LE(end+10);index++){
  assert.equal(buffer.readUInt32LE(offset),0x02014b50);
  const nameLength=buffer.readUInt16LE(offset+28),name=buffer.subarray(offset+46,offset+46+nameLength).toString();
  if(name===filename){
   const local=buffer.readUInt32LE(offset+42),start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
   const content=buffer.subarray(start,start+buffer.readUInt32LE(offset+20));
   return (buffer.readUInt16LE(offset+10)===8?inflateRawSync(content):content).toString();
  }
  offset+=46+nameLength+buffer.readUInt16LE(offset+30)+buffer.readUInt16LE(offset+32);
 }
 throw new Error(`Missing Word part: ${filename}`);
}
test('Word and PowerPoint produce real OOXML archives with editable content',async()=>{
 await mkdir('/tmp/soutenance-export-qa',{recursive:true});
 const word=await Packer.toBuffer(await createWord(doc,project));assert.equal(word.subarray(0,2).toString(),'PK');
 const ppt=await createPowerPoint(doc,project),buffer=await ppt.write({outputType:'nodebuffer'});assert.equal(buffer.subarray(0,2).toString(),'PK');
 await writeFile('/tmp/soutenance-export-qa/test.docx',word);await writeFile('/tmp/soutenance-export-qa/test.pptx',buffer);
 assert.equal(presentationSections(doc.content)[0].notes.length,1);
 assert.ok(presentationSections('# Long\n'+('long paragraph '.repeat(150))).every(s=>s.points.length<=4));
});

test('Word exports repaired plans as editable heading paragraphs, with A4 pages and matching hierarchy',async()=>{
 const outline={module:'plan',title:'Plan du mémoire',content:'## Chapitre 1 : Cadre conceptuel\n\n1.1. Définition du concept 1.1.1. Première dimension 1.1.2. Deuxième dimension 1.2. État des travaux\n\n## Chapitre 2 : Méthodologie\n\n2.1. Population étudiée\n2.2. Procédure de collecte'};
 const buffer=await Packer.toBuffer(await createWord(outline,project));
 const xml=xmlPart(buffer,'word/document.xml');
 const paragraphs=[...xml.matchAll(/<w:p(?:\s[^>]*)?>.*?<\/w:p>/gs)].map(match=>match[0]);
 for(const [text,style] of [['1.1. Définition du concept','Heading3'],['1.1.1. Première dimension','Heading4'],['1.1.2. Deuxième dimension','Heading4'],['1.2. État des travaux','Heading3'],['2.1. Population étudiée','Heading3'],['2.2. Procédure de collecte','Heading3']]){
  const matching=paragraphs.filter(paragraph=>paragraph.includes(text));
  assert.equal(matching.length,1,`${text}: one editable paragraph`);
  assert.match(matching[0],new RegExp(`w:pStyle w:val="${style}"`));
  assert.match(matching[0],/<w:keepNext\/>/);
  assert.equal((matching[0].match(/\d\.\d(?:\.\d)?\./g)||[]).length,1,'subsection titles must not share one Word paragraph');
 }
 assert.match(xml,/<w:pgSz w:w="11906" w:h="16838"/);
 assert.match(xmlPart(buffer,'word/styles.xml'),/w:styleId="Heading4"/);
 assert.match(xml,/<w:widowControl\/>/);
});
