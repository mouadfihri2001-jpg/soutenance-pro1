# AdSense : préparation et activation

État au 13 septembre 2026 : intégration préparée, **désactivée**. Aucun identifiant éditeur n’a été fourni, aucun compte AdSense connecté et aucune approbation ou recette publicitaire constatée. Cette configuration ne change ni les offres ni les accès des clients.

## 1. Connecter le vrai compte et demander l’examen

Dans le compte du propriétaire sur [Google AdSense](https://adsense.google.com/start/), ajouter `soutenancepro.com` à **Sites** et compléter les informations demandées par Google. Copier le véritable identifiant `ca-pub-…` depuis le code fourni pour ce site. Cet identifiant est public ; aucun mot de passe Google n’est nécessaire pour modifier le site.

Définir en environnement **Production** :

```dotenv
ADSENSE_MODE=verify
ADSENSE_CLIENT_ID=
```

Remplir la deuxième valeur avec l’identifiant exact du compte, puis faire un nouveau build Production. Le build ajoute la balise `google-adsense-account` à l’accueil et crée `/ads.txt` avec le même numéro éditeur. Il ne charge aucun script publicitaire. Le mode `verify` permet donc la vérification sans activer d’annonces.

Dans AdSense, confirmer la vérification puis demander l’examen du site. Conserver les enregistrements Search Console existants : ils concernent un autre service. Une validation Search Console ne vaut pas approbation AdSense.

## 2. Vérifier l’offre réelle et les informations publiques

Google examine le site entier. Ses règles interdisent notamment les services de rédaction de travaux destinés à tromper autrui. Soutenance Pro comporte des outils de génération académique : sa bibliothèque ne suffit pas à garantir son admissibilité. L’offre doit effectivement servir à comprendre, organiser et réviser son propre travail ; une reformulation marketing ne contourne pas ces règles.

La page `/confidentialite` décrit les traitements identifiés dans le code. Compléter les éléments opérationnels encore inconnus dans `privacy-review.md` avant de présenter cette page comme une politique juridiquement complète. Le guide de méthode expose aussi la provenance des ressources et l’usage éventuel d’assistance à la rédaction.

## 3. Consentement et un seul bloc dans les guides

Après approbation du site :

1. Dans **Confidentialité et messages → Réglementations européennes**, configurer et publier le message de consentement de Google pour ce site. Utiliser `https://soutenancepro.com/confidentialite` comme URL de confidentialité. Prévoir l’accès aux choix et au retrait du consentement. Le public français rend cette configuration pertinente : Google exige une CMP certifiée intégrée au TCF pour les annonces personnalisées dans l’EEE, au Royaume-Uni et en Suisse.
2. Dans **Annonces → Par bloc d’annonces**, créer un bloc **Display responsive**, nommé par exemple « Guides — fin d’article ». Copier son `data-ad-slot`. Garder les **annonces automatiques désactivées** pour le site afin de conserver le placement prévu.
3. Configurer en Production puis reconstruire :

```dotenv
ADSENSE_MODE=ads
ADSENSE_CLIENT_ID=
ADSENSE_GUIDE_SLOT_ID=
```

Les valeurs vides ci-dessus doivent être remplacées par celles du même compte AdSense. Ne pas activer `ads` avant l’approbation et la publication du message Google. L’application n’a aucun accès à l’état du compte : la valeur de configuration n’est pas une preuve d’approbation ou de conformité.

Le script AdSense sert aussi le message européen publié depuis AdSense ; aucune bannière de consentement artisanale ni second script Funding Choices n’est ajouté. Google ajoute automatiquement le lien de retrait du consentement aux pages approuvées qui affichent ce message et contiennent le code AdSense. La page de confidentialité reste sans code d’annonce ni de message. Vérifier le message sur un guide avec `?fc=alwaysshow&fctype=gdpr` après activation, puis tester accepter, refuser et rouvrir les choix, sur mobile et ordinateur. Ne pas cliquer sur ses propres annonces. Si le message ou la gestion du refus ne fonctionne pas, revenir à `verify` et reconstruire.

## Périmètre et contrôles

- Un emplacement « Publicité » en fin d’article sur les **35 guides originaux**, après le contenu et séparé des boutons du service. Les règles et décisions de Google restent applicables à chacun.
- Aucun chargement publicitaire sur l’accueil qui héberge aussi l’inscription, l’espace personnel et les retours de paiement ; aucun sur les tarifs, outils, notices HAL, annuaires, recherche, page de confidentialité ou page 404.
- Ni annonce, ni balise de propriété, ni `ads.txt` dans les builds Preview, même s’ils héritent des variables de Production.
- Sans configuration, aucun appel publicitaire, aucun emplacement vide et aucun faux `ads.txt`.
- Les réglages ne nécessitent aucun nouveau fournisseur IA, aucune génération et aucune dépendance supplémentaire.
- Le serveur sert le fichier `ads.txt` comme texte ; il ne renvoie pas la page de l’application à cette adresse.

Les tests hors ligne vérifient les modes arrêt/vérification/annonces, les identifiants malformés et l’exclusion des pages de compte, catalogue et confidentialité. Ils ne testent ni une diffusion réelle ni la CMP d’un compte Google absent. Après une diffusion réelle, suivre les pages vues et le RPM observé dans AdSense ; ne pas convertir les impressions Search Console en revenu publicitaire.

Pour arrêter les annonces : `ADSENSE_MODE=verify` conserve la vérification ; `ADSENSE_MODE=off` retire également balise et `ads.txt` au build suivant.

## Références Google

- [Connexion et examen du site](https://support.google.com/adsense/answer/7584263?hl=fr)
- [Fichier ads.txt](https://support.google.com/adsense/answer/12171612?hl=fr)
- [Conditions d’admissibilité](https://support.google.com/adsense/answer/9724?hl=fr)
- [Règles pour les éditeurs](https://support.google.com/adsense/answer/10502938?hl=fr)
- [CMP certifiée et réglementation européenne](https://support.google.com/adsense/answer/13554116?hl=fr)
- [Création et test des messages européens](https://support.google.com/adsense/answer/10924669?hl=fr)
- [Informations à fournir sur la confidentialité](https://support.google.com/adsense/answer/1348695?hl=fr)
- [Pages de confidentialité sans code d’annonce](https://support.google.com/adsense/answer/10961370?hl=fr)
- [Lien de retrait du consentement ajouté par AdSense](https://support.google.com/adsense/answer/10959060?hl=fr)
