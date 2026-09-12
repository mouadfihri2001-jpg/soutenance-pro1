const scholar='https://scholar.google.com/intl/en/scholar/help.html';
const pubmed='https://pubmed.ncbi.nlm.nih.gov/help/';
const zotero='https://www.zotero.org/support/creating_bibliographies';
const icmje='https://www.icmje.org/recommendations/browse/manuscript-preparation/preparing-for-submission.html';
const coreq='https://www.equator-network.org/reporting-guidelines/coreq/';
const prisma='https://www.prisma-statement.org/prisma-2020';
// Original practical exercises. Illustrations are explicitly hypothetical; no invented study findings.
const drafts=[
['lire-article-scientifique','Lire un article scientifique sans perdre le fil','Une grille pour passer de la question de l’auteur à ce que tu peux réellement utiliser dans ton mémoire.','Lecture critique',
`## Commencer par une décision de lecture
Avant de surligner, écris pourquoi tu ouvres cet article : comprendre un concept, examiner une méthode ou comparer un résultat. Lis le titre, le résumé et les titres de section. Si le document ne répond pas à ce besoin, conserve éventuellement sa référence mais ne le transforme pas en source centrale. Un résultat très cité peut rester hors de ton périmètre.

## Construire une fiche en six lignes
Relève la question, le dispositif, les observations, la conclusion, les limites et l’usage possible dans ton projet. Pour la méthode, note concrètement qui ou quoi est étudié, où, quand et avec quels outils. Un mot comme « enquête » ne suffit pas. Dans les résultats, garde les unités, les effectifs et la page du tableau. Dans la discussion, distingue l’explication proposée par l’auteur de ce que les données montrent directement.

## Exercice de lecture
Imagine un article sur l’utilisation d’une plateforme dans une seule formation. La phrase « le numérique améliore les apprentissages » serait une généralisation trop large. Ta fiche devrait plutôt décrire la formation concernée, la mesure retenue et les conditions de comparaison. Cet exemple est fictif : aucun effet mesuré n’est attribué à une étude réelle.

## Transformer la lecture en argument
Ferme le PDF et écris en deux phrases ce qu’il apporte à ta question. Rouvre-le pour vérifier chaque élément. Ajoute ensuite une phrase sur ce que tu ne peux pas en déduire. Cette courte confrontation vaut mieux qu’une page de passages copiés. Si une citation exacte est nécessaire, conserve ses guillemets et son emplacement dès la prise de notes.

## Avant de passer au document suivant
Vérifie la version lue, la référence et la présence éventuelle d’un correctif sur le site de la revue. Une notice du catalogue permet de retrouver le document ; elle ne remplace pas cette lecture.`,icmje],
['fiche-lecture','Faire une fiche de lecture utile au mémoire','Garde les références, les arguments et tes propres observations dans un document que tu pourras réutiliser.','Organisation des sources',
`## Séparer trois types de notes
Une fiche devient difficile à exploiter quand le texte de l’auteur, ta reformulation et ton jugement se confondent. Crée trois zones : extrait exact, reformulation personnelle, commentaire. Dans la première, conserve les guillemets et la page. Dans la deuxième, reconstruis l’idée sans regarder le texte. Dans la troisième, explique son intérêt ou ses limites pour ta question.

## Commencer par la référence complète
Note les auteurs dans l’ordre, le titre, l’année, le type de document, la revue ou l’établissement et le DOI ou le lien du dépôt. N’ajoute pas un numéro de page que tu n’as pas identifié. Pour un fichier téléchargé, garde aussi son nom et la version. Un gestionnaire de références facilite ce rangement, mais une importation peut contenir des champs incomplets.

## Exemple de fiche à compléter
| Zone | Ce que tu écris |
|---|---|
| Ma question | Pourquoi je lis ce document aujourd’hui |
| Idée de l’auteur | Une proposition précise, avec son emplacement |
| Appui | Donnée, argument ou passage qui la soutient |
| Limite | Contexte dans lequel elle ne peut pas être étendue |
| Mon utilisation | Partie du mémoire où cette source sera discutée |

## Retrouver les liens entre lectures
Utilise des étiquettes stables : un concept, une méthode, un terrain. Évite une étiquette différente pour chaque document. À la fin d’une séance, rapproche deux fiches : les auteurs parlent-ils du même objet et utilisent-ils les mêmes définitions ? Ce rapprochement prépare ta revue de littérature.

## Un résultat concret
Ta fiche doit permettre de retrouver un passage et d’expliquer sa pertinence en moins d’une minute. Télécharge le [modèle Word de fiche de lecture](/modeles/fiche-lecture-source.docx), puis teste-le sur une source réellement consultée.`,zotero],
['revue-litterature','Construire une revue de littérature argumentée','Organise les travaux par questions et débats au lieu d’aligner les résumés des auteurs.','Mémoire et doctorat',
`## Définir la question de la revue
Écris ce que la revue doit permettre de comprendre : une notion, des résultats contradictoires, une méthode ou un terrain peu décrit. Précise la période, les disciplines et les langues pertinentes. Une revue narrative ne devient pas systématique parce qu’elle contient beaucoup de références. Le nom de ta démarche doit correspondre à la méthode réellement suivie.

## Comparer dans une matrice
Pour chaque source lue, relève la définition des concepts, le contexte, le dispositif, les résultats utiles et les limites. Crée ensuite des groupes selon un problème partagé. Si deux études semblent se contredire, compare d’abord leur population et leur mesure : elles répondent peut-être à des questions différentes.

## Exemple de structure
Pour un sujet fictif sur l’accompagnement d’étudiants, une organisation possible serait : les définitions de l’accompagnement ; les dispositifs étudiés ; les manières d’en apprécier les effets ; les limites des comparaisons. Ce plan organise une discussion. Il ne prouve pas qu’un dispositif fonctionne mieux qu’un autre.

## Rédiger un paragraphe de synthèse
Commence par une idée qui répond à ta question, puis confronte deux ou trois sources effectivement lues. Explique ce qui converge et ce qui varie. Termine par la conséquence pour ton propre protocole. Une phrase « plusieurs auteurs montrent que » sans références identifiables et sans conditions précises reste trop vague.

## Garder une trace de la sélection
Conserve les bases consultées, les requêtes, les dates et les raisons d’inclusion. Si tu écartes une source, note pourquoi. Ces traces permettent de discuter la couverture de ta revue et d’actualiser la recherche. Avant de conclure à une absence de travaux, essaie des synonymes et examine les références des documents les plus proches.`,scholar],
['recherche-google-scholar','Chercher efficacement dans Google Scholar','Formule une recherche, retrouve le texte et garde une trace de ce que tu sélectionnes.','Recherche documentaire',
`## Préparer des concepts plutôt qu’une phrase entière
Découpe ta question en deux ou trois concepts. Pour chacun, note des synonymes et, si nécessaire, leur équivalent anglais. Commence par une combinaison courte. Lis les titres obtenus pour voir si le vocabulaire correspond au sujet. Une recherche trop étroite peut manquer des travaux qui emploient un autre terme.

## Exploiter les fonctions de Scholar
L’aide officielle décrit la recherche par titre entre guillemets, par auteur et par période. Les liens vers les autres versions peuvent conduire à un dépôt accessible. Les références citées et les travaux qui citent un document offrent d’autres pistes. Ce sont des chemins de découverte, pas un classement de qualité scientifique.

## Exemple de progression
Pour un sujet fictif sur le tutorat de nouveaux étudiants, commence avec les concepts « tutorat » et « transition universitaire ». Examine ensuite le vocabulaire de trois résultats pertinents avant d’ajouter un terrain ou une population. Note à chaque étape la requête et la raison du changement. Ne cherche pas simplement jusqu’à trouver une conclusion qui te convient.

## Lire avant d’ajouter à la bibliographie
Ouvre le document, vérifie les auteurs, la version et les pages utiles. Une citation exportée peut être incomplète ; compare-la au document. Si seul le résumé est accessible, inscris cette limite dans tes notes. Tu peux rechercher une autre version autorisée ou demander l’aide de ta bibliothèque universitaire.

## Organiser la séance
Prévois une liste « à lire » distincte des sources déjà exploitées. À la fin, garde quelques références réellement pertinentes et une prochaine requête. Notre [annuaire de recherche](/recherche) ouvre Scholar avec tes mots-clés ; les résultats et l’accès aux documents restent gérés par Google et les sites sources.`,scholar],
['recherche-pubmed','Préparer une recherche bibliographique dans PubMed','Associe les concepts de ta question et vérifie comment PubMed traite ta requête.','Recherche en santé',
`## Clarifier le besoin documentaire
Commence par préciser la population, le phénomène ou l’intervention et le résultat qui t’intéresse. Tous les sujets n’exigent pas la même grille. Une question d’expérience vécue ne se recherche pas exactement comme une comparaison de traitements. Écris les concepts avant d’ouvrir les filtres.

## Construire et contrôler la requête
Le guide PubMed explique l’emploi des opérateurs AND et OR, des champs et des filtres. Associe les variantes d’un même concept, puis relie les concepts. Examine les détails de recherche pour comprendre les termes effectivement utilisés. Les mots du titre ou du résumé et les descripteurs d’indexation peuvent se compléter ; leur choix doit rester documenté.

## Exemple de carnet de recherche
| À conserver | Exemple de champ à remplir |
|---|---|
| Question | Population, contexte et phénomène étudié |
| Requête exacte | Texte exécuté, avec parenthèses et champs |
| Date et filtres | Date de recherche, langues et période retenues |
| Sélection | Motif d’inclusion ou d’exclusion après lecture |

## Éviter les raccourcis
Limiter immédiatement aux textes gratuits peut exclure des études pertinentes. L’accès au texte et la pertinence scientifique sont deux décisions distinctes. De même, un filtre de type d’article ne dispense pas de vérifier le dispositif. Lis le protocole, les résultats et les limites avant d’utiliser une conclusion.

## Préparer la suite
Exporte les références sélectionnées dans ton gestionnaire, contrôle les doublons et garde la requête originale. Pour une revue systématique, organise cette démarche avec ton encadrant et un professionnel de la documentation. Ce guide aide à trouver des publications ; il ne transforme pas leurs résultats en conseil médical.`,pubmed],
['recherche-hal','Trouver une thèse, un mémoire ou un article dans HAL','Comprends la différence entre une notice, un fichier déposé et une version publiée.','Archives ouvertes',
`## Identifier ce que tu as trouvé
Une notice bibliographique décrit un travail ; elle ne garantit pas qu’un fichier est disponible. Un dépôt peut correspondre à plusieurs versions. Ouvre la page d’origine et vérifie le type de document, les auteurs, la date et les informations de publication. Une thèse, un mémoire et un article ne se citent pas de la même manière.

## Lire la version disponible
Note la version du dépôt dans ta fiche de lecture. Compare le titre et les auteurs à ceux du fichier. Si un DOI est indiqué, il peut conduire à la version de l’éditeur. Des différences de pagination sont possibles : cite les pages de la version réellement consultée et respecte les consignes bibliographiques de ton établissement.

## Utiliser le catalogue Soutenance Pro
Notre sélection classe des notices francophones par discipline et type de document. Chaque notice renvoie au dépôt et au fichier déclaré dans l’API HAL. Les textes restent chez leur hébergeur d’origine. La date de collecte des métadonnées ne signifie pas que nous avons relu chaque document ou vérifié toutes ses conclusions.

## Exemple d’usage
Tu trouves deux mémoires proches de ton sujet. Compare leur question, leur méthode et leur plan pour comprendre différentes façons d’organiser un travail. Reprends ensuite ta propre question et tes données. Copier une partie du texte ou du plan sans réflexion ne remplace pas cette démarche.

## Vérifier les droits
Accès public ne veut pas dire réutilisation sans conditions. Consulte la licence affichée sur le dépôt avant de republier un fichier, une figure ou un long extrait. Notre catalogue permet de retrouver la source et d’exporter ses métadonnées ; il ne te transfère aucun droit sur le document.`, 'https://api.archives-ouvertes.fr/docs/search'],
['zotero-bibliographie','Organiser une bibliographie avec Zotero','Un circuit simple : importer, vérifier, classer, citer puis contrôler le document final.','Outils de recherche',
`## Construire une collection par projet
Crée une collection portant le nom de ton mémoire et quelques sous-collections si elles correspondent à de vrais axes. Évite de copier la même référence dans plusieurs bibliothèques indépendantes. Des étiquettes communes, comme « à lire » ou « méthode », facilitent le suivi. Garde les notes de lecture près des références.

## Vérifier avant de citer
Après une importation, compare le type de document, le titre, les auteurs, l’année et le DOI au fichier ou à la page de l’éditeur. Un logiciel peut formater un champ erroné sans signaler le problème. Pour une thèse, renseigne le type et l’établissement plutôt que de la classer comme article de revue.

## Produire une bibliographie
La documentation Zotero présente plusieurs façons de créer une bibliographie, dont la sélection d’éléments et les intégrations aux traitements de texte. Choisis le style demandé par ton établissement. Dans un long mémoire, les citations liées au gestionnaire rendent les mises à jour plus faciles qu’une liste tapée manuellement.

## Exemple d’organisation
Imagine trois ensembles : cadre théorique, méthode, discussion. Une publication peut éclairer deux ensembles sans devenir deux références différentes. Dans sa note, indique les pages utiles à chaque usage. Réserve une étiquette séparée aux références dont les métadonnées restent à corriger.

## Avant le dépôt
Vérifie que chaque citation du texte figure dans la bibliographie et que chaque entrée correspond à un document utilisé. Contrôle ensuite les noms, les accents, la ponctuation et les liens dans la version exportée. Garde une copie de travail permettant de modifier les citations et un fichier final correspondant exactement à ce que tu remets.`,zotero],
['citer-apa','Préparer ses citations auteur-date et vérifier le style APA','Distingue la référence complète, le renvoi dans le texte et la citation exacte.','Citations',
`## Réunir les informations avant la mise en forme
Pour une source, conserve les auteurs, la date, le titre, le support et l’identifiant stable. Précise aussi le type : article, livre, chapitre ou thèse. Les éléments nécessaires dépendent de ce type. Une référence absente ou mal renseignée ne devient pas fiable parce que sa ponctuation ressemble à un style connu.

## Comprendre le système auteur-date
Dans un système auteur-date, le lecteur doit pouvoir relier le renvoi du texte à une entrée de la bibliographie. Une citation exacte demande également un emplacement permettant de retrouver le passage. Consulte les règles APA officielles et la version demandée par ton établissement pour les cas particuliers : auteurs multiples, organisme, date manquante ou source secondaire.

## Exemple de préparation, sans référence inventée
Écris dans ta fiche : « auteur à vérifier », « année à vérifier », « idée reformulée », « page consultée ». Remplace ensuite ces champs par les informations du document réel. N’utilise pas un nom fictif comme s’il s’agissait d’une publication. L’outil de [références](/outils/references) aide à préparer et exporter ces métadonnées, mais la vérification du style final reste nécessaire.

## Contrôler la cohérence
Parcours ton texte paragraphe par paragraphe. Repère les faits et idées attribuables à une source, puis vérifie que le renvoi est placé là où le lecteur comprend sa portée. Un seul renvoi à la fin de plusieurs paragraphes peut rendre cette portée ambiguë.

## Corriger à partir du document original
Avant de remettre le travail, rapproche chaque entrée de sa source. Vérifie les auteurs homonymes, les différentes années et les versions consultées. Si ton encadrant impose un guide local, signale et résous les différences avec le style général plutôt que de mélanger plusieurs conventions.`, 'https://apastyle.apa.org/style-grammar-guidelines/citations'],
['citer-vancouver','Organiser des références numérotées en santé','Garde le lien entre chaque appel de référence et la source réellement utilisée.','Citations en santé',
`## Partir du guide de la formation ou de la revue
Le terme Vancouver est souvent utilisé pour désigner des conventions bibliographiques en santé. Vérifie néanmoins le guide exact demandé, les types de documents admis et la présentation des appels de référence. Une revue peut avoir ses propres variantes. N’applique pas une ponctuation mémorisée à tous les cas.

## Maintenir une correspondance stable
Dans une bibliographie numérotée par ordre de citation, déplacer un paragraphe peut modifier la numérotation. Utilise un gestionnaire pour préserver la correspondance entre les appels et les entrées. Évite de retaper certains numéros à la main : ils risquent de ne plus suivre les mises à jour du document.

## Relever les champs nécessaires
Pour un article, contrôle les auteurs, le titre, la revue, l’année, le volume et l’identifiant de page ou d’article. Pour une thèse ou un rapport, relève les informations propres à ce document. Un DOI stable aide à retrouver une publication, mais ne prouve pas que l’affirmation que tu lui attribues figure dans le texte.

## Exercice de contrôle
Choisis un paragraphe comportant trois appels de références. Pour chacun, ouvre la source et note la phrase, le tableau ou l’argument qui soutient ton propos. Si tu ne retrouves rien, reformule ou remplace l’appui. Cette vérification porte sur le sens avant de porter sur la mise en forme.

## Finaliser le fichier
Après toute réorganisation importante, actualise les citations et exporte une nouvelle version. Contrôle les numéros dans les tableaux, les légendes et les annexes, puis vérifie que la bibliographie finale ne contient ni doublon ni entrée inutilisée. Les recommandations ICMJE orientent vers les règles applicables aux manuscrits médicaux.`,icmje],
['citations-plagiat','Éviter le plagiat en travaillant ses sources','Une méthode de prise de notes et de révision, sans promesse de score magique.','Intégrité académique',
`## Garder l’origine d’une idée dès la lecture
Le risque commence souvent dans les notes : un passage copié perd ses guillemets puis se retrouve dans le mémoire. Dès la première lecture, distingue l’extrait exact, ta reformulation et ton commentaire. Ajoute la source et la page à côté du passage, pas dans une liste séparée que tu devras reconstituer.

## Reformuler en comprenant
Lis le passage, ferme-le et explique l’idée avec la logique de ton propre paragraphe. Rouvre la source pour vérifier que tu n’as ni changé le sens ni repris sa formulation de trop près. Remplacer quelques mots par des synonymes n’est pas une analyse personnelle. Une idée empruntée reste à attribuer même lorsque tu la reformules.

## Citer quand la formulation compte
Si tu analyses une définition ou un choix de mots, la citation exacte peut être préférable. Conserve alors les guillemets, la référence et l’emplacement. Pour une figure ou un tableau, vérifie aussi les conditions de réutilisation : la seule mention de la source ne résout pas toutes les questions de droits.

## Lire un rapport de similitudes
Un outil de similitudes repère des correspondances dans les sources auxquelles il accède. Il ne remplace pas l’examen du contexte : bibliographie, citation correctement marquée, formulation courante ou reprise non attribuée. Aucun pourcentage isolé ne suffit à décider si un travail est acceptable. Les règles de ton établissement restent la référence.

## Une révision concrète
Sur une page, marque les idées qui viennent d’une lecture et vérifie leur attribution. Contrôle ensuite les passages entre guillemets et les légendes. Notre [page de vérification des citations](/outils/citations) propose cette démarche ; elle ne simule ni détection externe ni certificat d’originalité.`,icmje],
['question-recherche','Transformer un sujet large en question de recherche','Délimite un objet, un terrain et un résultat que ton travail peut réellement produire.','Cadrage',
`## Distinguer le thème de la question
« Le télétravail » est un thème. Une question précise indique ce que tu veux comprendre, dans quel contexte et auprès de qui. Commence par une difficulté observée ou un débat identifié dans tes lectures. N’ajoute pas une conclusion dans la formulation : une question qui suppose d’avance une amélioration ferme trop tôt la recherche.

## Tester la faisabilité
Liste les données ou documents nécessaires pour répondre. Peux-tu y accéder dans le temps disponible ? As-tu les autorisations et les compétences nécessaires ? Si l’accès au terrain est incertain, prévois avec ton encadrant un périmètre alternatif. Un sujet plus restreint peut produire une analyse plus solide qu’une comparaison impossible à réaliser.

## Exemple fictif de resserrement
Sujet : l’intégration de nouveaux salariés. Première question trop large : « Comment réussir l’intégration ? ». Question plus située : « Comment les nouveaux salariés décrivent-ils l’usage du guide d’accueil dans l’équipe étudiée ? ». Cette dernière oriente vers un terrain, une population et un type de matériau. Elle ne permet pas, seule, de mesurer l’effet du guide sur la performance.

## Aligner objectifs et méthode
Pour chaque objectif, écris ce que tu observeras et comment tu l’analyseras. Si un objectif n’a aucun matériau associé, modifie-le ou retire-le. Si tu recueilles des informations qui ne servent aucun objectif, interroge leur nécessité. Garde cette petite matrice avec le protocole.

## Préparer la validation
Présente à ton encadrant une page contenant le contexte, la question, deux ou trois objectifs, les sources déjà lues et les limites d’accès. Demande un retour précis sur le périmètre et la méthode avant de développer un long plan.`,scholar],
['protocole-recherche','Écrire un protocole de recherche cohérent','Relie chaque choix de recueil et d’analyse à la question du projet.','Méthodologie',
`## Décrire le travail avant de le réaliser
Le protocole explique ce que tu prévois de faire et pourquoi. Il présente la question, les objectifs, le dispositif, les matériaux ou participants, le recueil, l’analyse et les limites anticipées. Il ne doit pas raconter des résultats qui n’existent pas encore. Sépare les choix déjà validés des éléments encore à discuter.

## Rendre chaque choix explicite
Décris les critères d’inclusion, le recrutement ou la constitution du corpus. Indique où et quand le recueil aura lieu, avec quel outil et selon quelles conditions. Pour l’analyse, précise le lien avec les objectifs : « analyser les données » est insuffisant. Explique les variables, catégories ou comparaisons prévues à un niveau adapté à ton cursus.

## Exemple de matrice
| Objectif | Matériau nécessaire | Recueil | Analyse prévue |
|---|---|---|---|
| Comprendre une expérience | Récits contextualisés | Entretiens autorisés | Comparaison de thèmes |
| Décrire une répartition | Observations définies | Grille de recueil | Effectifs et proportions |

Ces lignes illustrent une logique ; elles ne constituent pas un protocole validé et ne déterminent pas un effectif suffisant.

## Prévoir les protections et les imprévus
Discute les autorisations, l’information des participants et la gestion des données avec les personnes responsables dans ton établissement. Prévois ce qui se passera si l’accès au terrain est retardé ou si une variable est inexploitable. Ces décisions peuvent changer le calendrier et la question elle-même.

## Garder les versions
Date le protocole et conserve les modifications accompagnées de leur justification. Une adaptation pendant le travail doit être expliquée dans le mémoire. Elle ne doit pas être présentée après coup comme un choix prévu dès le départ.`,icmje],
['etude-de-cas','Construire une étude de cas pour un mémoire','Définis le cas, rassemble plusieurs traces et limite la portée des conclusions.','Méthode qualitative',
`## Délimiter le cas
Un cas peut être une organisation, une équipe, un dispositif ou une situation. Il doit avoir des frontières explicites : une période, un espace et une question. Décrire toute une entreprise n’est pas encore une étude de cas. Explique pourquoi ce cas est pertinent pour le problème étudié et ce que tu n’inclus pas.

## Croiser les matériaux
Prépare un tableau indiquant les documents, observations et entretiens disponibles. Pour chaque matériau, note son origine, sa date et sa fonction. Un document de communication présente un point de vue ; une observation est elle aussi située. Le croisement permet de repérer les convergences et les tensions, pas d’effacer les différences entre les sources.

## Exemple fictif
Tu étudies la mise en place d’un outil de suivi dans une association. Les comptes rendus décrivent le projet, les entretiens racontent son appropriation et les observations montrent certains usages. Une contradiction entre ces matériaux constitue une piste d’analyse. Elle ne doit pas être masquée pour rendre le récit plus simple.

## Construire la présentation
Présente d’abord le contexte nécessaire au lecteur, puis les épisodes ou thèmes qui répondent à ta question. Appuie chaque interprétation sur des traces identifiables. Dans une annexe ou un carnet séparé, garde la chaîne qui relie un constat au matériau correspondant, en respectant les protections prévues.

## Discuter la portée
Explique ce que le cas permet de comprendre et quelles conditions semblent importantes. Évite d’en faire une représentation statistique de toutes les organisations. Pour comparer plusieurs cas, définis d’abord des dimensions communes ; ne juxtapose pas simplement plusieurs récits.`,coreq],
['guide-entretien','Préparer un guide d’entretien de recherche','Organise les thèmes et les relances pour recueillir des récits précis.','Entretiens',
`## Partir des objectifs
Pour chaque objectif, choisis un thème et une question ouverte. Une question d’entretien invite à raconter une situation ; elle ne demande pas nécessairement au participant de répondre directement à la problématique scientifique. Évite d’empiler plusieurs sujets dans une seule phrase ou de proposer déjà l’explication attendue.

## Prévoir des relances neutres
Prépare des invitations à préciser le moment, les personnes, les étapes et les difficultés. « Peux-tu raconter un exemple ? » peut aider à passer d’une opinion générale à une expérience située. Une relance ne doit pas mettre des mots dans la bouche de la personne. Accepte aussi qu’un thème prévu ne soit pas pertinent pour elle.

## Exemple fictif de reformulation
Question orientée : « Le nouveau dispositif vous aide beaucoup, n’est-ce pas ? ». Proposition plus ouverte : « Racontez une situation où vous avez utilisé ce dispositif. » Puis : « Qu’est-ce qui a facilité ou compliqué son utilisation ? ». La seconde version laisse une place aux expériences positives, négatives et ambivalentes.

## Organiser l’ouverture et la clôture
Présente le cadre, les usages prévus des données et les modalités convenues avec ton établissement. Vérifie l’accord concernant l’enregistrement lorsque tu en utilises un. Termine par une question ouverte permettant d’ajouter un point important. Consigne ensuite tes notes de contexte en séparant observation et interprétation.

## Tester avant le recueil
Fais un entretien pilote dans les conditions autorisées. Repère les questions mal comprises, les répétitions et le temps nécessaire. Documente les modifications. La grille COREQ aide à penser les informations à rendre explicites dans un compte rendu qualitatif ; elle ne certifie pas automatiquement ton dispositif.`,coreq]
];

export const researchGuides=drafts.map(([slug,heading,lead,category,body,source])=>({slug:'guides/'+slug,title:heading,heading,lead,description:lead,category,kind:'guide',intent:'general',updatedAt:'2026-09-11',checklist:['Partir de ta question et des consignes reçues','Conserver les références réellement consultées','Garder une trace des choix et des limites'],related:slug==='fiche-lecture'?['guides/lire-article-scientifique','guides/revue-litterature']:['guides/fiche-lecture','guides/revue-litterature'].filter(s=>s!=='guides/'+slug),body:body+'\n\n## Pour approfondir\n\n[Consulter la ressource de référence]('+source+'). Les exercices de ce guide sont des propositions de travail Soutenance Pro, à adapter à ton projet et à ton encadrant.'}));
