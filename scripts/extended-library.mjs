import { LIBRARY_SCOPE } from '../shared/library-scope.js';
import { readFileSync } from 'node:fs';
const coverage = JSON.parse(readFileSync(new URL('../content/hal-coverage.json', import.meta.url),'utf8'));
import { disciplines, documentTypes } from '../content/disciplines.mjs';
import { escapeHtml as e } from './seo.mjs';

export function renderExtendedLibrary() {
  const years = Array.from({length: LIBRARY_SCOPE.maxYear - LIBRARY_SCOPE.minYear + 1}, (_, i) => LIBRARY_SCOPE.maxYear - i);
  return `<section data-extended-panel hidden aria-label="Recherche dans les archives HAL">
    <div class="extended-intro"><div><span class="eyebrow">Archives ouvertes · Français</span><h2>Ouvre le champ de ta recherche.</h2><p>${coverage.totalDeposits.toLocaleString('fr-FR')} dépôts avec fichier déclaré, relevés dans HAL le 12 septembre 2026. Articles, thèses, mémoires et rapports de 2016 à 2026. Les résultats viennent de HAL et les documents s’ouvrent chez leur hébergeur.</p></div><a href="/guides/recherche-hal">Bien chercher dans HAL →</a></div>
    <form class="extended-search-form" data-extended-form role="search">
      <div class="catalogue-query"><label for="extended-query">Sujet, titre, auteur ou DOI</label><input id="extended-query" name="q" type="search" maxlength="160" placeholder="Ex. charge mentale, apprentissage, management…" autocomplete="off"></div>
      <div><label for="extended-discipline">Discipline</label><select id="extended-discipline" name="discipline"><option value="all">Toutes les disciplines</option>${disciplines.map(d => `<option value="${d.id}">${e(d.label)}</option>`).join('')}</select></div>
      <div><label for="extended-type">Type de publication</label><select id="extended-type" name="type"><option value="all">Tous les types</option>${Object.entries(documentTypes).map(([id, label]) => `<option value="${id}">${e(label)}</option>`).join('')}</select></div>
      <div><label for="extended-year">Année</label><select id="extended-year" name="year"><option value="all">2016–2026</option>${years.map(y => `<option value="${y}">${y}</option>`).join('')}</select></div>
      <div class="extended-form-actions"><button type="reset">Effacer les filtres</button><button type="submit" class="site-button">Rechercher dans HAL</button></div>
    </form>
    <p class="extended-status" data-extended-status role="status" aria-live="polite">La recherche se lance à l’ouverture de cet onglet.</p>
    <p class="fine" data-extended-limitation hidden></p>
    <div class="extended-results catalogue-results" data-extended-results></div>
    <nav class="extended-pagination catalogue-pagination" data-extended-pagination hidden aria-label="Pages des résultats HAL"><button type="button" data-direction="previous">← Précédent</button><span data-extended-page></span><button type="button" data-direction="next">Suivant →</button></nav>
    <p class="fine">HAL signale un fichier pour ces dépôts ; sa disponibilité et ses conditions d’utilisation restent celles de la source. Un dépôt ne constitue pas une validation scientifique. <a href="https://hal.science/" target="_blank" rel="noopener noreferrer">Consulter HAL directement ↗</a></p>
  </section>`;
}
