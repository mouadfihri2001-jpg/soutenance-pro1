# Soutenance Pro — landing page `/accompagnement`

Page autonome, sans framework ni dépendance externe. Un fichier `index.html` + un dossier `assets/`.

## Structure

```
index.html                     page complète (HTML + CSS + JS, configuration en tête du script)
assets/
  fonts/                       polices auto-hébergées (Bricolage Grotesque, Instrument Sans, Cinzel, Almarai pour l’arabe) ~210 Ko
  avis-imane.mp3 …             5 avis audio extraits de la vidéo de compilation fournie
  avis-video.mp4 / -poster.jpg vidéo de compilation des avis (2,3 Mo)
  avis/av-01.jpg … av-14.jpg   14 captures WhatsApp, recadrées, prénoms masqués dans le fichier
  video/ugc1..3.mp4 + .jpg     3 vidéos UGC (présentation du service) + affiches
  video/vocal-01..08.mp4 + .jpg 8 enregistrements d’écran de vocaux reçus (son normalisé, un nom masqué dans vocal-01)
  video/real-01..06.mp4 + .jpg 6 extraits de documents affichés sur la page (barre de titre recadrée, sans son)
  video/extra/real-07..13      7 extraits supplémentaires, prêts, non affichés (à ajouter dans CONFIG.media.works si souhaité)
```

Déploiement prévu : `soutenancepro.com/accompagnement/` avec le dossier `assets/` à côté de `index.html`. Aucune autre page du site n’est touchée. Poids total des médias affichés : ~39 Mo, chargés uniquement au clic (affiches légères seules au chargement).

## Configuration (objet `CONFIG` en tête du `<script>`)

| Clé | Rôle |
|---|---|
| `defaultLang` | `fr` ou `ar`. `?lang=ar` (ou `#ar`) force l’arabe ; le choix du visiteur est mémorisé dans son navigateur |
| `whatsapp.qualify` | `true` = feuille de qualification (niveau, projet, besoin, tous facultatifs) avant l’ouverture de WhatsApp ; `false` = WhatsApp direct |
| `brand.logoSrc` | chemin du logo officiel vectoriel (vide = logo redessiné en SVG d’après le fichier fourni, wordmark en Cinzel) |
| `I18N.fr` / `I18N.ar` | tous les textes de la page, du message WhatsApp et de la feuille de qualification, dans chaque langue |
| `whatsapp.number` | `212680241471` (+212 6 80 24 14 71). Vide = les boutons ne font rien et un avertissement s’affiche en console |
| `whatsapp.message` | message prérempli |
| `whatsapp.includeAdRef` | ajoute « Réf : ugc1 » au message quand `utm_content` est présent |
| `tracking.metaPixelId` | ID du Pixel Meta. **Vide = aucun envoi**, événements affichés en console (`[Pixel démo]`) |
| `tracking.requireConsent` | `false` par défaut (le Pixel part dès que l’ID est renseigné). Passer à `true` si un bandeau de consentement est ajouté, puis appeler `window.spConsent.grant()` après acceptation |
| `media.ugc[]` | 3 vidéos UGC. La première est affichée ; `utm_content=ugc2` ou `ugc3` affiche d’abord la vidéo de la publicité d’origine |
| `media.avisAudio[]` | avis audio : prénom, niveau, fichier, `transcript` (vide = pas de bloc transcription) |
| `media.vocaux[]` | vocaux (vidéos), compilation en premier |
| `media.avisCaptures` | 14 captures (`assets/avis/av-XX.jpg`) |
| `media.works[]` | extraits de réalisations affichés |
| `faq[]` | questions et réponses |

## Parcours WhatsApp

1. Tap sur n’importe quel bouton WhatsApp → feuille de qualification (3 groupes de choix : niveau, projet, besoin ; facultatifs, « Passer » possible).
2. « Envoyer sur WhatsApp » ouvre `wa.me/212680241471` avec un message composé, par exemple :

```
Bonjour, je souhaite avoir des informations concernant l’accompagnement de mon projet.
Niveau : Master
Projet : Mémoire
Besoin : Méthodologie et plan
Réf : ugc1
```

Les réponses sont mémorisées pendant la visite et traduites si la langue change. En arabe, le message est en arabe.

## Langues

- Français par défaut, bouton « عربي » dans l’en-tête. Version arabe complète en arabe standard, sens de lecture inversé, police Almarai.
- URLs possibles pour les publicités en arabe : `…/accompagnement?lang=ar&utm_source=meta&…`
- Les avis restent tels quels (darija), seuls les prénoms et niveaux des avis audio sont traduits.

## Publicités et suivi

URLs des trois publicités :

```
https://soutenancepro.com/accompagnement?utm_source=meta&utm_medium=paid&utm_campaign=accompagnement&utm_content=ugc1
https://soutenancepro.com/accompagnement?utm_source=meta&utm_medium=paid&utm_campaign=accompagnement&utm_content=ugc2
https://soutenancepro.com/accompagnement?utm_source=meta&utm_medium=paid&utm_campaign=accompagnement&utm_content=ugc3
```

- Les UTM sont lus à l’arrivée, conservés en `sessionStorage` pendant la visite et ajoutés aux liens internes du site.
- `utm_content` est ajouté au message WhatsApp (« Réf : ugc1 »). WhatsApp ne transmet pas les UTM ; c’est cette référence dans le message qui identifie la publicité d’origine.
- Événements Pixel préparés : `PageView`, `ViewContent` (`content_name`, `lang`), `Contact` au clic « Envoyer » ou « Passer » de la feuille (paramètres `cta`, `lang`, `qualified`, et les réponses choisies). `Contact` mesure un clic vers WhatsApp, pas une conversation engagée.
- Panneau de test : ouvrir la page avec `#debug` à la fin de l’URL pour voir le numéro, la référence détectée, le message généré et simuler ugc1/2/3.

## Médias

- Captures : recadrage de l’interface (Instagram, barre de saisie) et pixellisation des prénoms directement dans le fichier image.
- Vidéos : affiche légère, chargement du fichier vidéo uniquement au clic, aucun son automatique, un seul lecteur actif à la fois.
- Réalisations : barre de titre (noms de fichiers) supprimée par recadrage, piste audio absente.
