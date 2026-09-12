# Soutenance Pro — bibliothèque et espace académique

Cette version améliore le projet Vercel existant. Le site conserve son identité verte ; son espace de travail utilise une authentification et un stockage Supabase. La version publique dépend du dernier build Production réussi, pas uniquement de la présence du code sur `main`.

## Fonctions implémentées

- Inscription directe par email et mot de passe, connexion, déconnexion et réinitialisation du mot de passe. Les nouveaux comptes créés sur le site n'attendent pas d'email de confirmation.
- Projets persistants, profil étudiant et consignes universitaires.
- Neuf modules, historique des documents, édition avec sauvegarde automatique et avertissement en cas de texte non enregistré.
- Plan explicitement validé et identifié. Modifier ce plan invalide sa validation.
- Bibliographie à partir des sources choisies ou, si aucune référence exploitable n’est sélectionnée, recherche automatique selon le sujet enregistré du projet : Crossref, puis le catalogue HAL local si Crossref est indisponible ou sans résultat pertinent. Les références trouvées sont enregistrées avant leur mise en forme, sans écraser une modification simultanée du projet. Une recherche sans résultat ne consomme pas de génération. Les métadonnées, leur provenance et les champs manquants restent visibles ; aucun extrait consulté n’est inventé. Les dates proposées couvrent les dix dernières années et peuvent être changées.
- Plans avec chapitres et sous-sections sur des lignes distinctes, titres hiérarchisés dans l’aperçu et les exports. Les anciens plans aux sections collées sont normalisés de manière conservatrice ; les paragraphes des autres modules restent inchangés. Fichiers Word et PowerPoint modifiables. Pour le PDF : bouton **Imprimer / PDF**, puis **Enregistrer au format PDF** dans le navigateur.
- Parcours d’abonnement authentifié préparé : Checkout créé côté serveur, rapprochement du paiement avec le compte, retour dans l’espace client, quota par période payée et gestion de l’abonnement. L’activation distante dépend encore de la configuration du compte Stripe Live propriétaire ; voir [la configuration des paiements](docs/billing-setup.md).
- Authentification obligatoire des appels aux données étudiant et à l'IA, modèle et prompts choisis côté serveur, contexte borné, quotas atomiques dans PostgreSQL. L'inscription publique possède sa propre limitation des tentatives. Les échecs de génération traités libèrent leur réservation ; une interruption brutale du serveur peut laisser une réservation à examiner.
- Les scores de plagiat, partenariats et témoignages non vérifiés ont été retirés. Le module Correction est présenté comme une aide à la révision.
- Une bibliothèque francophone avec 45 guides et parcours, huit modèles Word, 1 000 références sélectionnées et une recherche étendue dans tout HAL, avec filtres de langue, période et type. Le chiffre de plus d’un million décrit le fonds HAL officiel, pas des références sélectionnées ou hébergées par Soutenance Pro. Les parcours France, Maroc, Algérie et Tunisie relient les méthodes à des ressources institutionnelles vérifiées. Le catalogue distingue les documents, guides et modèles, avec des filtres adaptés à chaque format.
- Fiches de lecture personnelles et liste des 100 dernières références enregistrées sur cet appareil, réouverture dans la bibliothèque et exports TXT/RIS/BibTeX. Les PDF restent chez leurs éditeurs ou dépôts d'origine ; les notes locales ne sont pas synchronisées avec le compte.
- Parcours spécialisés ISPITS et médecine, répertoire de consignes institutionnelles et outils gratuits de recherche. Les liens de création de compte ouvrent directement l'inscription ; le parcours choisi propose un profil de projet modifiable. Le détail des livrables et limites figure dans `docs/research-library-release.md`.

## Configuration requise avant publication

### 1. Préparer Supabase

Utiliser un nouveau projet Supabase dédié ou un projet existant dont le schéma a été vérifié. Sur un nouveau projet, exécuter dans l’ordre `supabase/migrations/001_platform.sql`, puis `supabase/migrations/002_restrict_student_helpers.sql` via les migrations Supabase ou le SQL Editor. La seconde migration retire les droits RPC hérités des rôles publics sur les fonctions de déclenchement. Ce fichier crée les tables `student_accounts`, `student_projects`, `student_documents` et `student_ai_jobs`, les politiques RLS, comptes gratuits et limites. Les fonctions et déclencheurs utilisent aussi le préfixe `student_`. Ce préfixe évite les conflits avec les 15 tables de gestion déjà présentes dans le projet Supabase, notamment `public.projects`. Il ne supprime aucune table existante et échoue si les noms sont déjà utilisés.

Appliquer ensuite `supabase/signup-limits.sql` via une migration Supabase nommée `student_signup_limits`. Ce script ajoute uniquement la limitation des tentatives d'inscription, réservée au serveur. `/api/signup` crée un nouveau compte avec `email_confirm: true`, puis le navigateur se connecte avec son mot de passe. Aucun lien de confirmation n'est envoyé par ce parcours. Les paramètres Auth globaux du projet partagé restent inchangés. Les comptes existants ne sont ni confirmés ni réinitialisés par cet endpoint ; leur accès exige toujours leur propre mot de passe. L'absence de confirmation n'est pas une preuve de possession de l'adresse email.

Pour la récupération de mot de passe, **Authentication > URL Configuration** doit utiliser `https://soutenancepro.com` comme Site URL et contenir les origines de production et preview autorisées dans Redirect URLs. Ce réglage distant et l'expéditeur SMTP ne sont pas modifiables par les outils Supabase exposés à cette session. Les anciens liens expirés ou dirigés vers localhost restent inutilisables ; le nouveau parcours d'inscription n'en dépend plus. Les réglages SMTP et le nom de l'expéditeur restent nécessaires pour des emails de récupération personnalisés.

### 2. Renseigner Vercel

Ajouter dans **Project Settings > Environment Variables**, séparément pour Preview et Production :

| Variable | Valeur |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clé Anthropic existante du projet |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` par défaut ; configurable côté serveur |
| `AI_DAILY_BUDGET_USD` | `5` par défaut ; budget estimé global par jour UTC |
| `AI_MONTHLY_BUDGET_USD` | `30` par défaut ; budget estimé global par mois UTC |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique / anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role, strictement serveur |

La clé service role et la clé Anthropic ne doivent jamais être copiées dans le code client, GitHub ou une conversation. `/api/config` publie uniquement l'URL et une clé Supabase reconnue comme publique. Il expose `authReady` pour les paramètres des comptes, `ready` pour l'ensemble des paramètres, et les listes `missing` / `invalid` contenant uniquement leurs noms. Une clé privée placée par erreur dans `SUPABASE_ANON_KEY` n'est jamais renvoyée, y compris en Preview. Le contrôle reconnaît les clés publishable/secret modernes et les anciens JWT anon/service_role ; le décodage du type n'authentifie aucun utilisateur et ne vérifie pas une signature. Ces indicateurs contrôlent la présence et le format, pas l'acceptation des clés par les fournisseurs ni les emails. L'inscription et la récupération restent accessibles sur une Preview si seules les clés de génération manquent ; l'API garde ses protections serveur.

Un build **Production** échoue avant de générer les fichiers si les quatre variables requises manquent ou sont mal formées. Le diagnostic contient uniquement les noms à corriger dans Vercel. Ce contrôle de configuration ne transmet aucune clé à un nouveau service et ne remplace pas un essai réel des comptes, de l'IA et des exports. Après modification des variables, relancer un build Production.

Le projet utilise `npm ci`, `npm run build` et le répertoire de sortie `dist`. Les fonctions restent dans `api/`. `vercel.json` contient les réglages de build. Redéployer après modification des variables.

### 3. Vérifier sur une preview

Les tests locaux passent et Vercel a publié une preview de la branche. Le projet Supabase `soutenancpro-ai` a été réactivé le 8 septembre 2026. Les migrations `student_workspace_foundations` et `restrict_student_helpers` ont été appliquées sur le projet actif `bkcncjwuhvwophcfgwdd` ; ne pas les rejouer sur ce projet. Les 15 tables de gestion existantes ont été préservées. Les quatre tables étudiant ont RLS activé ; les privilèges SQL ont été vérifiés dans Supabase. Le 9 septembre, une capture de `/api/config` sur la preview confirme `authReady: true`, `ready: true` et `missing: []`. Cela confirme la présence des quatre paramètres sur ce déploiement, pas la validité des clés, les réglages Production ou le parcours complet.

Correction du parcours d'inscription : les appels à l'action gratuits ouvrent explicitement le formulaire de création de compte ; le formulaire fixe le type de requête envoyé. Une erreur de connexion est effacée au changement d'écran, l'email est conservé et les requêtes simultanées sont bloquées. Les erreurs de confirmation email, d'envoi SMTP, de configuration et de mot de passe sont distinguées. La console ne reçoit que le mode, le code d'erreur et le statut HTTP, jamais les identifiants ni le message brut du fournisseur. Quatre tests exercent les vrais gestionnaires de l'interface avec des doublures DOM/Auth ; aucun email réel n'est envoyé par ces tests. Les URLs Auth et l'inscription réelle restent à vérifier avant publication.

Avant de promouvoir cette version : vérifier l'inscription directe, la connexion, la récupération de mot de passe séparément, la création d'un projet, la génération d'un plan et sa validation, la recherche puis la lecture d'une source, l'enregistrement de son extrait, une rédaction, l'édition, le rechargement du navigateur et les trois exports. Créer un deuxième compte de test et confirmer qu'il ne voit pas le premier projet. Contrôler aussi le parcours sur mobile. Cette vérification ne doit pas utiliser des dossiers clients réels.

### 4. Activer les offres

Un parcours provisoire par lien d’accès a été ajouté à la demande du propriétaire : il accorde 30 jours d’Essentiel ou Signature sans vérifier un paiement. Les jetons sont privés et bornés, avec une seule activation par compte et campagne. Ce parcours ne renouvelle pas les abonnements ; voir [temporary-access-links.md](docs/temporary-access-links.md).

Les tarifs affichés sont Découverte à 0 €, Essentiel à 19 €/mois et Signature à 29 €/mois. Signature est mise en avant avec le badge **Recommandé** ; aucune popularité client non mesurée n’est revendiquée. Les appels à l’action payants de l’accueil et de `/tarifs` ouvrent `/?offre=offre#inscription` ou `/?offre=max#inscription` pour associer l’offre choisie à un compte authentifié.

Dans l’espace client, `GET /api/billing` indique si le paiement automatique est disponible. Lorsqu’il renvoie `ready: true`, le serveur crée une session Stripe Checkout pour le compte connecté et le prix mensuel autorisé. Après le paiement, le retour dans l’espace client déclenche une vérification côté serveur ; le webhook signé assure aussi le rapprochement si le client ferme la page Stripe. Seule une facture et son paiement vérifiés peuvent attribuer la formule et sa période payée. Un simple retour depuis Stripe ou un email ne débloque jamais de générations.

| Offre | Projets | Générations | Période du quota |
| --- | ---: | ---: | --- |
| Découverte (`free`) | 1 | 3 | Mois calendaire UTC |
| Essentiel (`offre`) | 5 | 60 | Période de la facture Stripe payée |
| Signature (`max`) | 20 | 150 | Période de la facture Stripe payée |

Maximum trois réservations de génération par utilisateur et par minute. Les quotas payants du parcours automatique suivent la période de facturation vérifiée, et non le premier jour du mois. Les accès manuels historiques sans début de période enregistré conservent leur compteur par mois calendaire UTC. Les limites sont des réglages de départ à ajuster après mesure des coûts réels ; garder les tarifs affichés et les fonctions SQL synchronisés.

`GET /api/usage` expose uniquement le quota du compte connecté et sa date de remise à zéro. Les générations réservées ou terminées de la période sont comptées ; les tentatives marquées en échec ne le sont pas. À la limite, l’interface bloque les nouvelles générations et présente les offres. Lire, modifier et exporter les documents existants reste possible. Le serveur contrôle toujours le quota, y compris si l’interface affiche un ancien compteur.

Le propriétaire a confirmé le 12 septembre 2026 les liens Live et leur association aux offres :

| Offre | Lien Stripe fourni |
| --- | --- |
| Essentiel · 19 €/mois | https://buy.stripe.com/4gM00k6ssetLeGr4TzbII0d |
| Signature · 29 €/mois | https://buy.stripe.com/aFa9AU9EE3P741NbhXbII0c |

Si le paiement automatique n’est pas configuré, l’espace client conserve ces destinations exactes comme solution de paiement externe, avec activation manuelle après vérification par l’administrateur. Le client peut transmettre l’email de son compte via WhatsApp ; cet email ne constitue pas une preuve de paiement. Les achats réalisés directement avec ces liens ne sont pas rattachés automatiquement au nouveau parcours Checkout authentifié.

Le compte Stripe Live auquel appartiennent ces liens n’est pas connecté à cette session. L’automatisation est préparée dans le code, mais elle n’est pas activée à distance et aucun paiement réel n’a été testé. Appliquer les réglages et la migration décrits dans [docs/billing-setup.md](docs/billing-setup.md), puis vérifier le parcours complet avant d’annoncer l’activation automatique aux clients. Cette documentation ne constate pas un déploiement Production.

### Protection de la consommation IA

Appliquer `supabase/ai-budget.sql` avec le nom de migration `student_ai_budget` avant de déployer le contrôle de budget. Ce script ajoute une table et une fonction réservées au serveur, avec RLS activée, sans modifier les tables existantes de l’ancien espace.

Avant chaque appel au fournisseur, une transaction réserve simultanément un montant estimé dans les budgets quotidien et mensuel. L’estimation prudente compte les octets UTF-8 de la requête et 1 024 tokens de marge en entrée, puis les 4 096 tokens de sortie possibles. Les réservations sont conservées après une erreur ou un délai dépassé ; les tokens connus de la réponse sont enregistrés avant la sauvegarde du document.

Les valeurs initiales sont **5 USD par jour et 30 USD par mois UTC pour tout le projet**, à ajuster après mesure. Preview et Production partagent ce budget lorsqu’elles utilisent le même projet Supabase. Lorsque le budget est épuisé, seule la génération est suspendue : les documents restent accessibles et une offre payante n’est pas présentée comme une solution à cette suspension.

Une configuration invalide, un modèle sans tarif connu ou une erreur de réservation bloque l’appel fournisseur. Les tarifs pris en charge sont ceux de Sonnet 5 et Sonnet 4.6. Ce contrôle porte sur une estimation conservatrice, pas sur le montant exact de la facture Anthropic ; il ne couvre pas d’autres applications utilisant la même clé, les taxes, d’autres services ou des changements de tarifs du fournisseur.

Le moteur proposé pour les trois offres est le même : Claude Sonnet 5, via la clé Anthropic déjà configurée côté serveur. Une valeur explicite de `ANTHROPIC_MODEL` dans Vercel prend toujours priorité sur ce défaut. Le mode de réflexion est désactivé explicitement pour conserver le budget synchrone de 4 096 tokens de sortie et le délai actuel. Les consignes de génération renforcent l’argumentation, l’adaptation au sujet, la fidélité aux extraits et la révision du style. Les tests utilisent une réponse fournisseur simulée : ils ne mesurent pas la qualité rédactionnelle réelle. Valider cette qualité sur des exemples représentatifs avant toute promesse commerciale.

Références fournisseur consultées le 11 septembre 2026 : [Claude Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) et [guide de migration](https://platform.claude.com/docs/en/models/sonnet-5/migration-guide). Au tarif de 2 $ par million de tokens entrants et 10 $ par million sortants, une action de 10 000 tokens entrants et 3 000 sortants coûte environ 0,05 $ ; 60 actions coûtent 3 $ et 150 coûtent 7,50 $. Ce scénario exclut relances, recherche, hébergement, paiement et support ; ce n’est pas une mesure des usages réels ni une garantie de marge.

Les droits payants et leur période sont écrits par le serveur après vérification Stripe, ou par l’administrateur pour les accès manuels. L’utilisateur ne peut pas modifier sa formule dans `student_accounts`. Un abonnement arrivé au terme de sa période payée retrouve les limites gratuites, sans suppression des documents. Le budget global du fournisseur reste applicable à toutes les formules ; ses limites sont distinctes du quota de générations de chaque compte.

### 5. Raccorder le domaine Hostinger

Le propriétaire a confirmé le domaine **soutenancepro.com**, acheté chez Hostinger. L'origine publique retenue est **https://soutenancepro.com**.

1. Dans **Vercel > soutenance-pro1 > Settings > Domains**, ajouter `soutenancepro.com` et `www.soutenancepro.com`. Associer le premier à la production et configurer une redirection permanente de `www.soutenancepro.com` vers `soutenancepro.com`.
2. Reporter chez le gestionnaire DNS autoritatif les enregistrements exacts affichés par Vercel : généralement A pour `@` et CNAME pour `www`. Utiliser les valeurs propres au projet, sans recopier une adresse générique. Chez Hostinger, ouvrir **Domains > DNS** et sélectionner le domaine. Préserver les enregistrements email existants.
3. Attendre la validation des deux domaines et du certificat HTTPS dans Vercel. Si `SITE_URL` existe déjà dans l'environnement Production, lui donner la valeur `https://soutenancepro.com` ; sinon le build utilise cette origine par défaut.
4. Dans **Supabase > Authentication > URL Configuration**, définir Site URL à `https://soutenancepro.com` et ajouter cette origine aux Redirect URLs, en conservant les URLs de preview encore utilisées. Vérifier les liens de récupération depuis ce domaine. L'inscription directe n'utilise pas de lien email.
5. Après vérification du parcours utilisateur et publication de la nouvelle version en production, contrôler `https://soutenancepro.com/robots.txt` et `https://soutenancepro.com/sitemap.xml`, puis vérifier la propriété dans Google Search Console et soumettre le sitemap.

Le propriétaire a associé le domaine principal dans Vercel et remplacé l'enregistrement A Hostinger par la valeur indiquée pour son projet. Sa capture montre le lancement de la génération du certificat et il indique ensuite que le domaine fonctionne. L'accès HTTPS n'a pas encore été vérifié indépendamment depuis cet environnement. L'association de `www`, les URLs Auth et la propriété Search Console restent à vérifier. Le code prévoit une redirection permanente de `www` vers le domaine principal ; elle nécessite d'abord l'association de `www` au projet Vercel.

Les coordonnées de l’exploitant, la politique de confidentialité et les conditions commerciales restent à fournir pour rédiger et publier les pages adaptées à l’activité réelle. Aucune identité légale ou certification n’est inventée dans cette branche.

## Développement et vérifications

```bash
npm ci
npm test
npm run build
```

Les tests exécutent le schéma SQL sur PostgreSQL via PGlite et vérifient les lectures/écritures entre propriétaires, les privilèges, les quotas, l’expiration d’offre, l’accès à l’API et la création de fichiers Office. Les tests vérifient aussi la coexistence avec une table `public.projects` préexistante et les privilèges par défaut propres à Supabase. PGlite ne remplace pas un test de charge ou un contrôle dans Supabase hébergé. Les exports ont été contrôlés comme archives OOXML/XML ; leur mise en page dans chaque application Office et la fenêtre d’impression PDF restent à vérifier avec la preview.

Architecture : `index.html` / `src/` pour l’interface, `shared/modules.js` pour les modules et prompts, `api/` et `server/` pour Vercel, `supabase/migrations/` pour PostgreSQL. Aucun secret n’est inclus. Le dossier `dist` est généré et ne contient que les fichiers publics.

## Référencement naturel

Le build produit **17 pages HTML publiques** : l’accueil, un parcours de lecture `/guides`, la bibliothèque `/bibliotheque`, la page `/methode-editoriale`, le répertoire `/etablissements`, et 12 guides/dossiers. Les entrées générales `/pfe`, `/rapport-de-stage` et `/soutenance` complètent les parcours ISPITS et médecine. Les cinq nouvelles ressources de `content/library-pages.mjs` comportent des explications originales, des exemples explicitement pédagogiques et des sources universitaires ; `content/catalog.mjs` rassemble les ressources.

Le texte et les liens existent dans le HTML initial, sans inscription. La bibliothèque propose une recherche par mots, des thèmes avec recoupements et un filtre de format. Le formulaire de l’accueil ouvre la bibliothèque avec la recherche préremplie ; les filtres suivants restent locaux. Le répertoire des établissements permet de retrouver des consignes publiques en France, au Maroc, en Algérie et en Tunisie, avec leur portée locale et leur source officielle. Les filtres restent locaux au navigateur et ne génèrent aucune URL supplémentaire à indexer. Trois modèles Word éditables sont construits par `scripts/templates.mjs` dans `/modeles/` : plan de rapport de stage, checklist de soutenance et fiche de lecture. Leurs téléchargements sont marqués `noindex` pour privilégier les pages explicatives.

Chaque page possède un titre, une description, une URL canonique, des balises de partage et des données structurées adaptées (`WebSite`, `WebPage`, `Article`, `CollectionPage`, `ItemList`, `BreadcrumbList`). Les dates de modification ne sont ajoutées que lorsqu’elles sont déclarées sur la ressource. Le sitemap contient uniquement les 17 URL HTML publiques, jamais les projets étudiants, les comptes ou les filtres.

Seul un build avec `VERCEL_ENV=production` autorise l’indexation. Les previews et builds locaux ont une balise `noindex,follow` et un sitemap vide. Leur `robots.txt` permet la lecture de cette balise ; `noindex` ne remplace pas le contrôle d’accès. Les routes `/api/` envoient aussi `X-Robots-Tag: noindex`.

`SITE_URL` est facultatif et vaut par défaut `https://soutenancepro.com`. Si une ancienne valeur existe dans Vercel, la remplacer par cette origine HTTPS dans l'environnement Production avant de redéployer. La même origine est utilisée pour canonical, Open Graph, `WebSite` et sitemap. Vérifier le domaine dans Google Search Console et soumettre `/sitemap.xml` après publication en production. Ces changements sont préparés dans la branche de travail ; aucune soumission à Google ni modification DNS n’a été effectuée. Le référencement demande aussi du contenu utile et ne garantit aucun classement.

Les tests construisent réellement les versions Preview et Production et contrôlent l'indexabilité, les 17 URLs du sitemap, les liens internes et leurs ancres, les titres distincts, les données structurées et les ressources de partage. Les builds de test utilisent des clés factices non fonctionnelles ; ils vérifient aussi le refus d'une Production incomplète et l'absence de fuite de clé privée. Ils ne remplacent pas la vérification des réponses HTTP sur Vercel. Pour publier, déclencher un **nouveau build Production** : promouvoir tel quel un artefact Preview conserverait ses balises `noindex`.

Le [plan de lancement SEO](docs/seo-launch.md) précise les intentions de recherche, les limites des mesures disponibles et le suivi du premier mois. Il n'annonce ni volume de recherches inventé ni garantie de première position.

La [feuille de route bibliothèque et revenus](docs/seo-library-plan.md) détaille l’extension France/Maroc/Algérie/Tunisie, les critères éditoriaux et le suivi des trente jours après publication. Aucun accès Search Console, trafic mesuré, compte AdSense ou revenu publicitaire n’est confirmé. Les règles Google sur les services de rédaction académique doivent être examinées pour le service réel : cette bibliothèque ne garantit pas l’admissibilité de l’ensemble du site. Aucun script publicitaire ni identifiant d’éditeur fictif n’est ajouté.

Références : [Guide SEO Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [nom du site](https://developers.google.com/search/docs/appearance/site-names).

## Points relevés dans la configuration existante

Le Security Advisor signale au niveau INFO l’absence volontaire de politiques sur `student_signup_limits` et `student_ai_budget` : ces tables sont réservées au serveur, avec les droits des rôles publics et authentifiés révoqués. Il signale encore les anciennes fonctions `get_user_role` et `user_project_ids` pour leur [search_path non fixé](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) et leurs [droits d’exécution publics](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). Leur usage par les politiques de l’ancien espace doit être examiné avant modification. La [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) est également désactivée. Ces réglages existants restent à traiter avant une ouverture au public.

## Références techniques

- [Variables d’environnement Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [Authentification Supabase](https://supabase.com/docs/guides/auth/passwords)
- [Politiques RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [API Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [Word avec docx](https://docx.js.org/)
- [PowerPoint avec PptxGenJS](https://gitbrent.github.io/PptxGenJS/docs/introduction/)

Le [registre des sources institutionnelles](docs/institution-sources.md) précise les documents officiels utilisés et leurs limites. Les noms des établissements servent à identifier les consignes ; aucun logo ni partenariat non autorisé n’est ajouté.
