import { pages as healthPages } from './pages.mjs';
import { libraryPages } from './library-pages.mjs';

export const pages = [...healthPages, ...libraryPages];
export const templateResources = [
  { title: 'Plan commenté de rapport de stage', description: 'Une structure Word à compléter avec ton organisme, tes missions réelles et ton analyse.', path: '/modeles/plan-rapport-stage.docx', guide: '/guides/plan-rapport-de-stage', topic: 'stage', keywords: 'rapport stage plan sommaire entreprise missions word docx modèle' },
  { title: 'Checklist de soutenance', description: 'Prépare ton fil conducteur, règle ton temps et vérifie ton support avant le passage.', path: '/modeles/checklist-soutenance.docx', guide: '/soutenance', topic: 'oral', keywords: 'soutenance oral jury présentation powerpoint chronométrage word docx modèle' },
  { title: 'Fiche de lecture d’une source', description: 'Sépare la référence, les résultats de l’auteur, les limites et ton commentaire personnel.', path: '/modeles/fiche-lecture-source.docx', guide: '/guides/recherche-bibliographique-sante', topic: 'method', keywords: 'source bibliographie citation référence fiche lecture article doi word docx modèle' }
];

export function resourceTopic(page) {
  const primary = page.slug.includes('stage') ? 'stage'
    : page.slug.includes('soutenance') ? 'oral'
    : ['pfe-ispits', 'these-medecine'].includes(page.slug) ? 'health'
    : page.slug === 'pfe' || page.slug.includes('problematique') ? 'pfe' : 'method';
  return ['ispits','medecine'].includes(page.intent) && primary !== 'health' ? primary+' health' : primary;
}
