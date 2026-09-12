import { readFileSync } from 'node:fs';
const coverage = JSON.parse(readFileSync(new URL('../content/hal-coverage.json', import.meta.url),'utf8'));
import { documents } from '../content/documents.mjs';
import { disciplines } from '../content/disciplines.mjs';
import { escapeHtml as e } from './seo.mjs';

export function renderHomeDiscovery() {
  const chosen = ['medecine', 'education', 'gestion', 'droit', 'informatique', 'psychologie'];
  const tones = ['sage', 'sand', 'blue', 'rose', 'lilac', 'peach'];
  const labels = ['SANTÉ', 'ÉDUCATION', 'GESTION', 'DROIT', 'NUMÉRIQUE', 'HUMAIN'];
  return `<section class="home-discovery" aria-labelledby="discovery-title"><div class="home-container">
    <div class="discovery-heading"><div><p class="home-eyebrow">Ton domaine. Tes prochaines lectures.</p><h2 id="discovery-title">Entre dans ta bibliothèque.</h2></div><a class="home-text-link" href="/bibliotheque">Explorer les 20 disciplines →</a></div>
    <div class="discovery-grid">${chosen.map((id, i) => {
      const discipline = disciplines.find(d => d.id === id), records = documents.filter(d => d.discipline === id);
      return `<a class="discovery-collection" data-tone="${tones[i]}" href="/bibliotheque/discipline/${id}"><span class="discovery-icon" aria-hidden="true">${labels[i]}</span><h3>${e(discipline.label)}</h3><p>${e(discipline.readingTitle)}</p><span class="discovery-count">${records.length} références dans la sélection <span aria-hidden="true">↗</span></span></a>`;
    }).join('')}</div>
    <div class="discovery-sourcebar"><p><strong>${coverage.totalDeposits.toLocaleString('fr-FR')}</strong> dépôts dans HAL<br><small>Fichier déclaré · relevé du 12 septembre 2026</small></p><a href="/bibliotheque?scope=hal">Explorer les archives dans la bibliothèque →</a><a href="/recherche">Google Scholar, PubMed et les autres moteurs →</a></div>
  </div></section>`;
}
