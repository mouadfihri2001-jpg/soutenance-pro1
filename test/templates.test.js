import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { buildTemplates } from '../scripts/templates.mjs';

// Read actual OOXML entries without adding a ZIP package to the app.
function unzip(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end >= 0, 'ZIP central directory must exist');
  const count = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  const files = new Map();
  for (let index = 0; index < count; index++) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50, 'valid central entry');
    const method = buffer.readUInt16LE(cursor + 10);
    const size = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const local = buffer.readUInt32LE(cursor + 42);
    assert.equal(buffer.readUInt32LE(local), 0x04034b50, 'valid local entry');
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString();
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const bytes = buffer.subarray(start, start + size);
    assert.ok(method === 0 || method === 8, 'supported ZIP compression');
    files.set(name, (method === 8 ? inflateRawSync(bytes) : bytes).toString());
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

test('library templates build as editable Word files with complete source and useful fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'soutenance-templates-'));
  try {
    const expected = ['plan-rapport-stage.docx', 'checklist-soutenance.docx', 'fiche-lecture-source.docx'];
    assert.deepEqual(await buildTemplates(join(directory, 'modeles')), expected);
    assert.deepEqual((await readdir(join(directory, 'modeles'))).sort(), [...expected].sort());
    const documents = new Map();
    for (const filename of expected) {
      const files = unzip(await readFile(join(directory, 'modeles', filename)));
      for (const required of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml']) {
        assert.ok(files.has(required), `${filename}: ${required}`);
      }
      const xml = files.get('word/document.xml');
      documents.set(filename, xml);
      assert.ok((xml.match(/<w:p[ >]/g) || []).length > 30, 'editable paragraphs, not a flattened image');
      assert.match(xml, /w:pStyle w:val="Title"/);
      assert.match(xml, /w:pStyle w:val="Heading1"/);
      assert.match(xml, /champs entre crochets/);
      assert.match(xml, /guide de ton établissement/);
      assert.doesNotMatch(xml, /<w:drawing|undefined|\[object Object\]|Lorem ipsum/);
      const settings = files.get('word/settings.xml') || '';
      assert.doesNotMatch(settings, /<w:documentProtection/);
      const footer = [...files].find(([path]) => /^word\/footer\d+\.xml$/.test(path))?.[1];
      assert.match(footer || '', /Modèle indépendant/);
      assert.match(footer || '', /Soutenance Pro/);
      const footerRelationships = [...files].filter(([path]) => /^word\/_rels\/footer\d+\.xml.rels$/.test(path));
      assert.ok(footerRelationships.some(([, xml]) => xml.includes('Target="https://soutenancepro.com/"') && xml.includes('TargetMode="External"')));
      assert.match(files.get('[Content_Types].xml'), /wordprocessingml.document.main\+xml/);
    }
    const report = documents.get('plan-rapport-stage.docx');
    for (const field of ['Période du stage', 'Ta contribution', 'Preuve autorisée', 'Résultat observé', 'Limites', 'confidentialité']) assert.ok(report.includes(field), field);
    const checklist = documents.get('checklist-soutenance.docx');
    assert.match(checklist, /ne sont pas une règle universelle/);
    assert.match(checklist, /chronomètre/);
    assert.match(checklist, /copie PDF/);
    assert.match(checklist, /\[total à vérifier\]/);
    const reading = documents.get('fiche-lecture-source.docx');
    for (const field of ['DOI', 'URL consultée', 'Méthode', 'Résultats principaux', 'Limites annoncées', 'Extrait exact', 'Reformulation personnelle', 'Ton commentaire', 'Référence bibliographique finale']) assert.ok(reading.includes(field), field);
    assert.match(reading, /résumé seulement/);
    assert.match(reading, /correction ou d’un retrait/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
