import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {Packer} from 'docx';
import {createWord,createPowerPoint,presentationSections} from '../src/exports.js';
const project={title:'Mémoire — éducation et recherche',profile:{name:'Étudiant Test',university:'Université de test',level:'Master 2',language:'Français'}};
const doc={title:'Résultats et méthodologie',content:'# Contexte\n\n- Première idée vérifiée\n- Résumé français : é, è, à, œ.\n\nNotes orales: Présenter le contexte.\n\n# Résultats\n\n| Indicateur | Valeur |\n|---|---|\n| Exemple | 12 |\n\nTexte à réviser.'};
test('Word and PowerPoint produce real OOXML archives with editable content',async()=>{
 await mkdir('/tmp/soutenance-export-qa',{recursive:true});
 const word=await Packer.toBuffer(await createWord(doc,project));assert.equal(word.subarray(0,2).toString(),'PK');
 const ppt=await createPowerPoint(doc,project),buffer=await ppt.write({outputType:'nodebuffer'});assert.equal(buffer.subarray(0,2).toString(),'PK');
 await writeFile('/tmp/soutenance-export-qa/test.docx',word);await writeFile('/tmp/soutenance-export-qa/test.pptx',buffer);
 assert.equal(presentationSections(doc.content)[0].notes.length,1);
 assert.ok(presentationSections('# Long\n'+('long paragraph '.repeat(150))).every(s=>s.points.length<=4));
});
