# Publication de la page d’accompagnement

Source : archive fournie `sp-1-site-ugc.zip`.

Le build copie la page vers `dist/accompagnement.html` et les médias vers
`dist/accompagnement/assets/`. Les URL des médias sont absolues à partir de
`/accompagnement/assets/`, pour fonctionner avec `trailingSlash: false`.
La page publique est `https://soutenancepro.com/accompagnement`.

Médias inclus : 3 vidéos UGC avec leurs affiches, 14 captures d’avis,
5 avis audio et les polices locales.

Les trois MP4 sont stockés intégralement en parties binaires dans `campaign-media/`
pour éviter les limites de taille des transferts du connecteur. Le build les
reconstitue, vérifie leur taille et leur SHA-256, puis publie les MP4 complets
aux chemins habituels. Aucun réencodage ni changement de qualité n’est appliqué.

L’archive ne contient pas `assets/avis-video.mp4`, les 8 vidéos `vocal-01..08`
avec leurs affiches, ni les 6 vidéos `real-01..06` avec leurs affiches.
Leurs entrées CONFIG portent `available: false`. Les groupes vides sont masqués
pour ne pas afficher de lecteurs cassés. Pour les activer, ajouter les fichiers
correspondants puis retirer `available: false` de chaque entrée concernée.

Le numéro configuré est `212680241471`. Le Pixel Meta reste désactivé : son ID
est vide. Le mécanisme de consentement et les événements sont ceux de l’archive.

Les pages et fonctions existantes ne sont pas remplacées.
