# Informations de confidentialité : vérification du propriétaire

Le rendu `scripts/privacy.mjs` décrit les traitements observables dans le dépôt au 13 septembre 2026. Il ne constitue ni une validation juridique ni une attestation de conformité. Il n’ajoute aucun outil de mesure, publicité, service de consentement ou envoi de données.

## Éléments établis dans le code

- `src/contact.js` : contact public `contact@soutenancepro.com`, liens externes WhatsApp et Instagram.
- `src/auth.js`, `server/signup.js`, `src/app.js` : inscription avec email et mot de passe, authentification Supabase, création et modification des projets et documents. La limitation d’inscriptions utilise des empreintes HMAC de l’IP et de l’email.
- `supabase/migrations/001_platform.sql` : comptes, projets, documents, journal des générations, contrôles d’accès par utilisateur. La page ne promet ni une isolation absolue ni un accès impossible aux opérateurs autorisés.
- `shared/modules.js`, `api/chat.js` : contexte structuré, plan, sources/extraits et saisies du module transmis à Anthropic. Le nom du propriétaire et celui de l’encadrant ne sont pas explicitement insérés dans ce contexte, mais peuvent figurer dans les textes fournis ; la page n’affirme pas leur anonymisation automatique.
- `api/references.js`, `api/chat.js`, `api/library-search.js`, `server/hal-search.js` : mots-clés vers Crossref et HAL. Une découverte automatique utilise le titre du projet.
- `src/library-notes.js`, `src/catalogue.js`, `src/extended-catalogue.js` : notes et références sélectionnées dans le stockage du navigateur ; pas de synchronisation serveur par cette fonction. Le retrait d’une lecture de la liste ne supprime pas nécessairement son corps de notes : ne pas promettre cette suppression.
- `src/app.js`, `server/billing.js` : liens Stripe externes et parcours de facturation configurable. La page ne prétend pas que le parcours d’abonnement complet est actif en production.
- `vercel.json` et les API : hébergement Vercel. Le code ne permet pas de déterminer les durées réelles des journaux de la plateforme ni leur région.

## Informations du propriétaire à compléter ou confirmer

1. Identité et adresse de l’entité/personne responsable du traitement, coordonnées légales à publier et éventuel représentant/DPO si applicable. Ne pas déduire une société, un statut ou une adresse des anciennes conversations.
2. Confirmation que l’adresse de contact publique est opérationnelle et procédure de réponse aux demandes d’accès, correction, export et suppression. Aucun bouton de suppression globale de compte n’a été établi dans l’interface actuelle.
3. Durées ou critères de conservation documentés pour comptes inactifs, projets, documents, générations, inscriptions, correspondance, logs, sauvegardes et facturation ; procédure d’effacement et exceptions réellement applicables. Ne pas promettre des délais ou une suppression immédiate de toutes les sauvegardes.
4. Régions des services, transferts internationaux éventuels, contrats/finalités et paramètres effectifs de Supabase, Vercel, Anthropic et Stripe. Vérifier les règles Anthropic du contrat utilisé avant toute affirmation concernant l’entraînement ou la rétention des prompts.
5. Bases légales et informations/recours requis selon l’établissement du responsable et les publics concernés. La rédaction publique actuelle n’invente pas cette qualification.
6. Données traitées hors du dépôt : outils éventuels de support, messagerie, statistiques, suivi publicitaire, prestataires et destinataires additionnels.
7. Avant les annonces : identité AdSense réelle, approbation du site, liste effective des partenaires publicitaires, CMP certifiée choisie, message publié et mécanisme opérationnel pour revenir sur le consentement. Adapter le paragraphe prospectif si les annonces sont effectivement activées.

## Intégration

Importer `renderPrivacy` et `privacyPath` dans le build, générer `/confidentialite`, ajouter le lien dans les pieds de page et l’inclure dans le sitemap public. Conserver cette URL accessible sans connexion et sans scripts publicitaires ni script de message de consentement, même lorsque la publicité est activée ailleurs. Les métadonnées JSON-LD et le script local de présentation du gabarit ne sont pas des publicités.

Le paragraphe public prévoit un lien de gestion du consentement **sur les pages où des annonces sont proposées**. Ne pas activer les annonces avant que ce lien et les choix du message fonctionnent. Un simple bouton local non relié à une CMP n’est pas équivalent.

## Sources Google vérifiées

- [Informations à inclure concernant les cookies publicitaires](https://support.google.com/adsense/answer/1348695?hl=en).
- [Exigences CMP pour les éditeurs](https://support.google.com/adsense/answer/13554116?hl=en) : CMP certifiée avec TCF pour les publicités personnalisées EEE, Royaume-Uni, Suisse.
- [URL de politique de confidentialité](https://support.google.com/adsense/answer/10961370?hl=en-GB) : pas de tags publicitaires soumis au consentement ni de tag Funding Choices sur ces pages.
- [Messages et méthode de test](https://support.google.com/adsense/answer/10924669?hl=en) : message publié et code AdSense présent ; test `?fc=alwaysshow&fctype=gdpr` pour prévisualiser le message européen indépendamment de la région.

La page de confidentialité ne garantit pas l’acceptation AdSense. Google examine l’ensemble du site ; les offres et contenus effectifs doivent respecter les règles éditeurs.
