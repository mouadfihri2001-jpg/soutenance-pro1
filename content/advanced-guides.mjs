const sources={qual:'https://www.equator-network.org/reporting-guidelines/coreq/',medical:'https://www.icmje.org/recommendations/browse/manuscript-preparation/preparing-for-submission.html',prisma:'https://www.prisma-statement.org/prisma-2020',reading:'https://scholar.google.com/intl/en/scholar/help.html',zotero:'https://www.zotero.org/support/creating_bibliographies'};
const drafts=[
['analyse-entretiens','Analyser des entretiens avec une grille traçable','Passe des transcriptions aux thèmes en conservant le contexte et les cas qui nuancent ton interprétation.','Analyse qualitative',
`## Préparer le matériau
Avant de coder, vérifie la transcription et anonymise ce qui doit l’être selon ton protocole. Conserve une règle stable pour les silences, les passages inaudibles et les modifications. Lis chaque entretien dans son ensemble pour retrouver le contexte de la personne et de l’échange. Un extrait isolé peut sembler dire autre chose que le récit complet.

## Construire une première grille
Associe de courtes étiquettes à des passages pertinents pour ta question. Note la définition de chaque code et un exemple de son usage. Distingue les catégories issues de ton cadre théorique et celles apparues pendant la lecture. Fais évoluer la grille en gardant une trace des regroupements et des séparations.

## Comparer plutôt que compter seulement
Un thème fréquent n’est pas automatiquement le plus important. Compare ses formes, les situations où il apparaît et les cas qui le contredisent. Si tu travailles à plusieurs, discutez les désaccords à partir des extraits. Ne présente pas un accord entre codeurs comme une preuve suffisante de justesse de l’interprétation.

## Exemple fictif
Dans des entretiens sur un outil de travail, les expressions « gagner du temps » et « devoir tout vérifier » peuvent coexister chez la même personne. Les ranger dans deux colonnes sans contexte ferait perdre cette tension. Cherche quand l’outil aide, quand il complique et comment la personne arbitre.

## Écrire les résultats
Présente une idée analytique, un extrait situé et ton explication. Indique les différences entre situations et les limites du corpus. N’invente jamais de verbatim pour rendre un thème plus convaincant. Les exigences de compte rendu qualitatif peuvent aider à expliciter le rôle du chercheur et les conditions du recueil.`,'qual'],
['donnees-quantitatives','Préparer ses données avant une analyse quantitative','Vérifie les variables, les effectifs et les valeurs manquantes avant d’interpréter les résultats.','Analyse de données',
`## Décrire la table de données
Écris ce que représente une ligne et ce que représente chaque colonne. Une personne, une visite et une mesure répétée ne sont pas des unités interchangeables. Ajoute un dictionnaire précisant le nom de la variable, son type, son unité et les modalités autorisées. Conserve le fichier brut séparément du fichier de travail.

## Faire les contrôles élémentaires
Cherche les doublons, les valeurs impossibles et les changements d’unité. Vérifie les codes réservés aux réponses absentes : un zéro n’est pas nécessairement une absence de réponse. Note les corrections avec leur justification. Ne supprime pas une valeur seulement parce qu’elle gêne l’hypothèse ; retourne au protocole et à la trace d’origine.

## Choisir une description appropriée
Pour une variable catégorielle, regarde les effectifs et les proportions avec leur dénominateur. Pour une variable numérique, examine aussi la distribution et les valeurs extrêmes. Avant une comparaison, vérifie le dispositif, l’indépendance des observations et les hypothèses de la méthode avec ton encadrant ou une personne compétente.

## Exemple de contrôle
Un tableau indique 24 réponses positives sur 30 réponses disponibles, alors que 40 personnes ont participé. La proportion parmi les répondants et celle parmi tous les participants ne répondent pas à la même question. Ces nombres sont fictifs et illustrent seulement l’importance du dénominateur et des données manquantes.

## Rendre l’analyse reproductible
Conserve les commandes exécutées et la version du logiciel. Distingue les résultats calculés des commentaires proposés par un assistant. Ne présente aucun test comme exécuté sans sortie réelle. Dans le mémoire, explique les choix de nettoyage, les observations exclues et les limites qui influencent l’interprétation.`,'medical'],
['corpus-recherche','Constituer un corpus de recherche cohérent','Documente les critères de sélection pour des textes, images, archives ou publications.','Méthodologie',
`## Définir l’unité étudiée
Précise ce qui entre dans ton corpus : un article, une édition, un entretien, une image ou une séquence. Fixe un périmètre temporel et linguistique adapté à la question. Des documents accessibles ne constituent pas automatiquement un ensemble pertinent. Explique aussi les cas exclus.

## Construire un registre
Pour chaque élément, garde un identifiant, le titre, l’auteur ou l’organisme, la date, la provenance et les conditions d’accès. Ajoute le motif de sélection. Si le document évolue en ligne, note la version ou la date de consultation. Sépare les métadonnées du matériau analysé pour pouvoir corriger une notice sans perdre tes annotations.

## Exemple fictif
Pour étudier la présentation d’un événement dans la presse, tu peux définir plusieurs titres, une période et des types d’articles. Collecter uniquement les premiers résultats d’un moteur introduirait un autre critère, lié à son classement. Si tu fais ce choix, il doit être expliqué ; il ne représente pas l’ensemble de la couverture médiatique.

## Anticiper l’analyse
Teste ta grille sur quelques éléments variés. Vérifie que les unités sont comparables et que les informations nécessaires sont effectivement présentes. Ne change pas silencieusement les critères après avoir observé une tendance intéressante. Consigne les adaptations et leur effet sur la composition du corpus.

## Conserver les limites
Indique les absences, les restrictions d’accès et les choix de traduction. Respecte les droits et les conditions d’utilisation des documents, particulièrement lorsque tu veux les republier. Un catalogue peut aider à repérer des sources ; il ne remplace pas le protocole de constitution de ton propre corpus.`,'reading'],
['reproductibilite','Rendre son travail de recherche reproductible','Organise données, traitements et versions pour pouvoir expliquer comment un résultat a été obtenu.','Recherche et doctorat',
`## Définir le résultat à retracer
Choisis un tableau, une figure ou une mesure centrale. Note les fichiers, paramètres et opérations nécessaires pour la produire. Si tu ne peux pas reconstituer cette chaîne, commence par là. La reproductibilité se prépare pendant le travail ; elle devient coûteuse lorsque les fichiers ont été renommés sans règle à la fin.

## Séparer les étapes
Garde les données brutes dans un emplacement distinct des données nettoyées et des sorties. Donne aux scripts et aux fichiers des noms explicites. Prépare un fichier de lecture expliquant l’ordre d’exécution, les dépendances et les unités. Conserve les paramètres choisis et, lorsque c’est pertinent, les éléments nécessaires au contrôle de l’aléa.

## Exemple de chaîne
| Étape | Trace à conserver |
|---|---|
| Recueil | Provenance, date et version du fichier |
| Nettoyage | Règles, exclusions et journal des changements |
| Analyse | Commandes, paramètres et environnement |
| Présentation | Tableau final et lien vers sa sortie d’origine |

## Tester une reprise
Copie le projet dans un dossier de vérification et suis uniquement les instructions que tu as écrites. Note les actions qui reposent encore sur ta mémoire. Une seconde personne autorisée peut effectuer la même lecture du protocole. L’objectif est de rendre les opérations explicites, pas de rendre publiques des données qui doivent rester protégées.

## Distinguer ouverture et traçabilité
Des données confidentielles peuvent nécessiter un accès restreint. Dans ce cas, décris ce qui peut être partagé et sous quelles conditions. Ne fabrique pas un jeu de données présenté comme réel pour remplir un dépôt. Une illustration synthétique doit être clairement identifiée comme telle.`,'medical'],
['discussion-memoire','Rédiger la discussion de son mémoire','Explique la portée des résultats en les confrontant aux sources et aux limites du dispositif.','Rédaction académique',
`## Partir de la question initiale
Commence par rappeler les résultats qui répondent directement à la question, sans reproduire tous les tableaux. Classe les points par importance analytique. Le lecteur doit comprendre ce que ton travail permet d’avancer et ce qu’il ne permet pas de trancher. Une discussion ne consiste pas à rendre tous les résultats favorables à l’hypothèse.

## Construire chaque paragraphe
Présente un constat, rapproche-le de travaux réellement lus, puis examine les explications possibles. Compare les terrains, les mesures et les périodes avant de parler d’accord ou de désaccord. Une différence peut venir du dispositif autant que du phénomène lui-même. Signale lorsqu’une interprétation reste hypothétique.

## Exemple fictif
Des personnes interrogées déclarent utiliser un outil, mais les traces disponibles ne décrivent pas la fréquence d’usage. Tu peux discuter les usages déclarés et leur sens. Tu ne peux pas transformer ces déclarations en mesure précise de fréquence. La discussion gagne en clarté lorsque cette distinction est explicite.

## Relier les limites aux conclusions
Ne réserve pas toutes les limites à une liste finale. Explique près de chaque interprétation la contrainte qui influence sa portée : recrutement, mesure, accès au terrain ou période. Si une limite fragilise fortement une conclusion, réduis la force de la formulation plutôt que de l’ajouter comme une simple précaution.

## Terminer par des implications proportionnées
Propose des pistes cohérentes avec les résultats, puis indique ce qu’il faudrait étudier pour aller plus loin. Distingue implication pratique, nouvelle hypothèse et projet futur. Une recommandation universelle demande des éléments que ton étude locale ne fournit pas nécessairement.`,'medical'],
['limites-recherche','Présenter les limites d’une recherche avec précision','Explique l’effet de chaque contrainte sur les résultats et les conclusions.','Discussion',
`## Décrire un effet, pas une excuse
« Le temps était limité » renseigne peu le lecteur. Précise ce que cette contrainte a modifié : la période observée, le nombre de situations comparées ou l’accès à certains documents. Puis explique quelle conclusion devient moins solide ou impossible. Une limite utile relie une décision concrète à la portée du travail.

## Examiner plusieurs niveaux
Interroge le cadrage, la sélection des cas, les instruments, la qualité des données et l’analyse. Dans un travail documentaire, examine aussi les langues, les bases et les critères de sélection. Toutes les limites n’ont pas la même importance ; classe-les selon leur effet sur la question centrale.

## Exemple fictif de reformulation
Formulation vague : « L’échantillon est petit ». Formulation plus précise : « Le recrutement dans une seule équipe permet de décrire ce contexte, mais ne permet pas de comparer les pratiques entre plusieurs organisations ». La seconde version ne prétend pas connaître un seuil universel de taille suffisante.

## Dire ce que tu as fait
Si tu as effectué un contrôle, une comparaison ou une analyse complémentaire, décris-la et indique son résultat réel. Ne mentionne pas une vérification qui n’a pas eu lieu. Une mesure de réduction d’un risque ne signifie pas que ce risque a disparu.

## Ajuster la conclusion
Relis chaque affirmation forte à la lumière des limites. Remplace une généralisation par une conclusion située lorsque c’est nécessaire. Termine par une prochaine étape ciblée : autre population, autre période, instrument mieux adapté ou données complémentaires. Cette proposition doit répondre à une limite identifiée, plutôt qu’à une formule générale sur de futures recherches.`,'medical'],
['conclusion-memoire','Écrire une conclusion qui répond à la problématique','Fais ressortir l’apport du travail sans ajouter des résultats nouveaux.','Mémoire et PFE',
`## Revenir à ce que le lecteur devait comprendre
Relis la problématique et les objectifs avant de rédiger. Prépare une phrase répondant à chacun à partir des résultats réellement présentés. Si un objectif reste sans réponse, explique-le clairement. La conclusion ne doit pas réparer une analyse absente en introduisant une information jamais discutée.

## Organiser trois mouvements
Rappelle brièvement la démarche, expose la réponse principale puis précise sa portée. Termine par une perspective directement liée au travail. Le volume dépend des consignes et de la taille du mémoire ; allonger artificiellement la conclusion ne renforce pas l’argument. Garde seulement les éléments nécessaires pour que le lecteur comprenne l’apport.

## Exemple de canevas à compléter
« Ce travail portait sur [question située]. À partir de [matériaux et méthode], l’analyse met en évidence [résultat établi]. Cette réponse concerne [périmètre] et doit être lue avec [limite importante]. Une prochaine étape serait [question ou vérification précise]. » Ce canevas ne contient aucun résultat : remplis-le avec ton propre travail et adapte sa formulation.

## Éviter les ouvertures sans lien
Une dernière phrase sur une transformation générale de la société peut affaiblir une conclusion précise. Préfère une piste dont tu peux expliquer la nécessité. Si une implication pratique est envisagée, distingue ce qui est déjà soutenu par les données de ce qui reste à tester.

## Faire un contrôle croisé
Compare le résumé, l’introduction et la conclusion. La question doit rester cohérente et les termes essentiels conserver le même sens. Vérifie aussi que les conclusions de l’oral ne dépassent pas celles du document écrit. Cette cohérence aide à préparer les questions du jury.`,'medical'],
['annexes-memoire','Choisir et organiser les annexes du mémoire','Ajoute les documents qui permettent de comprendre ou vérifier le travail, sans encombrer la lecture.','Mise en forme',
`## Donner une fonction à chaque annexe
Une annexe doit répondre à un besoin du lecteur : comprendre un instrument, vérifier une procédure ou consulter un résultat détaillé. Ne joins pas tout ce que tu as accumulé. Les documents sans lien explicite avec l’analyse rendent l’ensemble plus difficile à utiliser et peuvent contenir des informations inutiles ou sensibles.

## Préparer une table de correspondance
Pour chaque annexe, écris le titre, le contenu, l’endroit du texte qui y renvoie et sa raison d’être. Si aucune partie du mémoire ne la mentionne, interroge son utilité. Une information indispensable à l’argument principal doit rester dans le corps du texte ; l’annexe apporte le détail complémentaire.

## Exemple d’organisation
| Annexe possible | Usage dans le mémoire |
|---|---|
| Instrument de recueil | Montrer les questions réellement utilisées |
| Dictionnaire de variables | Expliquer les codes et unités |
| Tableau complémentaire | Présenter le détail d’un résultat discuté |
| Document de procédure | Permettre de comprendre une étape décrite |

## Contrôler les informations partagées
Vérifie les accords, les identifiants, les noms et les données qui permettraient de reconnaître une personne ou une organisation. Ne place pas des transcriptions complètes dans une version publique par défaut. Les modalités de dépôt et de diffusion doivent correspondre au protocole et aux consignes reçues.

## Finaliser les renvois
Choisis une numérotation stable, ajoute des titres lisibles et contrôle tous les appels d’annexes après l’export. Ouvre le fichier final pour vérifier l’orientation des pages, les tableaux et les liens. Un lecteur doit pouvoir passer du texte à la bonne annexe sans deviner son emplacement.`,'medical'],
['planification-memoire','Planifier son mémoire avec des livrables concrets','Transforme une date de dépôt en étapes vérifiables et garde une marge de révision.','Organisation',
`## Partir des échéances réelles
Note le dépôt, l’oral et les retours attendus de ton encadrant. Certaines étapes dépendent d’un accès au terrain, d’une autorisation ou de données que tu ne maîtrises pas. Place-les tôt et signale l’incertitude. Un calendrier rempli de dates exactes ne rend pas ces dépendances plus certaines.

## Définir une preuve d’avancement
Remplace « travailler la bibliographie » par un résultat observable : une liste de sources lues, une matrice comparative ou un paragraphe de synthèse. Pour chaque tâche, précise l’entrée nécessaire, le livrable et la personne qui doit éventuellement le valider. Cela permet de distinguer une activité longue d’une étape effectivement terminée.

## Exemple de séquence
Une question validée précède généralement le protocole détaillé. Le recueil fournit le matériau nécessaire à l’analyse. La discussion s’appuie sur des résultats stabilisés. Certaines lectures et une partie de la rédaction peuvent avancer en parallèle, mais elles ne remplacent pas les dépendances centrales.

## Protéger la fin du calendrier
Réserve du temps aux retours, à la cohérence du document, aux citations et à l’export final. Prévois aussi une répétition de l’oral après stabilisation des résultats. Le [planificateur](/outils/planning) fournit une trame modifiable ; ses dates sont des points de départ et non des délais institutionnels.

## Réviser chaque semaine
Regarde ce qui est terminé, ce qui bloque et ce qui doit changer. Si un retard menace la qualité de l’ensemble, discute le périmètre avec ton encadrant. Réduire une comparaison irréalisable peut être plus utile que déplacer toutes les dates sans modifier le travail attendu.`,'zotero'],
['repondre-jury','Répondre aux questions du jury avec clarté','Prépare des réponses fondées sur tes choix, tes résultats et leurs limites.','Soutenance',
`## Préparer les questions à partir du mémoire
Repère les décisions importantes : choix du sujet, méthode, sélection des sources, résultats inattendus et limites. Pour chacune, note pourquoi tu l’as prise, sur quels éléments elle repose et quelle alternative était possible. Tu prépareras ainsi un raisonnement, plutôt qu’une liste de réponses apprises sans contexte.

## Utiliser une réponse en trois temps
Reformule brièvement la question si elle est ambiguë. Donne une réponse directe, puis appuie-la sur un élément précis du travail. Termine par une limite ou une conséquence lorsque c’est utile. Si la question contient plusieurs parties, annonce l’ordre de ta réponse et vérifie que tu les traites toutes.

## Exemple fictif
À « Pourquoi avoir étudié une seule organisation ? », une réponse peut expliquer l’accès au terrain, l’objectif de compréhension du cas et la limite de comparaison. Évite de prétendre que ce choix représente toutes les organisations. Appuie la réponse sur ton protocole réel, pas sur une formule de défense générique.

## Réagir quand tu ne sais pas
Dis ce que ton travail permet d’affirmer et ce qui demanderait une vérification supplémentaire. Tu peux proposer comment chercher la réponse sans inventer un chiffre ni attribuer une conclusion à une source mal connue. Reconnaître une limite précise peut rendre l’échange plus utile.

## Répéter un échange, pas un monologue
Demande à une personne de formuler des objections et de te couper lorsque la réponse devient trop longue. Garde une fiche des points à clarifier dans le support. Les questions proposées par un outil d’entraînement sont des pistes ; personne ne connaît à l’avance l’ensemble des questions de ton jury.`,'medical'],
['resume-scientifique','Rédiger un résumé scientifique précis','Résume la question, la méthode et les résultats réellement présents dans le document.','Rédaction',
`## Vérifier le format demandé
Le résumé peut être structuré par rubriques ou rédigé en un paragraphe. Consulte les consignes de longueur, de langue et de mots-clés avant de commencer. Il doit pouvoir être compris séparément du mémoire, mais rester fidèle à son contenu. Évite les références à des tableaux que le lecteur n’a pas devant lui.

## Sélectionner l’essentiel
Écris une phrase sur le problème, une sur l’objectif, une ou deux sur la méthode, puis les principaux résultats et leur portée. Pour une étude quantitative, conserve les unités et les effectifs nécessaires. Pour une analyse qualitative ou théorique, nomme clairement le matériau et l’apport plutôt que d’ajouter des nombres décoratifs.

## Exemple de révision
Phrase trop vague : « Les résultats sont très intéressants et montrent plusieurs problèmes ». Remplace-la par une description des résultats effectivement établis et de leur contexte. Cet exercice ne consiste pas à rendre le travail plus spectaculaire : il consiste à donner au lecteur assez d’informations pour comprendre son apport.

## Contrôler les mots-clés
Choisis des termes qui désignent l’objet, la population ou le terrain et la méthode lorsqu’elle est centrale. Vérifie le vocabulaire utilisé dans les sources de ton domaine. Des mots-clés très généraux peuvent rendre le travail difficile à retrouver ; des formulations propres à ton seul mémoire risquent d’être peu compréhensibles.

## Rédiger à la fin
Prépare un brouillon tôt, mais finalise le résumé lorsque les résultats et la conclusion sont stabilisés. Compare ensuite chaque affirmation au document. Pour une traduction, vérifie les termes techniques et les nuances de certitude : une simple correction grammaticale ne suffit pas à garantir l’équivalence du sens.`,'medical'],
['revue-systematique','Préparer une revue systématique avec une méthode explicite','Organise le protocole, la sélection et les traces nécessaires avant de résumer les études.','Recherche avancée',
`## Vérifier si la démarche convient
Une revue systématique vise une question définie avec une méthode explicite de recherche et de sélection. Elle demande du temps, des compétences documentaires et une stratégie d’évaluation des études. Discute sa faisabilité avec ton encadrant. Une revue narrative bien décrite vaut mieux qu’une revue appelée systématique sans les opérations correspondantes.

## Préparer le protocole
Définis la question, les critères d’éligibilité, les sources documentaires, les méthodes de sélection et les informations à extraire. Précise comment les désaccords seront traités lorsque plusieurs personnes participent. Identifie les outils adaptés au type d’études. La méthode d’évaluation ne se choisit pas uniquement après avoir vu les résultats.

## Garder la chaîne de sélection
Conserve les requêtes exactes, leurs dates, les résultats exportés, les doublons retirés et les décisions prises. À l’étape du texte intégral, note un motif explicite d’exclusion. Ces traces permettent de rendre compte du passage des références repérées aux études retenues sans reconstituer des nombres de mémoire.

## Utiliser PRISMA à bon escient
PRISMA 2020 fournit des repères pour rendre compte d’une revue systématique, avec une checklist et des schémas de flux. Ce cadre de présentation ne réalise pas la recherche, l’évaluation ou la synthèse à ta place. Ne remplis jamais un diagramme avec des effectifs fictifs.

## Définir la synthèse possible
Comparer des études exige d’examiner les populations, les méthodes et les mesures. Une méta-analyse ne découle pas automatiquement du nombre d’articles. Explique pourquoi une synthèse statistique ou une présentation narrative est adaptée, et signale les limites liées aux données disponibles.`,'prisma'],
['these-doctorat','Organiser un projet de thèse de doctorat','Relie contribution scientifique, travaux existants et jalons de recherche.','Doctorat',
`## Formuler une contribution possible
Un projet doctoral doit préciser la question qu’il souhaite faire avancer et ce que les travaux existants laissent à examiner. Commence par des lectures structurées et une discussion des méthodes utilisées dans ton domaine. Une phrase affirmant qu’aucun travail n’existe demande une recherche documentaire solide ; ne la déduis pas de quelques résultats de moteur.

## Distinguer programme et première étude
Le projet global peut contenir plusieurs questions. Choisis une première étude ou un premier chapitre qui teste un élément central et dont les matériaux sont accessibles. Décris ce qu’il permettra d’apprendre pour la suite, y compris si les résultats ne correspondent pas à l’attente initiale.

## Construire des jalons discutables
Associe chaque étape à un livrable : état des travaux, protocole, corpus, analyse, chapitre ou présentation. Prépare pour les réunions une note courte sur les résultats, les décisions à prendre et les obstacles. Conserve les versions et les retours ; ils expliquent comment le projet s’est transformé.

## Adapter le cadre institutionnel
Les procédures d’inscription, de suivi, de dépôt et de soutenance diffèrent selon les établissements et les pays. Vérifie les documents de ton école doctorale, leur année et les consignes de la direction de thèse. Une liste générale trouvée en ligne ne remplace pas ce cadre.

## Préparer la traçabilité
Organise tôt les sources, les données et les conditions de diffusion. Pour les publications, discute les contributions et les règles de signature avec les personnes concernées. Soutenance Pro peut servir à structurer ton travail et tes lectures ; la validation scientifique reste celle du processus de recherche et de l’encadrement.`,'reading'],
['encadrer-memoire','Encadrer un mémoire avec des retours exploitables','Définis les attentes et organise les corrections pour aider l’étudiant à prendre ses décisions.','Enseignants et encadrants',
`## Établir les règles de travail
Clarifiez les livrables, les canaux de communication, les délais de retour possibles et les responsabilités de chacun. Précisez les critères d’évaluation disponibles et les règles du cursus. L’encadrement gagne en efficacité lorsque l’étudiant sait ce qui doit être validé avant le terrain et ce qui peut évoluer pendant l’analyse.

## Demander un contexte pour chaque version
Avec un chapitre, demandez une courte note : objectif du texte, changements depuis la version précédente et questions prioritaires. Cela permet de cibler le retour. Une correction de mise en forme n’a pas le même effet qu’un changement de problématique ; rendez cette différence visible.

## Hiérarchiser les commentaires
Séparez les points bloquants pour la cohérence scientifique, les clarifications nécessaires et les améliorations de présentation. Formulez autant que possible une question ou un critère vérifiable. « Approfondir » devient plus utile si le commentaire indique quel argument manque ou quelles sources doivent être confrontées.

## Exemple de retour
Au lieu de « discussion trop faible », proposez : « Comparez ce résultat aux deux études présentées dans le cadre théorique. Expliquez si les populations et les mesures sont comparables, puis ajustez la conclusion ». Cet exemple décrit une tâche observable sans écrire l’analyse à la place de l’étudiant.

## Suivre les décisions
Conservez un tableau des points discutés, des décisions prises et de leur traitement dans la version suivante. Les outils d’assistance peuvent aider à organiser ces retours, mais une reformulation automatique ne constitue pas une validation scientifique. Vérifiez aussi les règles applicables à l’usage de tels outils dans la formation.`,'medical']
];
export const advancedGuides=drafts.map(([slug,heading,lead,category,body,source])=>({slug:'guides/'+slug,title:heading,heading,lead,description:lead,category,kind:'guide',intent:'general',updatedAt:'2026-09-11',checklist:['Vérifier les consignes du cursus','Travailler à partir de matériaux réels','Documenter les choix et les limites'],related:slug==='encadrer-memoire'?['guides/these-doctorat','guides/planification-memoire']:['guides/fiche-lecture','guides/protocole-recherche'],body:body+'\n\n## Pour approfondir\n\n[Consulter la ressource de référence]('+sources[source]+'). Ce guide propose une organisation de travail originale ; adapte les exercices aux exigences de ton projet.'}));
