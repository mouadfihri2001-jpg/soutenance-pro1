# Publication de la page d’accompagnement

Source : archive fournie `sp-1-site-ugc(1).zip`.

Le HTML provient de l’archive fournie. SHA-256 du fichier source original :
`2dfc576b0bc89eabf36198faacf07821dfb9bf981e10b3f2f19ffb9cac0b17ee`.
Les changements de configuration demandés le 25 septembre 2026 sont :
- l’ordre des UGC : `ugc3`, puis `ugc1`, puis `ugc2` ;
- les compteurs globaux de l’activité fournis par le propriétaire :
  300 avis audio, plus de 500 vocaux, 135 978 messages et plus de 69 453 clients ;
- la capture `av-11.jpg` placée en premier dans la galerie de 14 messages ;
- une version anglaise complète, accessible par le sélecteur FR / عربي / EN ;
- le logo original, la typographie Inter et la signature du site principal ;
- une coche bleue à côté du nom, libellée « Site officiel », sans revendication
  de certification par une plateforme tierce.

UGC 3 apparaît en premier dans le bloc principal. Les totaux de l’activité
sont indépendants du nombre d’extraits publiés ; une courte indication
en français, en arabe et en anglais précise cette distinction. Le nombre réel de captures
dans la galerie continue d’être calculé à partir des médias affichés.
Le sélecteur de langue conserve le choix du visiteur et prend aussi en charge
`?lang=en` ou `#en`. Les actions de l’en-tête passent sur une seconde ligne
sur les petits écrans. Les autres paramètres sont conservés.

Le bouton principal des en-têtes du site mène maintenant à `/accompagnement`
avec le libellé « Accompagnement personnalisé » ; le menu mobile contient
aussi ce lien. Le bouton WhatsApp reste fixe dans le site et dans l’espace
de travail, avec un dégagement au-dessus des notifications.

Le build adapte uniquement les chemins `assets/` vers `/accompagnement/assets/`
pour la route publique `https://soutenancepro.com/accompagnement`, avec la
configuration Vercel existante (`cleanUrls: true`, `trailingSlash: false`).

Les polices, captures et fichiers audio fournis sont inchangés. Les trois MP4
UGC sont stockés intégralement en parties binaires dans `campaign-media/`.
Le build les reconstitue et vérifie leur taille et leur SHA-256, sans réencodage.

L’archive initiale omettait 29 fichiers de médias référencés dans la page.
Le 25 septembre 2026, 22 fichiers ont été rétablis depuis les enregistrements
originaux fournis : les 8 vidéos `vocal-01..08` et leurs affiches, ainsi que
`real-01`, `real-05` et `real-06` avec leurs affiches. Les vidéos sont exportées
en MP4 H.264 avec démarrage rapide. Les pistes audio des 8 vocaux sont
conservées sans réencodage. Les pièces jointes nominatives et une photo de
profil ont été retirées du cadre ou masquées. Les extraits de documents sont
muets et recadrés pour retirer les barres de titre.

Les extraits `real-01` et `real-05` correspondent aux documents de 43 et
56 pages. `real-06` provient d’un enregistrement fourni montrant les listes
d’abréviations et de tableaux ; il respecte cette description générique,
sans prétendre être la copie binaire de l’export disparu.

Restent à fournir, faute d’original correspondant disponible :
- `assets/avis-video.mp4` : compilation de 1 min 17 s ;
- `assets/video/real-02.mp4` et `.jpg` : rapport de 54 pages ;
- `assets/video/real-03.mp4` et `.jpg` : mémoire de 161 pages ;
- `assets/video/real-04.mp4` et `.jpg` : tableaux et figures de 94 pages.

Leurs références sont conservées dans le HTML original. Ces 7 fichiers
restants constituent une limite connue : leurs lecteurs ne fonctionnent
pas encore. Aucune vidéo non correspondante n’a été présentée sous ces titres.

Le numéro WhatsApp est `212680241471`. Le Pixel Meta reste désactivé : son ID
est vide. Les pages, API et paramètres existants du site restent inchangés.
