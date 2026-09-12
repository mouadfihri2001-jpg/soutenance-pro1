# Soutenance Pro — bibliothèque académique

Version préparée le 11 septembre 2026. Publication sur le domaine de production et paiements non confirmés par ce document.

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
