import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { buildTemplates } from '../scripts/templates.mjs';
import { additionalTemplateResources } from '../content/template-catalog.mjs';

const expectedTemplates = [
  ['plan-rapport-stage.docx', 0],
  ['checklist-soutenance.docx', 1],
  ['fiche-lecture-source.docx', 0],
  ['fiche-cadrage-memoire.docx', 2],
  ['matrice-revue-litterature.docx', 3],
  ['journal-stage.docx', 2],
  ['suivi-corrections-encadrant.docx', 1],
  ['plan-presentation-soutenance.docx', 2]
];

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

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
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const size = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const local = buffer.readUInt32LE(cursor + 42);
    assert.equal(buffer.readUInt32LE(local), 0x04034b50, 'valid local entry');
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString();
    assert.ok(!files.has(name), 'ZIP entries must have unique names');
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const bytes = buffer.subarray(start, start + size);
    assert.ok(method === 0 || method === 8, 'supported ZIP compression');
    const decoded = method === 8 ? inflateRawSync(bytes) : bytes;
    assert.equal(decoded.length, uncompressedSize, `${name}: complete uncompressed part`);
    assert.equal(crc32(decoded), expectedCrc, `${name}: ZIP checksum`);
    files.set(name, decoded.toString());
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

test('library templates build as editable Word files with complete source and useful fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'soutenance-templates-'));
  try {
    const expected = expectedTemplates.map(([name]) => name);
    assert.deepEqual(await buildTemplates(join(directory, 'modeles')), expected);
    assert.deepEqual((await readdir(join(directory, 'modeles'))).sort(), [...expected].sort());
    const documents = new Map();
    for (const [filename, minimumTables] of expectedTemplates) {
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
      assert.doesNotMatch(xml, /undefined|\[object Object\]|Lorem ipsum/);
      assert.equal((xml.match(/<w:drawing>/g) || []).length, 1, 'only the supplied logo is an image');
      assert.match(xml, /descr="Logo de Soutenance Pro"/);
      assert.ok([...files.keys()].some(path => /^word\/media\/.*\.jpg$/.test(path)), 'local logo embedded');
      const tableBlocks = [...xml.matchAll(/<w:tbl>.*?<\/w:tbl>/gs)].map(match => match[0]);
      assert.ok(tableBlocks.length >= minimumTables, `${filename}: expected editable tables`);
      for (const block of tableBlocks) {
        assert.match(block, /<w:tblHeader\b/, 'table header repeats across pages');
        assert.match(block, /<w:cantSplit\b/, 'table rows stay together');
        const widths = [...block.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map(match => Number(match[1]));
        assert.equal(widths.reduce((sum, value) => sum + value, 0), 9638, 'table fits the page text area');
        const rows = [...block.matchAll(/<w:tr>.*?<\/w:tr>/gs)];
        assert.ok(rows.length >= 4, 'usable table has headings and several editable rows');
        for (const [row] of rows) assert.equal((row.match(/<w:tc>/g) || []).length, widths.length, 'complete cells in each row');
      }
      const settings = files.get('word/settings.xml') || '';
      assert.doesNotMatch(settings, /<w:documentProtection/);
      const footer = [...files].find(([path]) => /^word\/footer\d+\.xml$/.test(path))?.[1];
      assert.match(footer || '', /Modèle indépendant/);
      assert.match(footer || '', /Soutenance Pro/);
      const footerRelationships = [...files].filter(([path]) => /^word\/_rels\/footer\d+\.xml.rels$/.test(path));
      assert.ok(footerRelationships.some(([, xml]) => xml.includes('Target="https://soutenancepro.com/"') && xml.includes('TargetMode="External"')));
      assert.match(files.get('[Content_Types].xml'), /wordprocessingml.document.main\+xml/);
      for (const [path, part] of files) {
        if (path.endsWith('.xml') || path.endsWith('.rels')) {
          assert.ok(part.startsWith('<?xml'), `${filename}: ${path} XML declaration`);
          assert.doesNotMatch(part, /\u0000|\[object Object\]|undefined/, `${filename}: ${path} valid generated values`);
        }
      }
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
    const requiredPrompts = {
      'fiche-cadrage-memoire.docx': ['Question de recherche', 'Objectif principal', 'Devis envisagé', 'autorisations', 'solution de repli', 'Calendrier'],
      'matrice-revue-litterature.docx': ['Journal des recherches', 'Requête et filtres', 'non rapporté', 'résumé seulement', 'Accord ou divergence', 'Preuves convergentes'],
      'journal-stage.docx': ['Mon rôle exact', 'Preuve autorisée', 'Retour du tuteur', 'pas une feuille officielle de présence', 'aucune donnée personnelle inutile'],
      'suivi-corrections-encadrant.docx': ['Fichier corrigé reçu', 'Registre des remarques', 'Action réalisée', 'Nouvel emplacement', 'Question restante', 'à clarifier'],
      'plan-presentation-soutenance.docx': ['Message principal', 'Fiche de diapositive', 'Preuve et source', 'Commentaire oral', 'Durée mesurée', 'copie PDF']
    };
    for (const [filename, prompts] of Object.entries(requiredPrompts)) {
      for (const prompt of prompts) assert.ok(documents.get(filename).includes(prompt), `${filename}: ${prompt}`);
    }
    assert.deepEqual(additionalTemplateResources.map(resource => resource.path.split('/').pop()), expected.slice(3));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
