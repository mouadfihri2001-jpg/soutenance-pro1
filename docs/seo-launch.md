# Lancement SEO — Soutenance Pro AI

Origine retenue : https://soutenancepro.com. Cible initiale : étudiants francophones au Maroc, particulièrement ISPITS, médecine et filières de santé.

## Pages et intentions

Les expressions ci-dessous sont des cibles éditoriales. Aucun outil de volume de recherche ou de difficulté SEO n'a fourni de mesures pour ces expressions pendant cette intervention. Elles ne constituent pas une estimation chiffrée de demande.

| Page | Intention principale | Prochaine action proposée |
| --- | --- | --- |
| `/` | Assistant PFE, mémoire et soutenance | Choisir son parcours |
| `/pfe-ispits` | PFE ISPITS au Maroc, plan PFE ISPITS | Créer son projet PFE |
| `/these-medecine` | Méthode de thèse de médecine au Maroc | Créer son projet de thèse |
| `/guides` | Guides de méthode pour les travaux en santé | Trouver une étape |
| `/guides/problematique-pfe-infirmier` | Problématique PFE infirmier, exemple commenté | Délimiter sa question |
| `/guides/questionnaire-recherche-sante` | Questionnaire PFE santé, construction et prétest | Préparer un outil cohérent |
| `/guides/recherche-bibliographique-sante` | Recherche bibliographique en santé | Préparer sa requête et ses sources |
| `/guides/analyse-spss-pfe-sante` | Analyse SPSS PFE santé | Structurer ses données et lire ses sorties |
| `/guides/presentation-soutenance-pfe` | Présentation PowerPoint de soutenance PFE | Organiser ses diapositives |

Le contenu décrit les fonctions présentes : recherche Crossref, travail à partir d'extraits consultés, documents modifiables, exports Word et PowerPoint. PubMed est une ressource externe. L'assistant ne lance pas SPSS, ne produit pas de fichier `.sav`/`.spv` et ne fournit pas d'avis clinique. Aucun partenariat avec un institut ou une faculté n'est revendiqué.

## Avant la mise en production

1. Vérifier les variables Production dans Vercel, distinctes des variables Preview : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. L'origine `SITE_URL`, si elle est définie, doit être `https://soutenancepro.com`.
2. Vérifier Site URL et Redirect URLs dans Supabase pour le domaine public. Tester une inscription, la réception de l'email, la confirmation, la connexion et la récupération du mot de passe. La présence de `ready: true` ne suffit pas à prouver ces parcours.
3. Vérifier un projet, un plan validé, une source consultée, une rédaction enregistrée, le rechargement et les exports. Utiliser du contenu de démonstration sans dossier médical identifiable.
4. Publier par un nouveau build Production. Un artefact construit en Preview contient volontairement `noindex`.
5. Vérifier que les neuf URLs répondent en HTTP 200, qu'une URL inexistante répond en 404, que les pages publiques ont `index,follow` et le bon canonical, et que le sitemap est accessible. Vérifier mobile, liens et formulaire.
6. Ajouter `www.soutenancepro.com` au projet Vercel si ce n'est pas fait, suivre ses valeurs DNS et vérifier sa redirection permanente vers le domaine principal.

## Le premier mois

| Période | Action | Mesure utile |
| --- | --- | --- |
| Semaine 1 | Finir les vérifications ci-dessus ; ajouter une propriété Domaine à Google Search Console ; publier son TXT de vérification chez Hostinger ; soumettre `https://soutenancepro.com/sitemap.xml` | Domaine vérifié, sitemap lu, absence de blocage d'indexation |
| Semaine 2 | Contrôler l'inspection d'URL pour l'accueil, ISPITS et médecine ; corriger les erreurs signalées ; faire relire les guides par un encadrant si possible | Pages découvertes/indexées ; erreurs de parcours signalées |
| Semaine 3 | Examiner les requêtes et pages ayant des impressions ; préciser les passages qui répondent mal aux questions observées | Impressions, clics et CTR, filtre pays Maroc et pages santé |
| Semaine 4 | Comparer les semaines, améliorer les pages déjà visibles et les liens entre guides ; recueillir les retours de vrais utilisateurs | Tendances par requête/page ; inscriptions et premiers projets si leur source est mesurée |

Google Search Console est nécessaire pour connaître la visibilité réelle. Les clics de recherche ne prouvent pas à eux seuls les inscriptions : une mesure de conversion et de source adaptée reste à configurer. Aucun outil de suivi, cookie analytique ou collecte d'événements supplémentaire n'a été ajouté dans cette version.

Le premier objectif est un site utilisable et correctement accessible à Google, puis des impressions sur des recherches précises. La première place ce mois-ci n'est pas une promesse possible. La prise en compte des changements peut demander des semaines ou des mois ; un sitemap ne garantit pas l'indexation.

La vérification Search Console demande une valeur TXT générée par le compte propriétaire. Aucune valeur n'a été inventée et aucun sitemap n'a encore été soumis depuis cette intervention. Aucun achat de publicité, de backlink ou d'abonnement payant n'a été effectué.

## Références officielles

- [Guide SEO de Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Créer du contenu utile](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Documentation de recherche PubMed](https://pubmed.ncbi.nlm.nih.gov/help/)
