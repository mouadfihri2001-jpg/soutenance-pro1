// Original teaching resources. Sample organisations, situations and wording are fictional.
// The linked institutional pages illustrate their own requirements, not universal rules.
export const libraryPages = [
  {
    slug: 'pfe', category: 'Projet de fin d’études', kind: 'parcours', intent: 'general',
    title: 'PFE : construire son projet de fin d’études, du sujet à la soutenance',
    description: 'Une méthode pour préparer ton PFE : cadrage du sujet, question, livrables, sources, plan et calendrier. Des exemples et des guides gratuits.',
    heading: 'Un PFE solide commence par une question réalisable.',
    lead: 'Choisis un périmètre que tu peux traiter, prépare les preuves de ton travail et avance avec des étapes vérifiables.',
    updatedAt: '2026-09-11', readingMinutes: 4,
    keywords: ['pfe', 'projet de fin études', 'sujet', 'méthodologie', 'Maroc', 'Algérie'],
    checklist: ['Le sujet et les attentes du diplôme', 'Les ressources réellement accessibles', 'Un livrable et des critères de réussite', 'Un calendrier avec des validations'],
    related: ['pfe-ispits', 'rapport-de-stage', 'soutenance'],
    body: `
## Qu’est-ce qu’un PFE, concrètement ?

Le projet de fin d’études permet de mobiliser les connaissances de ta formation dans un travail délimité. Selon la filière, il peut s’agir d’une enquête, d’un prototype, d’un diagnostic ou d’une étude documentaire. Avant de chercher un titre impressionnant, précise ce que tu dois produire et la façon dont ce travail sera évalué.

L’[ENCG Marrakech présente son stage professionnel](https://www.uca.ma/encg/fr/page/professionnalisation-des-competences) comme une mise en pratique des connaissances, associée à un PFE, un rapport et une soutenance. Cet exemple décrit son parcours : ton établissement peut demander une organisation différente.

## Réduis le sujet sans perdre son intérêt

Un sujet large semble offrir plus de possibilités, mais il rend la collecte et l’analyse difficiles. Pour le cadrer, complète quatre phrases : je travaille sur ce problème ; dans ce contexte ; à partir de ces ressources ; pour produire ce résultat vérifiable. Si une phrase reste vague, le périmètre mérite encore une discussion.

Voici un exemple fictif, sans entreprise ni données réelles :

| Point à préciser | Première idée | Cadrage plus exploitable |
| --- | --- | --- |
| Thème | La transformation numérique | Le suivi des demandes dans un service |
| Problème | L’organisation manque d’efficacité | Les étapes de traitement sont difficiles à retrouver |
| Travail prévu | Créer une solution complète | Décrire le circuit et réaliser un prototype de suivi |
| Vérification | Le projet fonctionne | Tester des scénarios définis et consigner les limites |

Une étude en santé demandera d’autres choix de méthode et d’accès aux données. Le [parcours PFE ISPITS](/pfe-ispits) détaille ce cas. Ne transpose pas automatiquement le protocole d’un prototype à une enquête auprès de personnes.

## Prépare une fiche de cadrage d’une page

Note la question centrale, l’objectif, les livrables, les ressources nécessaires et les contraintes. Ajoute une rubrique « hors périmètre ». Elle indique ce que tu ne vas pas traiter : un autre service, une comparaison inaccessible ou une fonctionnalité qui demanderait un travail supplémentaire.

Prévois également les éléments permettant d’étayer la conclusion. Un prototype se présente avec des essais ; une enquête avec une méthode et des observations ; une analyse documentaire avec des critères de sélection des sources. Décrire une réalisation ne démontre pas automatiquement son utilité.

## Construis le plan autour du raisonnement

Commence par expliquer le contexte et le problème. Présente ensuite les connaissances utiles, la démarche choisie, ce que tu as réalisé ou observé, puis l’interprétation et les limites. Les intitulés des parties peuvent changer selon ton guide, mais le lecteur doit comprendre comment la conclusion découle du travail.

Pour chaque section, inscris une question à résoudre et les documents disponibles. Une partie intitulée « Résultats » sans observations ni essais indique une étape de travail manquante ; elle ne doit pas être remplie avec des chiffres inventés. Conserve les références des publications et distingue les informations documentées de tes propres hypothèses.

## Organise les validations avant la date de dépôt

Travaille à rebours depuis la remise. Réserve des périodes distinctes pour les corrections de fond, la vérification des références, les exports et l’oral. Fixe des livrables intermédiaires : fiche de cadrage, plan commenté, méthode, premier résultat analysable et version complète.

À chaque échange avec ton encadrant, relève trois éléments : la décision prise, la modification attendue et la prochaine échéance. Un accord oral sur le thème n’est pas nécessairement un accord sur le protocole ou sur le plan final.

Vérifie aussi les pièces administratives. En Algérie, la [faculté des sciences économiques, commerciales et de gestion de l’Université Ibn Khaldoun de Tiaret](https://fsecsg.univ-tiaret.dz/domaine.php) met à disposition des modèles de page de garde pour licence et master, un formulaire de stage et une autorisation de dépôt du mémoire à la bibliothèque. Cet exemple concerne cette faculté : consulte la page de ton propre département pour récupérer les documents applicables à ta formation, puis ajoute-les à ta liste de remise.

## Que faire aujourd’hui ?

Rédige ta fiche de cadrage, liste ce qui manque et choisis une seule étape à terminer. Si le travail vient d’un stage, commence par le [guide du rapport de stage](/rapport-de-stage). Si le manuscrit est déjà avancé, prépare le fil de ta [soutenance](/soutenance). La [bibliothèque](/bibliotheque) reste accessible pour consulter les méthodes sans créer de compte.
`
  },
  {
    slug: 'rapport-de-stage', category: 'Rapport de stage', kind: 'parcours', intent: 'general',
    title: 'Rapport de stage : méthode, plan et exemples pour analyser ses missions',
    description: 'Rédige un rapport de stage à partir de tes missions réelles : journal de bord, analyse, preuves, plan, introduction et vérification avant dépôt.',
    heading: 'Transforme ton expérience de stage en un rapport argumenté.',
    lead: 'Explique ce que tu as fait, comment tu l’as fait et ce que tu peux en retenir, avec des traces de travail précises.',
    updatedAt: '2026-09-11', readingMinutes: 4,
    keywords: ['rapport de stage', 'missions', 'analyse', 'plan', 'introduction', 'bilan'],
    checklist: ['Le guide et la grille d’évaluation', 'Les missions effectivement réalisées', 'Les documents utilisables dans le rapport', 'Un bilan distinct de la description'],
    related: ['guides/plan-rapport-de-stage', 'guides/introduction-rapport-de-stage', 'soutenance'],
    body: `
## Un rapport ne se limite pas au récit des journées

Le lecteur cherche à comprendre ton environnement, ton rôle et les enseignements de ton expérience. Une succession de dates décrit le déroulement du stage, mais n’explique pas forcément tes choix. Organise plutôt le texte autour des missions, des difficultés rencontrées et des moyens utilisés pour y répondre.

Commence par les attentes de ta formation. Un stage d’observation et un stage chargé d’une mission de projet ne conduisent pas au même niveau d’analyse. Les [consignes de Polytech Lyon](https://moodle.univ-lyon1.fr/course/section.php?id=45846&lang=fr) distinguent notamment les documents de suivi et le rapport final. Elles rappellent aussi que les consignes pédagogiques de la filière restent déterminantes.

## Rassemble tes éléments avant de rédiger

Prépare un journal de bord avec la date, l’activité, ton niveau de participation, l’outil utilisé et une trace possible. Différencie « j’ai observé », « j’ai contribué » et « j’ai réalisé ». Cette distinction permet d’attribuer correctement le travail de l’équipe et ton apport personnel.

Une trace peut être un tableau anonymisé, une procédure commentée, un schéma que tu as créé ou une version autorisée d’un livrable. Demande au tuteur quels éléments peuvent être diffusés. Une capture d’écran avec des identifiants de clients n’est pas nécessaire pour expliquer une méthode de classement.

## Passe de la tâche à l’analyse

L’exemple ci-dessous est fictif : il illustre une manière de décrire une mission, sans affirmer qu’elle a été effectuée.

| Niveau de rédaction | Exemple commenté |
| --- | --- |
| Tâche | J’ai participé au classement de demandes reçues par le service. |
| Méthode | J’ai regroupé les demandes selon leur étape de traitement à partir des catégories convenues avec le tuteur. |
| Élément vérifiable | Une grille de classement et une notice d’utilisation peuvent montrer l’organisation proposée. |
| Limite | Sans suivi après utilisation, je ne peux pas conclure à une réduction des délais. |

Applique ce raisonnement à chaque mission importante : objectif, démarche, résultat disponible, difficulté et apprentissage. Un livrable remis constitue un résultat concret. Une amélioration supposée reste une hypothèse tant qu’elle n’a pas été observée ou mesurée.

## Choisis les informations utiles sur l’organisme

Présente seulement ce qui aide à comprendre tes missions : activité, public, organisation du service et place de ton poste. Si un historique ne contribue pas à l’analyse, raccourcis-le. Pour les informations reprises du site de l’organisme ou d’un document interne, indique la source et vérifie leur actualité.

Un organigramme devient utile lorsqu’il éclaire les interlocuteurs et les responsabilités rencontrés pendant le stage. Ne reproduis pas toute la présentation commerciale de l’entreprise pour remplir une partie du rapport.

## Donne une fonction précise à chaque partie

L’introduction situe le stage et annonce l’angle du rapport. Le développement présente les missions et leur analyse. Le bilan revient sur les compétences travaillées, les difficultés et les limites. La conclusion répond au fil directeur et expose ce que l’expérience change dans ta compréhension du métier.

Le [plan commenté](/guides/plan-rapport-de-stage) t’aide à organiser ces éléments. Tu peux aussi [télécharger sa trame Word](/modeles/plan-rapport-stage.docx), puis la modifier selon ton guide. Le modèle contient des indications de travail, pas un stage déjà rédigé à déposer.

## Vérifie le document en trois passages

Relis d’abord le fond : chaque mission annoncée est-elle expliquée ? Les affirmations sur les résultats sont-elles justifiées ? Vérifie ensuite les références, les annexes et les renvois. Termine par la présentation : titres hiérarchisés, tableaux lisibles, pagination et sommaire actualisé.

Ouvre enfin le fichier exporté sur un autre écran. Contrôle les tableaux coupés, les pages blanches et les légendes séparées de leurs figures. Pour retravailler le début du texte, utilise l’[exemple d’introduction commenté](/guides/introduction-rapport-de-stage) plutôt qu’une formule générale à recopier.
`
  },
  {
    slug: 'soutenance', category: 'Soutenance', kind: 'parcours', intent: 'general',
    title: 'Soutenance : préparer son oral, ses diapositives et les questions du jury',
    description: 'Organise ta préparation de soutenance : attentes du jury, argumentation, questions difficiles, répétitions utiles et checklist Word avant le jour J.',
    heading: 'Fais comprendre ton travail, sans réciter le rapport.',
    lead: 'Sélectionne les messages qui montrent ta démarche et prépare des réponses précises sur tes choix, tes résultats et leurs limites.',
    updatedAt: '2026-09-11', readingMinutes: 4,
    keywords: ['soutenance', 'oral', 'jury', 'questions', 'préparation', 'répétition'],
    checklist: ['La durée exacte de l’exposé', 'Trois messages à retenir', 'Des résultats lisibles et vérifiables', 'Une répétition chronométrée'],
    related: ['guides/presentation-soutenance-pfe', 'pfe', 'rapport-de-stage'],
    body: `
## Définis ce que le jury doit retenir

Une soutenance présente le raisonnement qui relie ton problème, ta démarche et tes conclusions. Écris d’abord trois phrases : ce que j’ai cherché à comprendre, ce que j’ai fait et ce que le travail permet de retenir. Elles te serviront à vérifier la cohérence de l’exposé et à revenir à l’essentiel pendant les questions.

Rassemble la convocation, la durée de présentation, le temps réservé aux questions et les critères communiqués par ta formation. Repère aussi le matériel disponible, la langue demandée et la manière de transmettre le support. Ces éléments varient : un format trouvé en ligne ne devient pas la règle de ton établissement.

## Prépare un dossier de défense de ton travail

Relis le rapport en repérant les décisions qui pourraient être discutées : choix du terrain, méthode, outil, sources, critères d’analyse ou essais réalisés. Pour chacune, note la raison du choix, l’élément qui le justifie et sa principale limite. Tu constitues ainsi un dossier de préparation, pas un texte à apprendre mot à mot.

Sépare ce que tu as réalisé personnellement, ce que l’équipe a produit et ce que les publications apportent. Prépare les pages ou annexes utiles pour retrouver une précision. Un document disponible en réserve peut répondre à une question sans encombrer l’exposé principal.

## Choisis le bon point de départ

Ta préparation dépend de ce qui reste fragile dans ton travail.

| Ta situation | La prochaine action | Le signe que tu peux avancer |
| --- | --- | --- |
| Le rapport est terminé, mais le message reste flou | Expliquer le travail en quelques phrases à une autre personne | Elle peut reformuler la question et la conclusion |
| Le contenu est clair, mais le support manque | Sélectionner les éléments qui nécessitent un schéma ou un graphique | Chaque support a une fonction dans le raisonnement |
| Tu dépasses la durée | Repérer les explications secondaires pendant une répétition | Le fil complet tient dans le temps accordé |
| Les questions te déstabilisent | Justifier les décisions principales avec leurs limites | Tu peux répondre sans inventer une certitude |

Pour construire le support lui-même, passe au [guide PowerPoint de soutenance PFE](/guides/presentation-soutenance-pfe). Il contient un découpage commenté de dix minutes et des conseils pour présenter les résultats. Le présent parcours se concentre sur la préparation générale et l’échange avec le jury.

## Réponds à une objection avec une justification et une limite

L’exemple suivant est fictif et ne décrit aucune enquête réalisée.

**Question :** « Votre grille de suivi améliore-t-elle vraiment le fonctionnement du service ? »

**Réponse à éviter :** « Oui, elle améliore forcément l’efficacité. » Cette affirmation dépasse ce qui a été vérifié.

**Réponse plus précise :** « Le travail a abouti à une grille et à des essais sur des situations prévues. Je n’ai pas mesuré le temps de traitement après déploiement. Pour évaluer cet effet, il faudrait définir un indicateur et suivre son évolution dans les conditions réelles d’utilisation. »

La réponse distingue la réalisation, la preuve disponible et la vérification manquante. Applique cette logique à ton propre travail. Si la question est ambiguë, reformule-la avant de répondre. Si tu ne connais pas une information, indique ce qui manque plutôt que d’improviser une référence ou un chiffre.

## Donne un objectif à chaque répétition

L’[Université Laval conseille notamment de maîtriser le contenu, de se chronométrer et de vérifier le matériel](https://www.ulaval.ca/espace-etudiant/services-et-ressources/le-trac-comment-mieux-lapprivoiser). Applique ces points à ton propre exposé : fais une répétition entière, note les passages trop longs et teste le fichier exporté.

Consacre une répétition à la clarté, une autre au temps et une troisième aux questions. Demande un retour précis : à quel moment le raisonnement devient-il difficile à suivre ? Quel terme demande une explication ? Quelle conclusion semble insuffisamment étayée ? Corrige ces points au lieu de refaire seulement le design.

## Vérifie les éléments pratiques

Prévois une copie PDF du support et garde les fichiers nécessaires à une démonstration. Prépare une explication de remplacement si celle-ci ne démarre pas. Retrouve le lieu, l’horaire et les modalités de remise dans les informations officielles de ta formation. La [checklist Word de préparation](/modeles/checklist-soutenance.docx) permet de suivre ces vérifications et de noter les points restant à travailler.
`
  },
  {
    slug: 'guides/plan-rapport-de-stage', category: 'Plan et structure', kind: 'guide', intent: 'general',
    title: 'Plan de rapport de stage : exemple commenté et modèle Word',
    description: 'Construis un plan de rapport de stage cohérent : rôle de chaque partie, sous-sections commentées, variantes selon la mission et trame Word gratuite.',
    heading: 'Un plan qui montre ce que ton stage t’a appris.',
    lead: 'Pars d’une structure commentée, puis adapte chaque partie aux missions et aux documents dont tu disposes réellement.',
    updatedAt: '2026-09-11', readingMinutes: 4,
    keywords: ['plan rapport de stage', 'sommaire', 'Word', 'structure', 'annexes'],
    checklist: ['Les rubriques imposées par la formation', 'Les missions à analyser en priorité', 'Les éléments disponibles pour chaque partie', 'Les annexes appelées dans le texte'],
    related: ['rapport-de-stage', 'guides/introduction-rapport-de-stage', 'soutenance'],
    body: `
## Commence par une structure de travail

Le plan t’aide à décider quelles informations présenter, dans quel ordre et pour quelle raison. Avant la rédaction, donne à chaque sous-partie un titre provisoire et une phrase qui décrit son contenu attendu. Si deux rubriques annoncent la même explication, rapproche-les ou distingue mieux leur fonction.

La trame ci-dessous est une proposition éditoriale, pas un règlement universitaire. Les [directives de Polytech Lyon](https://moodle.univ-lyon1.fr/course/section.php?id=45846&lang=fr) illustrent l’existence d’exigences propres à une formation, notamment sur la présentation et les annexes. Utilise en priorité les consignes de ton établissement et les corrections de ton encadrant.

## Avant le développement

La page de garde identifie le travail : titre, nom, formation, organisme, encadrement et période selon les éléments demandés. Les remerciements restent courts et correspondent à des contributions réelles. Le sommaire rend visible la structure ; les listes de figures, de tableaux et d’abréviations ne sont utiles que si le document en a besoin.

Dans l’introduction, situe le stage, présente son objectif et annonce l’angle choisi. Réserve l’historique détaillé ou l’explication des outils aux parties concernées. L’[exemple d’introduction](/guides/introduction-rapport-de-stage) montre comment passer d’un début vague à un cadrage précis.

## Chapitre 1 — Comprendre le cadre du stage

### 1.1 L’activité et le contexte de l’organisme

Présente l’activité nécessaire pour comprendre tes missions. Une caractéristique mérite sa place si elle a influencé le travail : type de demandes, organisation des services, contraintes ou outils disponibles. Indique la provenance des informations que tu n’as pas établies toi-même.

### 1.2 Le service d’accueil et ta place

Explique les interlocuteurs, le circuit de travail et ton rôle. Un schéma simple peut montrer les échanges utiles. Distingue les responsabilités permanentes du service des tâches confiées pendant ton stage.

### 1.3 Les objectifs de la mission

Précise la demande initiale, les livrables attendus et les limites du périmètre. Si la mission a changé, indique ce changement et son incidence sur le rapport.

## Chapitre 2 — Présenter les missions et la démarche

### 2.1 Les ressources et les outils mobilisés

Décris leur utilité pour la mission. Une liste de noms de logiciels ne montre pas comment tu as travaillé. Explique la fonction utilisée, les informations traitées et les choix de méthode.

### 2.2 Le déroulement des missions principales

Pour chaque mission, relie l’objectif, les étapes, les difficultés et les solutions essayées. L’ordre peut être chronologique lorsqu’une étape conditionne la suivante ; il peut être thématique si plusieurs activités indépendantes doivent être analysées.

### 2.3 Les livrables et observations

Présente les éléments disponibles : schéma, procédure, prototype, tableau ou observations autorisées. Explique ce qu’ils montrent et ce qu’ils ne permettent pas de conclure.

## Chapitre 3 — Analyser l’expérience

### 3.1 Le bilan de la mission

Compare les objectifs aux réalisations. Signale les livrables terminés, les tâches incomplètes et les contraintes qui ont pesé sur le travail, sans inventer une mesure d’impact.

### 3.2 Les compétences travaillées

Associe chaque compétence à une situation précise. « J’ai développé mon autonomie » devient plus clair quand tu expliques quelle tâche tu peux désormais conduire, avec quel contrôle et quelles limites.

### 3.3 Les limites et les pistes d’amélioration

Présente des propositions reliées à l’analyse. Une recommandation doit répondre à une difficulté décrite ; elle ne remplace pas un résultat absent.

## Conclusion, références et annexes

La conclusion reprend la réponse au fil directeur et l’apport du stage. La bibliographie rassemble les sources citées. Les annexes accueillent les éléments complémentaires auxquels le texte renvoie : chaque annexe possède un titre et une fonction identifiable.

Pour un stage d’observation, donne plus de place à la compréhension argumentée des pratiques. Pour une mission de conception, développe la justification des choix et les essais. [Télécharge le plan modifiable en Word](/modeles/plan-rapport-stage.docx), supprime les rubriques inutiles et remplace les indications par tes éléments réels avant de faire valider la structure.
`
  },
  {
    slug: 'guides/introduction-rapport-de-stage', category: 'Rédaction', kind: 'guide', intent: 'general',
    title: 'Introduction de rapport de stage : méthode et exemple avant/après',
    description: 'Rédige une introduction précise : contexte, mission, objectif et annonce du plan. Compare un exemple fictif avant/après avec ses corrections expliquées.',
    heading: 'Une introduction qui situe ton stage dès les premières lignes.',
    lead: 'Donne au lecteur les informations nécessaires pour comprendre la mission et le fil de ton rapport, sans promesse vague ni résultat inventé.',
    updatedAt: '2026-09-11', readingMinutes: 4,
    keywords: ['introduction rapport de stage', 'exemple', 'annonce du plan', 'contexte', 'objectif'],
    checklist: ['Une formation et une période exactes', 'Un organisme et un service identifiés', 'Une mission formulée avec précision', 'Un plan conforme au rapport rédigé'],
    related: ['guides/plan-rapport-de-stage', 'rapport-de-stage', 'pfe'],
    body: `
## À quoi sert l’introduction ?

L’introduction donne les repères nécessaires pour entrer dans le rapport : le cadre de formation, le lieu et la période du stage, la mission principale et l’angle d’analyse. Elle prépare la lecture sans raconter toutes les tâches ni résumer chaque résultat.

Rédige une première version pour clarifier le travail, puis reviens-y lorsque le développement est stabilisé. Cette relecture permet d’annoncer les missions réellement traitées et le plan effectivement suivi. Le nombre de lignes et la présence d’une problématique formelle dépendent des consignes reçues ; aucune longueur unique ne convient à tous les stages.

## Avant : un début qui pourrait convenir à n’importe quel stage

Les deux textes ci-dessous sont des exemples fictifs rédigés pour ce guide. L’organisme, la période et les missions ne décrivent aucun stage réel.

> Dans un monde en constante évolution, le stage représente une étape très importante pour les étudiants. J’ai effectué un stage dans une entreprise dynamique où j’ai appris beaucoup de choses. Cette expérience enrichissante m’a permis de développer mes compétences. Dans ce rapport, je présenterai l’entreprise puis les tâches effectuées.

Le problème n’est pas le ton positif. Le lecteur ignore encore la formation, le service, la durée et le travail analysé. Les expressions « beaucoup de choses » et « développer mes compétences » ne donnent aucune information vérifiable. L’annonce du plan reste trop générale pour faire apparaître un fil directeur.

## Après : un cadrage plus précis

> Dans le cadre d’une licence en gestion, j’ai réalisé un stage de six semaines au sein du service administratif d’Atelier Sillage, organisme fictif utilisé dans cet exemple. Ma participation a porté sur l’organisation des demandes reçues par le service et sur la préparation d’une grille de suivi. L’objectif était de comprendre le circuit de traitement, puis de proposer une façon de retrouver les étapes d’une demande. Ce rapport examine les choix de classement et les limites de la grille préparée. Il présente d’abord le service et la mission confiée, décrit ensuite la démarche suivie, puis analyse les apports et les difficultés de cette expérience.

Cet exemple fournit un cadre et un objectif sans annoncer une amélioration mesurée qui n’existe pas. Il reste volontairement limité : la grille a été préparée, mais le texte n’affirme ni son déploiement ni un gain de temps. Pour ton propre rapport, conserve uniquement des informations correspondant à ton stage.

## Ce que chaque modification apporte

| Élément ajouté | Utilité pour le lecteur |
| --- | --- |
| Formation et durée | Situer le niveau et le cadre de l’expérience |
| Service d’accueil | Comprendre où se déroule la mission |
| Activité précise | Identifier ce qui sera présenté dans le développement |
| Objectif limité | Comprendre la question pratique qui guide le rapport |
| Annonce des parties | Suivre la progression entre contexte, démarche et analyse |

Tu n’as pas besoin de placer chaque élément dans une phrase séparée. Cherche une progression naturelle. Si ton établissement impose une introduction en un paragraphe, les mêmes fonctions peuvent être réunies sans titres intermédiaires.

## Adapte le raisonnement à ton type de stage

Pour un stage d’observation, indique les pratiques que tu as observées et l’angle de compréhension retenu. Pour un stage avec livrable, précise la demande et ton rôle dans sa réalisation. Pour une mission collective, évite d’attribuer à une seule personne le travail de toute l’équipe.

Une courte consigne donnée pour présenter la mission peut servir de point de départ : [Polytech Lyon demande dans son document de début de stage de décrire l’environnement, la mission et les difficultés éventuelles](https://moodle.univ-lyon1.fr/course/section.php?id=45846&lang=fr). Cette exigence locale illustre des repères utiles ; elle n’impose pas la structure de ton introduction.

## Relis avec cinq questions

Le lecteur sait-il où et dans quel cadre le stage a eu lieu ? La mission principale est-elle compréhensible ? Ton rôle est-il exact ? L’annonce du plan correspond-elle aux titres du rapport ? Une phrase affirme-t-elle un résultat que le développement ne peut pas démontrer ?

Supprime les généralités qui ne répondent à aucune de ces questions. Ne recopie pas l’exemple en changeant uniquement le nom de l’organisme. Prépare ton [plan commenté](/guides/plan-rapport-de-stage), rassemble les faits de ton expérience et rédige une introduction qui leur correspond.
`
  }
];
