# Publication de la page d’accompagnement

Source : archive fournie `sp-1-site-ugc(1).zip`.

`index.html` est conservé à l’identique de l’archive, avec sa configuration,
ses textes, son design et ses interactions. SHA-256 du fichier source :
`2dfc576b0bc89eabf36198faacf07821dfb9bf981e10b3f2f19ffb9cac0b17ee`.

Le build adapte uniquement les chemins `assets/` vers `/accompagnement/assets/`
pour la route publique `https://soutenancepro.com/accompagnement`, avec la
configuration Vercel existante (`cleanUrls: true`, `trailingSlash: false`).

Les polices, captures et fichiers audio fournis sont inchangés. Les trois MP4
UGC sont stockés intégralement en parties binaires dans `campaign-media/`.
Le build les reconstitue et vérifie leur taille et leur SHA-256, sans réencodage.

L’archive ne contient pas `assets/avis-video.mp4`, les 8 vidéos `vocal-01..08`
avec leurs affiches, ni les 6 vidéos `real-01..06` avec leurs affiches.
Conformément à la demande de publier la version sans modification, leurs
entrées et leurs sections restent présentes. Ces 29 fichiers manquants ne
peuvent pas être lus tant qu’ils ne sont pas ajoutés aux emplacements prévus.

Le numéro WhatsApp est `212680241471`. Le Pixel Meta reste désactivé : son ID
est vide. Les pages, API et paramètres existants du site restent inchangés.
