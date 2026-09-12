import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lexer } from 'marked';
import { normalizeDocumentContent } from '../shared/document-format.js';

test('legacy plan output becomes separate chapter and subsection headings without losing titles', () => {
  const source = `**Introduction générale**

- Contexte général de la transformation numérique de l’éducation
- Présentation de la problématique et des objectifs

**Chapitre 1 : Cadre conceptuel et état de l’art**
1.1. La data science : définitions, processus, cycle de vie d’un projet analytique 1.2. Les learning analytics et l’educational data mining : notions et distinctions 1.3. Revue des travaux existants sur la prédiction de la performance académique

Chapitre 2 : Méthodologie de recherche
2.1. Justification de l’approche mixte
2.2. Présentation du jeu de données (source, variables, volume, limites de collecte)
2.3. Prétraitement des données : nettoyage, gestion des valeurs manquantes, encodage

Conclusion générale`;
  const normalized = normalizeDocumentContent(source, 'plan');
  const headings = lexer(normalized).filter(token => token.type === 'heading');
  assert.deepEqual(headings.map(token => token.depth), [2,2,3,3,3,2,3,3,3,2]);
  assert.equal(headings[2].text, '1.1. La data science : définitions, processus, cycle de vie d’un projet analytique');
  assert.equal(headings[3].text, '1.2. Les learning analytics et l’educational data mining : notions et distinctions');
  assert.equal(headings[7].text, '2.2. Présentation du jeu de données (source, variables, volume, limites de collecte)');
  assert.equal(lexer(normalized).find(token => token.type === 'list').items.length, 2);
  assert.equal(normalizeDocumentContent(normalized, 'plan'), normalized, 'reopening and exporting an already repaired plan keeps the same structure');
});

test('a coherent outline without a chapter label and nested sections keeps its hierarchy', () => {
  const result = normalizeDocumentContent('1.1 Cadre conceptuel 1.1.1 Définition du concept 1.1.2 Dimensions du concept 1.2 État des travaux', 'plan');
  assert.deepEqual(lexer(result).filter(token => token.type === 'heading').map(token => [token.depth, token.text]), [
    [3, '1.1 Cadre conceptuel'],
    [4, '1.1.1 Définition du concept'],
    [4, '1.1.2 Dimensions du concept'],
    [3, '1.2 État des travaux']
  ]);
  const bold = normalizeDocumentContent('**1.1. Définition** **1.2. Cadre théorique**', 'plan');
  assert.equal(bold, '### 1.1. Définition\n\n### 1.2. Cadre théorique');
});

test('ordinary prose, references, dates, code and non-plan documents are not reformatted as outlines', () => {
  const preserved = [
    'La moyenne passe de 1.1 à 1.2 avec un écart-type de 0.5.',
    '1.12.2026 Date de collecte 2.12.2026 Date de contrôle',
    '10.1234 Exemple de DOI : https://doi.org/10.1234/1.2.3',
    '1.1. Première valeur 1.9. Valeur non consécutive',
    '> 1.1. Texte cité 1.2. Suite citée',
    '| 1.1. Mesure | 1.2. Résultat |',
    '    1.1. Code indenté 1.2. Suite de code',
    '1.1. Fonction `console.log` 1.2. Autre fonction',
    '- 1.1. Liste existante\n- 1.2. Autre élément',
    '````text\n1.1. Exemple 1.2. Suite\n```\n1.3. Toujours dans le code\n````',
    '~~~text\n1.1. Exemple 1.2. Suite\n~~~',
    '<p>1.1. Texte HTML 1.2. Suite HTML</p>'
  ];
  for (const text of preserved) assert.equal(normalizeDocumentContent(text, 'plan'), text);
  const planLikeText = 'Chapitre 1 : Cadre\n1.1. Premier point 1.2. Deuxième point';
  for (const module of ['redaction', 'references', 'dataanalysis', 'ppt', 'correction', undefined]) {
    assert.equal(normalizeDocumentContent(planLikeText, module), planLikeText, module);
  }
});
