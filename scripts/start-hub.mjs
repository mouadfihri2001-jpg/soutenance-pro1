import { pages, templateResources } from '../content/catalog.mjs';
import { documents } from '../content/documents.mjs';
import { disciplines } from '../content/disciplines.mjs';

const paths = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  book: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
  quote: '<path d="M10 6H4v7h6V6Zm10 0h-6v7h6V6ZM10 13c0 4-2 6-6 6m16-6c0 4-2 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  slides: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-5 0 5-5 5 5M7 7h6m-6 4h10"/>',
};
const icon = (name, className = '') => `<svg${className ? ` class="${className}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
// Reopen an already-used auth hash while preserving modified-click navigation.
const workspaceClick = mode => `onclick="if (!event.ctrlKey &amp;&amp; !event.metaKey &amp;&amp; !event.shiftKey &amp;&amp; !event.altKey &amp;&amp; typeof window.openApp === 'function') { window.openApp('${mode}'); return false; }"`;

export function renderProductDemo() {
  const outline = [
    ['Introduction', 'Contexte et problématique'],
    ['Cadre théorique', 'Concepts et travaux consultés'],
    ['Méthodologie', 'Terrain, méthode et données'],
    ['Résultats et discussion', 'Analyse, limites et perspectives'],
  ];
  return `<div class="product-demo" id="demo" data-product-demo>
    <div class="product-demo-topbar"><span class="product-demo-mark">${icon('layers')}</span><strong>Mon espace</strong><span class="product-demo-badge">Aperçu du parcours</span></div>
    <div class="product-demo-heading"><span>PROJET EXEMPLE · MÉMOIRE</span><h2>Mon projet prend forme.</h2><p>Du sujet au document, une étape à la fois.</p></div>
    <div class="product-demo-tabs" role="tablist" aria-label="Explorer les étapes du projet" hidden data-demo-tabs>
      <button type="button" id="demo-tab-plan" role="tab" data-demo-tab="plan" aria-selected="true" aria-controls="demo-plan" tabindex="0">${icon('file')}<span>Mon plan</span></button>
      <button type="button" id="demo-tab-sources" role="tab" data-demo-tab="sources" aria-selected="false" aria-controls="demo-sources" tabindex="-1">${icon('book')}<span>Mes sources</span></button>
      <button type="button" id="demo-tab-presentation" role="tab" data-demo-tab="presentation" aria-selected="false" aria-controls="demo-presentation" tabindex="-1">${icon('slides')}<span>Ma soutenance</span></button>
    </div>
    <div class="product-demo-stage">
      <section class="product-demo-panel" data-demo-panel="plan" id="demo-plan" role="tabpanel" aria-labelledby="demo-tab-plan" tabindex="0">
        <div class="demo-document-heading"><span class="demo-file-icon">${icon('file')}</span><div><small>STRUCTURE DU MÉMOIRE</small><h3>Un plan clair pour avancer</h3></div><span class="demo-format">DOCX</span></div>
        <ol class="demo-outline">${outline.map(([title, text], i) => `<li><span>0${i + 1}</span><div><strong>${title}</strong><small>${text}</small></div>${icon('check')}</li>`).join('')}</ol>
        <div class="demo-footnote">${icon('layers')}<span>Des sections que tu peux reprendre et modifier.</span></div>
      </section>
      <section class="product-demo-panel" data-demo-panel="sources" id="demo-sources" role="tabpanel" aria-labelledby="demo-tab-sources" tabindex="0" hidden>
        <div class="demo-document-heading"><span class="demo-file-icon">${icon('book')}</span><div><small>DU SUJET À LA RÉFÉRENCE</small><h3>Chaque source a sa place</h3></div><span class="demo-format">BIBLIO</span></div>
        <div class="demo-source-list">
          <article><span class="demo-source-icon">${icon('search')}</span><div><strong>Rechercher par sujet</strong><p>Explore les publications et retrouve le dépôt d’origine.</p><span class="demo-source-tag">Crossref · Sélection HAL</span></div></article>
          <article><span class="demo-source-icon">${icon('book')}</span><div><strong>Garder les passages utiles</strong><p>Note ce que tu as lu, les pages et les limites du travail.</p><span class="demo-source-tag">Lecture · Notes personnelles</span></div></article>
          <article><span class="demo-source-icon">${icon('quote')}</span><div><strong>Préparer la bibliographie</strong><p>Conserve les auteurs, le titre et le lien de la publication.</p><span class="demo-source-tag">Références · Export</span></div></article>
        </div>
      </section>
      <section class="product-demo-panel" data-demo-panel="presentation" id="demo-presentation" role="tabpanel" aria-labelledby="demo-tab-presentation" tabindex="0" hidden>
        <div class="demo-document-heading"><span class="demo-file-icon">${icon('slides')}</span><div><small>PRÉPARER L’ORAL</small><h3>Donne un fil à ta soutenance</h3></div><span class="demo-format">PPTX</span></div>
        <div class="demo-slide"><span>01 / SOUTENANCE</span><h3>Ton sujet.<br>Un fil conducteur.</h3><div class="demo-slide-rule"></div><p>Le contexte · La méthode · Les résultats</p></div>
        <div class="demo-slide-thumbs"><span>01 Introduction</span><span>02 Méthode</span><span>03 Résultats</span></div>
        <div class="demo-footnote">${icon('slides')}<span>Un support à adapter, puis à répéter à voix haute.</span></div>
      </section>
    </div>
    <div class="product-demo-footer"><span>Exemples illustratifs · Aucun projet créé</span><a href="/#inscription" ${workspaceClick('signup')}>Créer mon projet ${icon('arrow')}</a></div>
  </div>`;
}

export function renderStartHub() {
  const actions = [
    ['plus', 'Créer mon projet', 'Mon sujet, mes consignes, mes documents', '/#inscription'],
    ['search', 'Trouver des sources', 'Rechercher dans la bibliothèque', '#recherche-rapide'],
    ['calendar', 'Planifier mon travail', 'Mes étapes, jusqu’à la date de rendu', '/outils/planning'],
    ['quote', 'Préparer une référence', 'La mettre en forme et l’exporter', '/outils/references'],
  ];
  return `<section class="start-hub" id="demarrer" aria-labelledby="start-hub-title"><div class="home-container">
    <div class="start-hub-heading"><div><p class="start-eyebrow">TON PROCHAIN PAS</p><h2 id="start-hub-title">Qu’est-ce qu’on fait avancer aujourd’hui ?</h2></div><a class="start-resume" href="/#connexion" ${workspaceClick('login')}>Retrouver mon espace ${icon('arrow')}</a></div>
    <div class="start-action-grid">${actions.map(([symbol, title, text, href], i) => `<a class="start-action${i === 0 ? ' start-action-primary' : ''}" href="${href}"${i === 0 ? ' ' + workspaceClick('signup') : ''}><span class="start-action-icon">${icon(symbol)}</span><span class="start-action-copy"><strong>${title}</strong><small>${text}</small></span>${icon('arrow', 'start-arrow')}</a>`).join('')}</div>
    <div class="start-research" id="recherche-rapide">
      <div class="start-research-heading"><span class="start-research-icon">${icon('book')}</span><div><h3>Trouve les sources de ton prochain chapitre.</h3><p>Un sujet, un titre ou un auteur : commence ici.</p></div><span class="start-free-label">Accès gratuit</span></div>
      <form class="start-search" role="search" action="/bibliotheque" method="get"><input type="hidden" name="scope" value="hal"><label class="start-visually-hidden" for="home-query">Rechercher des publications par sujet, titre ou auteur</label><div class="start-search-field">${icon('search')}<input type="search" name="q" id="home-query" placeholder="Ex. : santé publique, éducation, management…" maxlength="160"><button type="submit">Rechercher ${icon('arrow')}</button></div></form>
      <div class="start-search-shortcuts"><span>Explorer :</span><a href="/bibliotheque?scope=hal&amp;q=sant%C3%A9%20publique">Santé publique</a><a href="/bibliotheque?scope=hal&amp;q=%C3%A9ducation">Éducation</a><a href="/bibliotheque?scope=hal&amp;q=management">Management</a><a href="/bibliotheque#modeles">Modèles Word ${icon('arrow')}</a></div>
    </div>
    <div class="start-metrics" aria-label="Les ressources à explorer">
      <div><strong>1&nbsp;000&nbsp;000+</strong><span>documents à explorer via HAL</span></div><div><strong>${documents.length.toLocaleString('fr-FR')}</strong><span>références sélectionnées</span></div><div><strong>${pages.length + templateResources.length}</strong><span>guides, parcours et modèles</span></div>
      <details class="start-metrics-details"><summary>Ce que comprend la bibliothèque</summary><p>La recherche élargie explore le corpus HAL. Notre sélection comprend ${documents.length.toLocaleString('fr-FR')} références dans ${disciplines.length} disciplines, ${pages.length} guides et parcours, et ${templateResources.length} modèles Word.</p><a href="/methode-editoriale">Consulter notre méthode éditoriale ${icon('arrow')}</a></details>
    </div>
  </div></section>`;
}
