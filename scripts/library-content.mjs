import { escapeHtml as e } from './seo.mjs';

export const countryLibraryPaths = {FR:'/bibliotheque/france',MA:'/bibliotheque/maroc',DZ:'/bibliotheque/algerie',TN:'/bibliotheque/tunisie'};
const countryResources = [
  ['MA','Maroc','Retrouver les travaux locaux','Toubkal, les collections universitaires et les consignes propres à ta formation.'],
  ['FR','France','Identifier la bonne version','DUMAS, les thèses et les catalogues : distingue une référence repérée du texte que tu peux consulter.'],
  ['DZ','Algérie','Croiser langues et portails','Repérer thèses et articles avec les ressources nationales et préparer une recherche en plusieurs langues.'],
  ['TN','Tunisie','Passer du catalogue au document','Repérer les fonds des bibliothèques et les ressources documentaires adaptées à ton sujet.']
];

export function renderCountryLibrary() {
  return `<section id="parcours-pays" class="library-country-shelf"><div class="library-section-title"><div><p class="eyebrow">Des repères proches de ton parcours</p><h2>Où prépares-tu ton travail ?</h2></div><p>Les principes de recherche se partagent. Les catalogues, les accès et les consignes varient : ces parcours expliquent quoi chercher et où vérifier.</p></div><div class="library-country-grid">${countryResources.map(([code,label,title,text])=>`<article class="library-country-card"><p class="resource-type">${label}</p><h3><a href="${countryLibraryPaths[code]}">${title}</a></h3><p>${text}</p><a class="resource-link" href="${countryLibraryPaths[code]}">Lire le parcours ${label} →</a><a href="/etablissements?country=${code}">Consignes des établissements référencés</a></article>`).join('')}</div><p class="fine">Des sélections de ressources, sans affiliation aux établissements ni prétention à l’exhaustivité. Vérifie le diplôme, la version et l’année des consignes.</p></section>`;
}

const pathways = [
  {path:'/pfe', label:'Projet de fin d’études', title:'Du sujet à un projet réalisable', text:'Délimite la question, choisis tes livrables et prépare les éléments qui permettront de discuter ton travail.', next:'/guides/question-recherche', nextLabel:'Préciser une question de recherche'},
  {path:'/memoire', label:'Mémoire', title:'Construire un raisonnement documenté', text:'Relie tes lectures, ta méthode et tes observations. Utilise la grille de cohérence et les exemples commentés du parcours.', next:'/guides/revue-litterature', nextLabel:'Organiser une revue de littérature'},
  {path:'/rapport-de-stage', label:'Rapport de stage', title:'Passer des missions à leur analyse', text:'Distingue ce que tu as observé, ce que tu as réalisé et ce que tes traces de travail permettent de conclure.', next:'/guides/plan-rapport-de-stage', nextLabel:'Adapter le plan commenté'},
  {path:'/soutenance', label:'Soutenance', title:'Choisir ce que le jury doit retenir', text:'Prépare un fil conducteur, sélectionne les preuves utiles et transforme ton manuscrit en une présentation orale.', next:'/guides/repondre-jury', nextLabel:'Préparer les questions du jury'}
];

export function renderOwnedLibrary() {
  return `<section id="ressources-soutenance-pro" class="library-owned" aria-labelledby="library-owned-title">
    <div class="library-section-title"><div><p class="eyebrow">À lire sur Soutenance Pro</p><h2 id="library-owned-title">Des guides complets pour avancer ici.</h2></div><p>Les méthodes, les exemples commentés et les modèles ci-dessous se consultent dans notre bibliothèque. Choisis le travail que tu prépares, puis l’étape qui te manque.</p></div>
    <div class="library-owned-grid">${pathways.map(p=>`<article class="library-owned-card"><p class="resource-type">${e(p.label)}</p><h3><a href="${p.path}">${e(p.title)}</a></h3><p>${e(p.text)}</p><a class="resource-link" href="${p.path}">Lire le parcours complet →</a><a class="template-guide" href="${p.next}">${e(p.nextLabel)}</a></article>`).join('')}</div>
    <div class="library-method-grid"><section><h3>Comment utiliser une source dans ton mémoire ?</h3><p>Commence par une question précise. Dans la fiche du document, retrouve la référence, puis note ce que tu veux vérifier dans le texte. Après lecture, distingue l’idée de l’auteur, le passage qui l’appuie et ton commentaire personnel. Une référence repérée dans un moteur n’est pas encore une source que tu as consultée.</p><p>Le <a href="/guides/lire-article-scientifique">guide de lecture d’un article</a> explique quoi regarder dans la question, la méthode et les résultats. La <a href="/guides/fiche-lecture">fiche de lecture</a> aide ensuite à retrouver les pages utiles au moment de rédiger. Tu peux écrire et exporter tes notes depuis les fiches de la bibliothèque.</p></section>
    <section><h3>Que garder dans une revue de littérature ?</h3><p>Rapproche les travaux par question, concept ou méthode. Deux auteurs qui emploient le même mot ne mesurent pas nécessairement le même phénomène. Compare leur contexte et leurs limites avant de regrouper leurs conclusions. Consigne aussi la raison pour laquelle une source entre dans ta sélection.</p><p>Le <a href="/guides/revue-litterature">guide de revue de littérature</a> propose une organisation thématique. Pour la mise en forme, consulte les méthodes <a href="/guides/citer-apa">APA</a>, <a href="/guides/citer-vancouver">Vancouver</a> et le <a href="/outils/references">préparateur de références</a>. Adapte toujours le style aux consignes reçues.</p></section></div>
    ${renderCountryLibrary()}
    <div class="library-owned-note"><h3>Guides, références et textes intégraux</h3><p>Nos guides et modèles sont disponibles ici. Les fiches de recherche permettent de travailler une référence sur Soutenance Pro ; les PDF des auteurs restent accessibles depuis leur dépôt d’origine, selon leurs conditions d’accès. Les notes personnelles sont enregistrées dans ce navigateur et ne sont pas publiées avec le guide.</p><p><a href="/methode-editoriale">Lire notre méthode éditoriale</a> · <a href="/etablissements">Retrouver les consignes de son établissement</a></p></div>
  </section>`;
}
