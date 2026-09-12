import { LIBRARY_SCOPE, HAL_DOCUMENT_TYPES } from '../shared/library-scope.js';
import { readFileSync } from 'node:fs';
const coverage = JSON.parse(readFileSync(new URL('../content/hal-coverage.json', import.meta.url),'utf8'));
import { disciplines } from '../content/disciplines.mjs';
import { escapeHtml as e } from './seo.mjs';

export function renderExtendedLibrary() {
  return `<section data-extended-panel hidden aria-label="Recherche dans les archives HAL">
    <div class="extended-intro"><div><span class="eyebrow">Archives ouvertes · Recherche internationale</span><h2>Plus d’un million de documents dans HAL.</h2><p>Explore toutes les langues, périodes et catégories, puis précise ta recherche. Le CCSD recensait ${coverage.reportedFullTextDocuments.toLocaleString('fr-FR')} documents en texte intégral dans HAL au 5 février 2026. <a href="${e(coverage.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source et date du chiffre ↗</a></p><p class="fine">Ce chiffre décrit le fonds HAL, pas notre sélection locale. Le total de ta recherche s’affiche ci-dessous ; les fiches se travaillent ici et le fichier original reste chez son hébergeur.</p></div><a href="/guides/recherche-hal">Bien chercher dans HAL →</a></div>
    <nav class="extended-presets" data-extended-presets aria-label="Points de départ pour la recherche"><button type="button" data-preset="all">Tout HAL</button><button type="button" data-preset="french">Français · depuis 2016</button><button type="button" data-preset="theses">Thèses · toutes langues</button></nav>
    <form class="extended-search-form" data-extended-form role="search">
      <div class="catalogue-query"><label for="extended-query">Sujet, titre, auteur ou DOI</label><input id="extended-query" name="q" type="search" maxlength="160" placeholder="Ex. charge mentale, apprentissage, management…" autocomplete="off"></div>
      <div><label for="extended-discipline">Discipline</label><select id="extended-discipline" name="discipline"><option value="all">Toutes les disciplines</option>${disciplines.map(d => `<option value="${d.id}">${e(d.label)}</option>`).join('')}</select></div>
      <div><label for="extended-type">Type de publication</label><select id="extended-type" name="type"><option value="all">Tous les types</option>${Object.entries(HAL_DOCUMENT_TYPES).map(([id, label]) => `<option value="${id}">${e(label)}</option>`).join('')}</select></div>
      <div><label for="extended-language">Langue du document</label><select id="extended-language" name="language"><option value="all">Toutes les langues</option><option value="fr">Français</option><option value="en">Anglais</option><option value="ar">Arabe</option></select></div>
      <div><label for="extended-period">Période de publication</label><select id="extended-period" name="period"><option value="all">Toutes les périodes</option><option value="recent">Références récentes · 2016–2026</option></select></div>
      <div><label for="extended-year">Année précise (facultatif)</label><input id="extended-year" name="year" type="number" inputmode="numeric" min="${LIBRARY_SCOPE.archiveMinYear}" max="${LIBRARY_SCOPE.maxYear}" step="1" placeholder="Ex. 2024"></div>
      <div class="extended-form-actions"><button type="reset">Effacer les filtres</button><button type="submit" class="site-button">Rechercher dans HAL</button></div>
    </form>
    <p class="extended-status" data-extended-status role="status" aria-live="polite">La recherche se lance à l’ouverture de cet onglet.</p>
    <p class="fine" data-extended-limitation hidden></p>
    <div class="extended-results catalogue-results" data-extended-results></div>
    <nav class="extended-pagination catalogue-pagination" data-extended-pagination hidden aria-label="Pages des résultats HAL"><button type="button" data-direction="previous">← Précédent</button><span data-extended-page></span><button type="button" data-direction="next">Suivant →</button></nav>
    <p class="fine">HAL signale un fichier pour ces dépôts ; sa disponibilité et ses conditions d’utilisation restent celles de la source. Certaines notices peuvent être omises si leurs métadonnées ou leurs liens ne sont pas exploitables. Des doublons peuvent subsister dans HAL ; un dépôt ne constitue pas une validation scientifique. <a href="https://hal.science/" target="_blank" rel="noopener noreferrer">Consulter HAL directement ↗</a></p>
  </section>`;
}
