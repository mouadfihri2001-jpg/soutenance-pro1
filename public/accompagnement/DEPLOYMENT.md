# Publication de la page d’accompagnement

La page publique est accessible sur `/accompagnement`. Elle utilise le contenu
de l’archive initiale `sp-1-site-ugc(1).zip` et les enregistrements fournis dans
`WhatsApp Unknown 2026-09-25 at 22.54.44.zip`.

## Identité et navigation

L’identité de Soutenance Pro, son logo, la typographie Inter et le badge
« Site officiel » sont conservés dans les trois langues FR / عربي / EN.
Le badge décrit le site officiel de l’activité, sans revendiquer une
certification par une plateforme tierce.

Les liens d’accompagnement des en-têtes et le nouvel appel à l’action sur
l’accueil mobile mènent à `/accompagnement`. La page d’accompagnement propose
aussi un bouton vers la plateforme. Le numéro WhatsApp reste `212680241471`.
Le Pixel Meta reste désactivé : son identifiant est vide.

Les totaux commerciaux fournis par le propriétaire — 300 avis audio,
plus de 500 vocaux, 135 978 messages et plus de 69 453 clients — sont
indépendants des exemples publiés. Ils ne sont pas calculés à partir des médias
de cette page ; cette distinction est indiquée dans les trois langues.

## Médias publiés

- 8 avis audio : 1 dans le bloc principal et 7 dans la liste, sans répétition
  de l’avis principal. Les nouveaux extraits audio uniques proviennent des
  enregistrements 2, 10 et 12.
- 7 vidéos de vocaux WhatsApp. L’ancien `vocal-04`, doublon du témoignage de
  Manal, a été retiré de la sélection.
- 14 captures de messages, avec `av-11.jpg` en première position.
- 24 vidéos de projets distincts : enregistrements 16 à 38, puis 42.
  Les enregistrements 39, 40 et 41 reprennent des projets déjà sélectionnés.
- 3 vidéos UGC, présentées dans l’ordre `ugc3`, `ugc1`, `ugc2`.

Les anciennes références défectueuses à `avis-video` et aux fichiers `real-XX`
ont été retirées ou remplacées par les médias réellement fournis. Les titres
décrivent les documents visibles, sans attribuer aux nouveaux fichiers
l’identité d’anciens exports indisponibles.

Les vidéos de documents sont muettes. Leur contenu est conservé jusqu’à la
dernière image utile ; seul le panneau système en fin d’enregistrement 42 est
remplacé par une tenue de la dernière image propre, à durée totale conservée.
Les barres du téléphone et du lecteur sont recadrées ; les noms et autres
identifiants personnels visibles sont masqués. Les exports de documents sont
en H.264, `yuv420p`, 15 images/s, avec démarrage rapide (`faststart`).
Les lecteurs utilisent `preload="none"` pour limiter le chargement initial.

## Construction et contrôle des fichiers

Le build adapte les chemins des ressources à `/accompagnement/assets/`.
Les trois UGC sont reconstitués depuis leurs parties binaires dans
`campaign-media/`, avec vérification de leur taille et de leur SHA-256.
Après cette reconstitution, `scripts/check-campaign-assets.mjs` contrôle
l’existence des ressources référencées par la page et bloque le build
si un fichier requis manque.
