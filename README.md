# Soutenance Pro AI — mise à niveau 0.2

Cette branche améliore le projet Vercel existant. Elle n’a pas été déployée en production. Le site conserve son identité verte et sa page d’accueil ; son espace de travail utilise maintenant une authentification et un stockage Supabase.

## Fonctions implémentées

- Inscription, confirmation email, connexion, déconnexion et réinitialisation du mot de passe.
- Projets persistants, profil étudiant et consignes universitaires.
- Neuf modules, historique des documents, édition avec sauvegarde automatique et avertissement en cas de texte non enregistré.
- Plan explicitement validé et identifié. Modifier ce plan invalide sa validation.
- Recherche bibliographique Crossref, sélection des sources, extraits consultés, puis rédaction. Les métadonnées ne constituent pas une lecture automatique du texte intégral. Les dates proposées couvrent les dix dernières années et peuvent être changées.
- Fichiers Word et PowerPoint modifiables. Pour le PDF : bouton **Imprimer / PDF**, puis **Enregistrer au format PDF** dans le navigateur.
- Authentification obligatoire de chaque appel API, modèle et prompts choisis côté serveur, contexte borné, quotas atomiques dans PostgreSQL. Les échecs traités libèrent leur réservation ; une interruption brutale du serveur peut laisser une réservation à examiner.
- Les scores de plagiat, partenariats et témoignages non vérifiés ont été retirés. Le module Correction est présenté comme une aide à la révision.

## Configuration requise avant publication

### 1. Préparer Supabase

Utiliser un nouveau projet Supabase dédié ou un projet existant dont le schéma a été vérifié. Sur un nouveau projet, exécuter dans l’ordre `supabase/migrations/001_platform.sql`, puis `supabase/migrations/002_restrict_student_helpers.sql` via les migrations Supabase ou le SQL Editor. La seconde migration retire les droits RPC hérités des rôles publics sur les fonctions de déclenchement. Ce fichier crée les tables `student_accounts`, `student_projects`, `student_documents` et `student_ai_jobs`, les politiques RLS, comptes gratuits et limites. Les fonctions et déclencheurs utilisent aussi le préfixe `student_`. Ce préfixe évite les conflits avec les 15 tables de gestion déjà présentes dans le projet Supabase, notamment `public.projects`. Il ne supprime aucune table existante et échoue si les noms sont déjà utilisés.

Dans **Authentication > URL Configuration**, utiliser le domaine du site comme Site URL. Ajouter exactement les URLs de production et de preview utilisées dans Redirect URLs. Garder la confirmation email active et vérifier l’envoi/réception des messages d’authentification avant ouverture au public.

### 2. Renseigner Vercel

Ajouter dans **Project Settings > Environment Variables**, séparément pour Preview et Production :

| Variable | Valeur |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clé Anthropic existante du projet |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` par défaut ; configurable côté serveur |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique / anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role, strictement serveur |

La clé service role et la clé Anthropic ne doivent jamais être copiées dans le code client, GitHub ou une conversation. `/api/config` publie l’URL et la clé publique Supabase, `authReady` pour la présence des deux paramètres nécessaires aux comptes, `ready` pour la présence des quatre paramètres et `missing` pour les noms des paramètres absents (jamais leurs valeurs privées). Ces indicateurs vérifient la présence des paramètres, pas la validité des clés. L’inscription, la connexion et la récupération du mot de passe ne dépendent pas des clés de génération. Si celles-ci manquent, la génération reste indisponible et les contrôles serveur d’authentification et de quota restent appliqués. Après ajout d’un paramètre Vercel, redéployer la preview puis recharger la page.

Le projet utilise `npm ci`, `npm run build` et le répertoire de sortie `dist`. Les fonctions restent dans `api/`. `vercel.json` contient les réglages de build. Redéployer après modification des variables.

### 3. Vérifier sur une preview

Les tests locaux passent et Vercel a publié une preview de la branche. Le projet Supabase `soutenancpro-ai` a été réactivé le 8 septembre 2026. Les migrations `student_workspace_foundations` et `restrict_student_helpers` ont été appliquées sur le projet actif `bkcncjwuhvwophcfgwdd` ; ne pas les rejouer sur ce projet. Les 15 tables de gestion existantes ont été préservées. Les quatre tables étudiant ont RLS activé ; les privilèges SQL ont été vérifiés dans Supabase. Les variables Vercel, les URLs Auth et le parcours complet avec un compte réel restent à configurer et tester.

Avant de promouvoir cette version : vérifier l’inscription et le lien reçu, la connexion, la création d’un projet, la génération d’un plan et sa validation, la recherche puis la lecture d’une source, l’enregistrement de son extrait, une rédaction, l’édition, le rechargement du navigateur et les trois exports. Créer un deuxième compte de test et confirmer qu’il ne voit pas le premier projet. Contrôler aussi le parcours sur mobile. Cette vérification ne doit pas utiliser des dossiers clients réels.

### 4. Activer les offres

Les tarifs affichés restent 0 / 199 / 399 MAD. Les offres payantes sont indiquées **en préparation** : aucun encaissement ou abonnement récurrent n’a été implémenté. Les limites initiales sont :

| Offre | Projets | Générations par mois calendaire UTC |
| --- | ---: | ---: |
| Gratuit | 1 | 3 |
| Offre | 5 | 60 |
| Max | 20 | 150 |

Maximum trois réservations de génération par utilisateur et par minute. Les limites sont des réglages de départ à ajuster après mesure des coûts réels. Les formules d’accès sont appliquées dans les fonctions SQL ; garder l’affichage des tarifs et ces limites synchronisés.

Seul l’administrateur peut attribuer un plan dans la table `student_accounts` et définir `subscription_expires_at`. Un compte dont l’abonnement est expiré retrouve les limites gratuites, sans suppression de ses documents. L’utilisateur ne peut pas modifier sa formule. Ajouter la méthode de paiement choisie et sa validation serveur avant de rendre les offres achetables.

### 5. Raccorder le domaine Hostinger

Le propriétaire a confirmé le domaine **soutenancepro.com**, acheté chez Hostinger. L'origine publique retenue est **https://soutenancepro.com**.

1. Dans **Vercel > soutenance-pro1 > Settings > Domains**, ajouter `soutenancepro.com` et `www.soutenancepro.com`. Associer le premier à la production et configurer une redirection permanente de `www.soutenancepro.com` vers `soutenancepro.com`.
2. Reporter chez le gestionnaire DNS autoritatif les enregistrements exacts affichés par Vercel : généralement A pour `@` et CNAME pour `www`. Utiliser les valeurs propres au projet, sans recopier une adresse générique. Chez Hostinger, ouvrir **Domains > DNS** et sélectionner le domaine. Préserver les enregistrements email existants.
3. Attendre la validation des deux domaines et du certificat HTTPS dans Vercel. Si `SITE_URL` existe déjà dans l'environnement Production, lui donner la valeur `https://soutenancepro.com` ; sinon le build utilise cette origine par défaut.
4. Dans **Supabase > Authentication > URL Configuration**, définir Site URL à `https://soutenancepro.com` et ajouter cette origine aux Redirect URLs, en conservant les URLs de preview encore utilisées. Vérifier les liens de confirmation et de récupération depuis ce domaine.
5. Après vérification du parcours utilisateur et publication de la nouvelle version en production, contrôler `https://soutenancepro.com/robots.txt` et `https://soutenancepro.com/sitemap.xml`, puis vérifier la propriété dans Google Search Console et soumettre le sitemap.

Le code est préparé pour ce domaine. L'association dans Vercel, les changements DNS, le certificat, les URLs Auth et la propriété Search Console ne sont pas encore confirmés. Les modifications DNS n'ont pas été effectuées depuis cette branche.

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

Le build ajoute une description de la page, les balises de partage, une URL canonique, les données structurées `WebSite`, `robots.txt` et `sitemap.xml`. Le sitemap de production référence uniquement l’accueil public existant ; aucun projet étudiant ou écran de compte n’y figure. Les liens de navigation du pied de page sont de vrais liens HTML.

Seul un build avec `VERCEL_ENV=production` autorise l’indexation. Les previews et builds locaux ont une balise `noindex,follow` et un sitemap vide. Leur `robots.txt` permet la lecture de cette balise ; `noindex` ne remplace pas le contrôle d’accès. Les routes `/api/` envoient aussi `X-Robots-Tag: noindex`.

`SITE_URL` est facultatif et vaut par défaut `https://soutenancepro.com`. Si une ancienne valeur existe dans Vercel, la remplacer par cette origine HTTPS dans l'environnement Production avant de redéployer. La même origine est utilisée pour canonical, Open Graph, `WebSite` et sitemap. Vérifier le domaine dans Google Search Console et soumettre `/sitemap.xml` après publication en production. Ces changements sont préparés dans la branche de travail ; aucune soumission à Google ni modification DNS n’a été effectuée. Le référencement demande aussi du contenu utile et ne garantit aucun classement.

Références : [Guide SEO Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [nom du site](https://developers.google.com/search/docs/appearance/site-names).

## Points relevés dans la configuration existante

Le Security Advisor ne signale plus les objets `student_`. Il signale encore les anciennes fonctions `get_user_role` et `user_project_ids` pour leur [search_path non fixé](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) et leurs [droits d’exécution publics](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). Leur usage par les politiques de l’ancien espace doit être examiné avant modification. La [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) est également désactivée. Ces réglages existants restent à traiter avant une ouverture au public.

## Références techniques

- [Variables d’environnement Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [Authentification Supabase](https://supabase.com/docs/guides/auth/passwords)
- [Politiques RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [API Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [Word avec docx](https://docx.js.org/)
- [PowerPoint avec PptxGenJS](https://gitbrent.github.io/PptxGenJS/docs/introduction/)
