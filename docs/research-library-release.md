# Soutenance Pro — bibliothèque académique

Version initiale préparée le 11 septembre 2026, enrichie le 12 septembre. La section « Extension des parcours et de la bibliothèque » décrit les comptes actuels ; les sections datées antérieures conservent l'historique. Publication sur le domaine de production et paiements non confirmés par ce document.

## Mise à jour du 12 septembre 2026

L’accueil et les pages publiques reçoivent une direction visuelle plus affirmée : hero vert profond, typographie claire, recherche contrastée, image existante et six collections par domaine. La bibliothèque réduit son introduction et sépare « Guides & sélection » de « Archives HAL ».

La recherche étendue interroge en direct le catalogue HAL francophone, années 2016–2026 et types ART/THESE/MEM/REPORT/HDR, avec fichier déclaré. Le relevé officiel du 12 septembre à 03:47 UTC a renvoyé **219 476 dépôts** (`numFoundExact: true`). La requête et son interprétation sont versionnées dans `content/hal-coverage.json`. Ce nombre représente le catalogue du fournisseur ; il ne signifie pas que Soutenance Pro héberge, a importé ou a relu 219 476 fichiers, ni que toutes les publications sont distinctes.

Les recherches renvoient au maximum 24 notices validées par réponse. Les utilisateurs peuvent préciser mots-clés, discipline, type et année. La pagination est limitée aux 2 400 premiers résultats de chaque requête ; l’interface explique comment affiner. Les liens d’origine et de fichier restent chez HAL ; RIS/BibTeX sont produits localement à partir des métadonnées. Les 1 000 notices de la sélection locale et leurs liens statiques restent disponibles si le service externe ne répond pas.

Le service ne charge pas tout le corpus dans le navigateur, ne télécharge aucun PDF, n’appelle aucun modèle et n’ajoute pas de service payant. Le fournisseur est fixe, les termes de recherche sont échappés, les URLs sont validées, les réponses et délais sont bornés et les erreurs publiques n’exposent pas les erreurs du fournisseur. Les réponses réussies sont mises en cache pendant cinq minutes côté CDN. Comme tout endpoint public Vercel, son trafic reste soumis au forfait d’hébergement existant.

Le nombre de pages du site et le sitemap restent inchangés : cette recherche étendue ne crée pas des milliers de pages SEO issues de métadonnées dupliquées. Deux appels réels ont vérifié le chemin de recherche : catalogue général (219 476 dépôts, 24 notices) et éducation/articles/2024 (207 dépôts, 24 notices). La vérification graphique dans un navigateur reste indisponible.

## Livrable

- Logo fourni par le propriétaire intégré à l’accueil, aux pages publiques et à l’authentification. Nom public : Soutenance Pro.
- Illustration de bibliothèque créée pour le site, optimisée en WebP (environ 130 Ko), avec l’original conservé séparément. Elle ne représente pas une institution partenaire.
- Contact WhatsApp : +212 680 241 471. Instagram : soutenancepro.co.
- 1 000 notices distinctes d’articles, mémoires, thèses, rapports et habilitations issus de HAL ; 50 notices dans chacune des 20 disciplines. Déduplication des identifiants, DOI et paires titre/auteurs. Les champs bibliographiques sont disponibles sur chaque notice.
- Les 1 000 fichiers restent hébergés dans leurs dépôts d’origine. La bibliothèque ne prétend pas posséder 1 000 PDF ni avoir évalué leur contenu scientifique. L’API HAL déclarait un fichier pour chaque notice lors de la collecte.
- 40 guides et parcours, dont 28 nouvelles méthodes pour les lectures, la bibliographie, les entretiens, les données, le doctorat et l’encadrement. Les exercices inventés sont signalés.
- Recherche locale sur 1 043 ressources : documents, guides/parcours et trois modèles Word. Filtres discipline, format, type et année ; tri et pagination. Sélection locale sur l’appareil.
- Catalogue paginé et liens de documents accessibles sans JavaScript. En cas d’échec du chargement du moteur, les liens du catalogue et les guides restent disponibles.
- Exports de métadonnées RIS et BibTeX pour les 1 000 notices. Ils ne contiennent pas les PDF.
- Quatre outils gratuits : préparation de références, calendrier de mémoire exportable en CSV, comptage de texte et grille de relecture des citations. Traitement dans le navigateur, sans appel à un modèle.
- Annuaire de Google Scholar, HAL, PubMed, theses.fr, Zotero et PRISMA. Les recherches ouvrent le service choisi avec les mots-clés ; aucune intégration ou certification officielle n’est revendiquée.
- Neuf pages de modules, avec entrées attendues, résultat, limites et retour dans le bon module après ouverture d’un projet.
- Tarifs en euros : gratuit / 19 € Essentiel / 29 € Signature. La sélection d’une offre conduit au compte ; elle n’active pas de droits payants sans paiement vérifié.

## Indexation

Le build génère 1 102 pages publiques plus la page 404. Le sitemap Production contient **83 URL indexables** : les guides, collections par discipline, outils, modules et pages principales.

Les 1 000 notices issues des métadonnées et les 19 pages secondaires de pagination sont en `noindex,follow`. Elles servent à la recherche et au parcours de lecture. Les indexer en masse à partir de métadonnées reprises n’est pas la stratégie éditoriale retenue. Une notice pourra devenir une véritable page éditoriale après ajout d’une analyse originale et contrôlée ; aucune réécriture automatique des résumés n’est effectuée.

Toutes les pages Preview sont en `noindex`. Les pages publiques ont des URL canoniques cohérentes, des titres distincts, un H1, des liens internes vérifiés et des données structurées correspondant à leur contenu. RIS, BibTeX, DOCX et API portent un en-tête `noindex`.

Le nombre de pages indexables n’est pas un nombre de pages indexées. Search Console n’est pas connecté, aucun sitemap n’a été soumis et aucune position Google ni audience n’est mesurée ici. Les marchés visés sont France, Maroc, Algérie et Tunisie avec une version francophone commune.

## Paiements et accès

Les limites existantes sont conservées : 3 / 60 / 150 générations par mois civil et 1 / 5 / 20 projets. Le serveur contrôle les droits ; atteindre une limite arrête les nouvelles générations tout en laissant les documents accessibles.

Deux liens Stripe de souscription mensuelle sont attendus du propriétaire, un pour chaque offre. L’automatisation des droits doit associer l’achat à un compte authentifié et vérifier les événements Stripe, les prix autorisés, le mode, le statut d’abonnement et la période payée. Une page de retour, un email saisi ou un paramètre de plan ne constituent jamais une preuve de paiement. Les annulations, échecs et renouvellements doivent être traités. Aucune activation payante ni modification du compte Stripe de test tiers n’a été effectuée.

Le contrôle externe de similitudes n’est pas connecté. La grille de relecture ne calcule pas de score et ne produit aucun certificat. Aucun outil de détection fiable ne peut être simulé par un simple prompt.

## Reproduction et données

`node scripts/import-hal.mjs` renouvelle manuellement le catalogue via l’API officielle. L’import écrit le snapshot uniquement après validation des 1 000 notices. Le build utilise le JSON versionné, sans dépendance réseau vers HAL. Les requêtes, la date, la méthode de contrôle et les licences déclarées restent dans ce snapshot. La validation d’une URL de dépôt est distincte de la lecture ou de la disponibilité continue de chaque fichier.

`npm test` vérifie le build, les URL, les filtres, les exportations, les contrôles d’entrée, l’inscription et les limites existantes. Une vérification graphique dans un navigateur et une recette authentifiée sur le domaine publié restent à effectuer avec l’accès approprié.

## Sources

- [API HAL — recherche](https://api.archives-ouvertes.fr/docs/search)
- [Google : contenu utile](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google : navigation à facettes](https://developers.google.com/crawling/docs/faceted-navigation)
- [Stripe : liens de paiement récurrents](https://docs.stripe.com/payment-links/create)
- [Stripe : événements des abonnements](https://docs.stripe.com/billing/subscriptions/webhooks)

Les Ads et AdSense sont laissés de côté conformément à la demande. Aucun budget, identifiant publicitaire ou achat de backlinks n’est ajouté.


## 12 September 2026 — on-site reading and substantive editorial content

The extended archive search is now a route into an on-site reading workspace: title and primary action open a reference panel in the library, preserving search results, filters, pagination and keyboard focus. Full-text HAL links are secondary and open separately. The app does not copy or claim ownership of authors’ PDFs.

A reusable worksheet on extended results and all 1,000 curated document pages records the reader’s question, method, useful passage, page and limits. Notes stay in the browser, are explicitly saved locally and can be exported as text. Blocked or full browser storage leaves editing and export available. These are personal notes, not generated or reviewed summaries of publications.

The library now contains an always-visible original reading section linking PFE, memoir, stage and defense methods. The new complete `/memoire` guide contains a working table, a clearly fictional commented example and sources for reference organization. There are 41 guides/parcours, 1,103 public HTML routes plus the 404, and 84 canonical pages eligible for indexing in a Production build. Metadata-only notices remain noindex; HAL query results are not turned into hundreds of thousands of search landing pages.

Validation: 59 automated tests passed across the suite and the rerun of the catalogue count check after adding the guide. Production/preview metadata and internal-link tests passed. The final output was rebuilt for preview. Browser visual verification remains unperformed because that access is unavailable.

SEO basis: Google recommends useful original information and substantial additional value when drawing on other sources, and warns against scaled unoriginal content produced to manipulate rankings. See https://developers.google.com/search/docs/fundamentals/creating-helpful-content and https://developers.google.com/search/docs/essentials/spam-policies . Neither hosted document count nor a larger sitemap guarantees indexing or ranking.

## 12 septembre 2026 — Extension des parcours et de la bibliothèque

La bibliothèque propose maintenant **45 guides et parcours, huit modèles Word et 1 000 notices sélectionnées**, soit 1 053 entrées recherchables dans le catalogue local. La recherche étendue HAL conserve le périmètre et les limites documentés ci-dessus ; son volume ne correspond pas à un nombre de fichiers hébergés par Soutenance Pro.

Quatre nouveaux parcours apportent des méthodes distinctes pour la France, le Maroc, l'Algérie et la Tunisie. Ils expliquent les fonctions et limites de DUMAS, theses.fr, Sudoc, Toubkal, HCP, PRSM, PNST, ASJP, SNDL, BIRUNI et CNUDST, avec sources institutionnelles et exemples explicitement fictifs. Ils ne prétendent pas imposer un format national universel ni couvrir toutes les écoles. Les liens vers l'annuaire ouvrent le pays choisi ; les établissements renvoient au parcours correspondant.

Le répertoire `/guides` rend les 45 parcours accessibles par sept familles. La bibliothèque expose les parcours par pays et conserve les modèles Word à l'écran, même après activation de la recherche ou passage aux archives. Les filtres d'année et de type de publication s'appliquent aux documents de recherche : ils ne font plus disparaître les modèles ou les guides. Les guides de santé sont également trouvables avec les disciplines Médecine et Santé publique.

Les cinq nouveaux documents modifiables sont une fiche de cadrage du mémoire, une matrice de revue de littérature, un journal de stage, un suivi des corrections de l'encadrant et un plan de présentation de soutenance. Ils complètent le plan de rapport de stage, la checklist de soutenance et la fiche de lecture. Chaque fichier comprend le logo fourni et des champs, tableaux ou listes réellement éditables. Les huit fichiers ont été rendus et leurs 22 pages inspectées : pas de texte coupé, de tableaux cassés, de glyphes manquants ni de pages blanches ajoutées.

Enregistrer une fiche de lecture ajoute sa référence à « Mes lectures sur cet appareil », limitée aux 100 dernières références. La réouverture fonctionne depuis le panneau et un lien local de bibliothèque, sans retrouver le résultat dans HAL. Le retrait d'une référence de la liste conserve ses notes. L'index contient uniquement des métadonnées validées ; les notes ne quittent pas le navigateur et un stockage bloqué ou plein laisse la fiche exportable.

Le build produit **1 107 routes HTML publiques et une page 404**. Le sitemap Production prévoit **88 URL indexables** ; les 1 000 notices de métadonnées et les pages secondaires de pagination restent en `noindex,follow`. Le dernier build local est un Preview : toutes les pages portent `noindex` et son sitemap est vide. Aucun rang Google, trafic, indexation effective ou statut de « plus grande bibliothèque » n'est revendiqué.

Validation : **64 tests automatisés réussis**, couvrant notamment les liens internes, canoniques et règles d'indexation Production/Preview, les filtres et liens de pays, le stockage des lectures, les exports et la structure des huit fichiers Word. Les contrôles existants d'inscription, d'isolation des comptes et de quotas passent également. La vérification graphique du site dans un navigateur et la recette authentifiée sur le domaine de production restent à effectuer avec l'accès approprié. La mise en ligne de cette révision, les paiements et Search Console doivent être vérifiés séparément ; ce document n'atteste pas leur activation.

Contact public ajouté à la demande du propriétaire : `contact@soutenancepro.com`, accessible depuis le pied de page de l’accueil, les pages publiques, l’authentification et la méthode éditoriale, pour les questions, collaborations et corrections. Les liens `mailto:` ouvrent la messagerie de la personne ; ils ne configurent pas le SMTP ni l’expéditeur des emails transactionnels.


## 12 septembre 2026 — Recherche internationale dans tout HAL

Le périmètre par défaut du moteur couvre désormais **tous les dépôts HAL déclarant un fichier**, sans filtre caché de langue, de période ou de type. Le rapport d’activité 2025 du CCSD dénombre **1 594 705 documents en texte intégral au 5 février 2026** (page imprimée 13 / page PDF 7). Ce chiffre officiel daté justifie la mention « Plus d’un million de documents dans HAL ». Il ne décrit pas le catalogue local de 1 000 références sélectionnées ni des documents hébergés ou scientifiquement vérifiés par Soutenance Pro. Il ne garantit pas un million de publications distinctes.

Source primaire : https://www.ccsd.cnrs.fr/wp-content/uploads/2026/03/RA2025_FR_VF.pdf . La page https://www.ccsd.cnrs.fr/hal/ confirme également un fonds supérieur à un million de documents scientifiques en libre accès. Le relevé précédent de 219 476 dépôts francophones récents est conservé comme historique dans `content/hal-coverage.json`, séparément du total global rapporté par le CCSD.

L’utilisateur peut choisir toutes les langues, le français, l’anglais ou l’arabe ; toutes les périodes ou 2016–2026 ; une année précise ; un type de publication. Les communications, chapitres, ouvrages, prépublications, cours et posters complètent les types déjà proposés. Les autres catégories transmises par HAL s’affichent comme « Autre document », avec le code d’origine conservé dans les métadonnées. La recherche avec mots-clés trie d’abord par pertinence ; sans mots-clés, elle trie par date de dépôt pour éviter qu’une année future mal renseignée occupe la première page.

La recherche de l’accueil ouvre ce moteur international. Les raccourcis de méthode restent accessibles et la sélection locale conserve son périmètre francophone récent. Les fiches enregistrées gardent les langues déclarées et les années anciennes ; les anciennes notes sans information de langue ne sont pas étiquetées automatiquement en français.

Le total affiché après une recherche vient de HAL. Les résultats restent bornés à 24 par page et 100 pages par requête. Un titre, des auteurs, une année exploitable entre 1000 et 2026, des types valides et des liens de dépôt HTTPS autorisés sont requis pour afficher une notice ; les données invalides peuvent être omises. Aucun corpus d’un million de fichiers n’est téléchargé, aucun million de pages SEO n’est créé et aucun service payant n’est ajouté.

Validation : 72 tests automatisés réussis ; les 10 tests HAL ont aussi été relancés après la correction du tri sans mots-clés. Les nouvelles requêtes de comptage de l’API n’ont pas pu être exécutées dans cette session : l’outil web les a refusées comme non sûres et elles n’ont pas été relancées par un autre transport. Le chiffre publié reste donc explicitement celui du rapport officiel, pas une mesure effectuée aujourd’hui. Une vérification réelle de bout en bout de cette extension reste à effectuer avec un accès autorisé. Les nombres de pages et la stratégie d’indexation ne changent pas.


## 12 septembre 2026 — De la découverte à l’espace de travail

L’objectif commercial du propriétaire est explicité dans le parcours : la bibliothèque reste gratuite et sert à découvrir le service ; la page d’accueil présente d’abord le résultat académique et la création d’un projet. Le bouton principal ouvre l’inscription existante. La recherche HAL et les raccourcis de méthode restent accessibles juste après l’introduction.

Les guides, le catalogue et les espaces de lecture proposent une étape vers le projet personnel et la comparaison des offres. Depuis une fiche de lecture, ces liens ouvrent un nouvel onglet pour conserver les notes en cours dans l’onglet original. Aucun paywall n’est ajouté aux sources, aucune note n’est transférée automatiquement vers un compte et aucune lecture n’est interrompue par une fenêtre de vente. Les prix, quotas et conditions de paiement existants sont conservés. Il s’agit d’une amélioration de la hiérarchie et des points d’entrée ; aucune hausse de conversion ou de revenus n’a encore été mesurée.


## 12 septembre 2026 — Interface produit et mouvement discret

La refonte visuelle donne à l’accueil et à la bibliothèque une hiérarchie plus nette : titres sans empattement, introduction émeraude, aperçu de parcours explicitement illustratif, surfaces arrondies, recherche structurée, navigation avec icônes et boutons confortables. Les fiches, guides et pages de lecture partagent cette présentation. Les sélecteurs, ancres et comportements de recherche et d’inscription sont conservés.

La question de FAQ « L’assistant garantit-il un texte sans plagiat ? » est retirée à la demande du propriétaire. Aucun engagement « sans IA », « zéro plagiat » ou certificat non vérifié ne la remplace. L’information sur l’enregistrement des projets et la transmission des éléments nécessaires à la génération reste accessible.

Les entrées au défilement et l’ouverture de la FAQ utilisent une amélioration progressive légère, sans dépendance ni requête réseau supplémentaire. Le contenu reste visible si JavaScript ou les animations sont indisponibles. Les animations sont courtes, sans boucle permanente, et respectent la préférence de réduction des mouvements, y compris son changement pendant la consultation. Les prix et quotas ne sont pas modifiés ; Essentiel et Signature restent à 19 € et 29 € par mois, en attente d’activation du paiement.

Validation de cette refonte : les 72 contrôles existants sont validés, en combinant la suite et la relance des deux tests SEO après une interruption transitoire de nettoyage du dossier de build (`ENOTEMPTY`). Les trois nouvelles feuilles de style sont analysées par esbuild sans avertissement ; le module de mouvement passe le contrôle de syntaxe. Les parcours d’inscription, les liens internes et les règles d’indexation restent couverts. La vérification graphique et des animations dans un navigateur n’a pas été effectuée, cet accès étant indisponible dans cette session.


## Liens Stripe directs — 12 septembre 2026

Le propriétaire a confirmé Essentiel (19 €/mois) sur `https://buy.stripe.com/4gM00k6ssetLeGr4TzbII0d` et Signature (29 €/mois) sur `https://buy.stripe.com/aFa9AU9EE3P741NbhXbII0c`, puis demandé leur ajout direct. Ces destinations remplacent les liens d’attente sur l’accueil, `/tarifs` et les offres de l’espace connecté. Les paiements s’ouvrent dans un autre onglet pour conserver le travail en cours. L’essai gratuit garde son parcours actuel.

Le parcours affiché demande au client de contacter WhatsApp après paiement pour une activation après vérification. Aucun webhook, rapprochement automatique ni mise à jour des droits depuis un retour de paiement n’est ajouté. L’administrateur doit vérifier l’achat, les renouvellements et les annulations dans Stripe avant d’ajuster `student_accounts`. Les quotas et les contrôles serveur existants sont conservés. Les prix et l’association des liens sont confirmés par le propriétaire, sans vérification de la configuration du compte Stripe distant dans cette session.

Validation de cette modification : les cinq tests existants du parcours de quota passent, dont l’arrêt après la troisième génération et l’absence de changement de droits à l’affichage des offres. La compilation Preview réussit. Les deux liens exacts, leur ordre Essentiel/Signature, l’ouverture protégée dans un nouvel onglet et le texte d’activation sont vérifiés dans les pages HTML générées. Aucun paiement de test ou réel n’a été effectué.

## 12 septembre 2026 — Paiement vérifié, références et documents

Cette révision remplace le parcours public direct par le choix d’offre suivi de l’authentification. Une configuration Stripe complète active une session Checkout créée côté serveur pour le compte connecté. Le retour et le webhook vérifient le paiement avant d’attribuer Essentiel (60 générations / 5 projets) ou Signature (150 / 20). Le quota suit la période de la facture payée ; les comptes gratuits et anciens comptes manuels gardent le mois civil. Les liens Live fournis restent le repli avec activation manuelle expliquée lorsque le serveur indique que l’automatisation est indisponible.

La migration `student_billing` a été appliquée au projet Supabase existant. La nouvelle colonne de période est présente ; les trois tables de paiement ont RLS activé et les droits de table et RPC sont réservés au serveur. La connexion Stripe disponible reste un environnement de test distinct : aucun produit Live, webhook distant, variable Vercel ou paiement n’a été modifié. La configuration restante et les limites sont décrites dans [billing-setup.md](billing-setup.md).

Le plan généré conserve désormais des titres et sous-titres distincts dans l’aperçu et les exports. La normalisation répare les anciennes séries de sous-sections regroupées sans découper les nombres décimaux, DOI ou paragraphes ordinaires. Le module Bibliographie recherche des références selon le sujet enregistré si aucune source valide n’est sélectionnée : Crossref, puis catalogue HAL local si nécessaire. Les métadonnées sont enregistrées avant leur mise en forme ; une recherche vide ne dépense aucune génération. Les sources et extraits déjà choisis sont conservés. La rédaction reste fondée sur les extraits réellement fournis.

Validation : la suite complète de 129 tests a réussi, notamment les builds Production/Preview, la recherche sur fixtures, la conservation des documents pendant le retour de paiement, les signatures Stripe et les quotas PostgreSQL. La recette avec paiement réel et la vérification visuelle dans un navigateur n’ont pas été exécutées. Cette révision prépare l’automatisation ; elle ne confirme pas son activation Live ni une publication sur le domaine de production.

## 12 septembre 2026 — Accès temporaire par lien privé

À la demande explicite du propriétaire, un parcours distinct permet d’accorder une offre depuis un long lien aléatoire sans vérification Stripe. Il affiche une page de remerciement après activation du compte connecté. Il s’agit d’un accès accordé par le propriétaire, pas d’une confirmation de paiement. Le partage du lien peut donner accès à une personne qui n’a pas payé.

Chaque compte reçoit une seule période de 30 jours par campagne, 60 ou 150 générations et 5 ou 20 projets. Le compteur et l’échéance ne sont pas remis à zéro par un nouveau clic. Les liens de lancement sont limités à 100 comptes par offre et à 30 jours pour leur utilisation initiale. Les abonnements existants sont protégés et aucun renouvellement Stripe n’est simulé. Le code et les migrations ne contiennent aucun jeton réel ; les tables conservent des empreintes SHA-256.

La migration et les deux liens de lancement ont été préparés dans Supabase. Les 146 tests et le build Preview réussissent. Les droits serveur, le refus d’un jeton invalide et l’absence d’accès des rôles navigateur ont été vérifiés. Aucun vrai compte n’a été activé pour un test. Les retours Stripe doivent être configurés séparément sur une origine publiée ; voir [temporary-access-links.md](temporary-access-links.md).
