import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AlignmentType, Document, ExternalHyperlink, Footer, HeadingLevel,
  ImageRun, PageNumber, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType
} from 'docx';

const SITE = 'https://soutenancepro.com/';
const GREEN = '004D35';
const CREAM = 'F4ECDD';
const TEXT = '25342C';
const BRAND_LOGO = readFileSync(new URL('../public/brand-logo.jpg', import.meta.url));

const paragraph = (text, options = {}) => new Paragraph({
  children: [new TextRun({ text })],
  spacing: { after: 120, line: 276 },
  ...options
});
const heading = text => paragraph(text, { heading: HeadingLevel.HEADING_1 });
const field = (label, prompt) => paragraph(`${label} : [${prompt}]`);
const note = text => new Paragraph({
  children: [new TextRun({ text, color: '56665C', size: 20 })],
  spacing: { after: 160, line: 264 }
});
const check = text => paragraph(`[ ] ${text}`);
const page = title => heading(title);

function table(headers, rows, widths) {
  return new Table({
    width: { size: 9638, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headers, ...rows].map((values, index) => new TableRow({
      tableHeader: index === 0,
      cantSplit: true,
      children: values.map((text, column) => new TableCell({
        width: { size: widths[column], type: WidthType.DXA },
        shading: { fill: index === 0 ? CREAM : 'FFFFFF' },
        margins: { top: 90, bottom: 90, left: 110, right: 110 },
        children: [new Paragraph({
          spacing: { after: 0, line: 252 },
          children: [new TextRun({ text, bold: index === 0, size: 20, color: TEXT })]
        })]
      }))
    }))
  });
}

function document(title, description, pages) {
  const footer = new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: 'Soutenance Pro · Modèle indépendant · ', size: 17, color: '56665C' }),
      new ExternalHyperlink({ link: SITE, children: [new TextRun({ text: SITE, size: 17, color: GREEN })] }),
      new TextRun({ text: ' · ', size: 17 }),
      new TextRun({ children: [PageNumber.CURRENT], size: 17 })
    ]
  })] });
  return new Document({
    creator: 'Soutenance Pro', title, description,
    styles: {
      default: { document: { run: { font: 'Arial', size: 22, color: TEXT }, paragraph: { spacing: { after: 120, line: 276 } } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 46, bold: true, color: '000000' }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 29, bold: true, color: GREEN }, paragraph: { spacing: { before: 200, after: 120 }, keepNext: true, outlineLevel: 0 } }
      ]
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, bottom: 1080, left: 1134, right: 1134, footer: 480 } } },
      footers: { default: footer },
      children: [
        new Paragraph({ children: [new ImageRun({ type: 'jpg', data: BRAND_LOGO,
          transformation: { width: 64, height: 64 },
          altText: { title: 'Soutenance Pro', description: 'Logo de Soutenance Pro', name: 'Soutenance Pro' }
        })], spacing: { after: 100 }, keepNext: true }),
        paragraph(title, { heading: HeadingLevel.TITLE }),
        paragraph(description),
        note('Remplace les champs entre crochets, puis supprime les consignes devenues inutiles. Adapte la structure au guide de ton établissement et aux demandes de ton encadrant. Ce modèle ne constitue pas un document officiel.'),
        ...pages.flatMap((children, index) => index ? [new Paragraph({ pageBreakBefore: true, children: [] }), ...children] : children)
      ]
    }]
  });
}

function internshipOutline() {
  return document('Plan de rapport de stage',
    'Une trame pour organiser un stage réellement effectué, décrire tes missions et analyser ce que tu as appris. Complète chaque rubrique avec des faits, des documents autorisés et tes propres observations.', [
      [
        heading('Informations de couverture'),
        field('Nom et prénom', 'à compléter'),
        field('Établissement et formation', 'nom officiel et niveau'),
        field('Année universitaire', 'année'),
        field('Organisme et service d’accueil', 'nom et service réels'),
        field('Période du stage', 'date de début et date de fin'),
        field('Encadrant pédagogique et tuteur', 'noms et fonctions autorisés'),
        field('Titre du rapport', 'mission ou sujet principal du stage'),
        heading('Introduction'),
        field('Contexte et choix du stage', 'formation suivie et raison du choix de cet organisme'),
        field('Objectif du stage', 'compétence à développer ou problème professionnel observé'),
        field('Organisation du rapport', 'annonce des parties réellement développées'),
        heading('Plan à adapter'),
        ...['1. Organisme et contexte du stage', '2. Missions réalisées et méthodes de travail',
          '3. Analyse des acquis et des difficultés', '4. Conclusion et perspectives',
          'Références et annexes utiles'].map(text => paragraph(text, { spacing: { after: 60, line: 264 } })),
        note('Les remerciements, le résumé et la liste des sigles sont à ajouter seulement si ton guide les demande. Aucun nombre de pages universel ne s’applique.')
      ],
      [
        page('Organisme et contexte du stage'),
        field('Activité de l’organisme', 'activité vérifiée, public ou clients concernés, source et date'),
        field('Place du service', 'rôle du service et liens utiles avec les autres équipes'),
        field('Conditions du stage', 'horaires, outils et contraintes liés à tes missions'),
        note('Cite la provenance des informations institutionnelles. Ne reproduis pas de données confidentielles ou personnelles sans autorisation.'),
        heading('Missions réalisées et méthodes'),
        note('Duplique cette fiche pour chaque mission importante. Distingue ce que tu as réalisé, ce que tu as observé et ce que l’équipe a produit.'),
        field('Mission', 'intitulé précis'),
        field('Besoin de départ', 'demande réelle et résultat attendu'),
        field('Ta contribution', 'tâches effectivement accomplies'),
        field('Méthode et outils', 'étapes suivies, outil utilisé et raison de ce choix'),
        field('Preuve autorisée', 'livrable, journal de bord ou annexe datée et anonymisée'),
        field('Résultat observé', 'résultat vérifiable ou mention explicite de l’absence de mesure'),
        field('Difficulté et réponse', 'obstacle rencontré, aide obtenue, solution et effet constaté'),
        heading('Analyse des acquis'),
        field('Lien avec la formation', 'notion du cours mobilisée et exemple concret'),
        field('Compétence développée', 'ce que tu sais mieux faire et sur quelle preuve tu t’appuies'),
        field('Limites', 'temps, accès aux données ou éléments que tu ne peux pas conclure')
      ],
      [
        page('Conclusion et perspectives'),
        field('Bilan par rapport aux objectifs', 'objectifs atteints, partiellement atteints ou non atteints, avec raisons'),
        field('Apport personnel', 'apprentissage précis et conséquence pour ton projet professionnel'),
        field('Piste d’amélioration', 'proposition réaliste liée à tes observations, sans inventer de résultat'),
        heading('Références et annexes'),
        field('Références consultées', 'auteur ou organisme, titre, date, URL ou autre identifiant selon le style exigé'),
        field('Annexe à joindre', 'numéro, titre, date, provenance et autorisation éventuelle'),
        field('Renvoi dans le rapport', 'passage qui explique l’utilité de cette annexe'),
        note('Les captures, tableaux et documents internes doivent être lisibles, légendés et autorisés. Retire les noms, coordonnées et identifiants qui ne sont pas nécessaires.'),
        heading('Vérification avant dépôt'),
        check('Toutes les missions décrites correspondent à mon stage réel.'),
        check('Chaque résultat chiffré possède une source vérifiable.'),
        check('Mes observations sont distinguées des faits et des interprétations.'),
        check('Les références citées sont présentes dans la bibliographie.'),
        check('Les annexes sont appelées dans le texte et respectent la confidentialité.'),
        check('La numérotation, le sommaire et la pagination ont été actualisés.'),
        check('Le fichier final respecte le guide de mon établissement.'),
        field('Dernière relecture', 'date et corrections à terminer')
      ]
    ]);
}

function defenseChecklist() {
  return document('Checklist de préparation à la soutenance',
    'Un support pour préparer ton exposé, répéter avec un chronomètre et vérifier le matériel. Il convient à un PFE, un mémoire ou un rapport de stage, après adaptation aux règles de ton établissement.', [
      [
        heading('Cadre de la présentation'),
        field('Nom et sujet', 'à compléter'),
        field('Date et lieu', 'date, salle ou lien de visioconférence'),
        field('Durée autorisée de l’exposé', 'consigne officielle en minutes'),
        field('Temps consacré aux questions', 'consigne officielle ou information à confirmer'),
        field('Consignes particulières', 'format, nombre éventuel de diapositives et matériel'),
        heading('Répartition du temps à personnaliser'),
        note('Exemple indicatif pour un exposé de 10 minutes. Ces durées ne sont pas une règle universelle. Modifie-les selon ta durée autorisée, ton travail et les attentes du jury.'),
        table(['Séquence', 'Exemple', 'Mon temps'], [
          ['Sujet et question de départ', '1 min', '[durée]'],
          ['Contexte et objectif', '1 min', '[durée]'],
          ['Méthode ou missions', '2 min', '[durée]'],
          ['Résultats et analyse', '4 min', '[durée]'],
          ['Limites et conclusion', '2 min', '[durée]'],
          ['Total', '10 min', '[total à vérifier]']
        ], [5600, 1650, 2388]),
        paragraph('', { spacing: { after: 0, line: 100 } }),
        heading('Message à faire retenir'),
        field('Idée centrale', 'une phrase précise qui résume ce que ton travail apporte'),
        field('Trois preuves à montrer', 'résultats ou réalisations réels et source de chacun'),
        field('Conclusion', 'réponse à la question, limite importante et perspective réaliste')
      ],
      [
        page('Contenu et diapositives'),
        check('Je présente une question et un objectif compréhensibles.'),
        check('Je peux expliquer ma méthode et justifier mes choix.'),
        check('Les chiffres, graphiques, images et citations ont une source vérifiée.'),
        check('Les données personnelles et confidentielles sont retirées ou autorisées.'),
        check('Chaque diapositive sert un message et reste lisible à distance.'),
        check('Je distingue les résultats obtenus de mes interprétations.'),
        check('Je présente les limites sans exagérer la portée du travail.'),
        heading('Répétition et questions'),
        check('J’ai répété à voix haute avec un chronomètre et testé les transitions.'),
        field('Durée mesurée', 'essai 1 et essai 2, avec dates'),
        field('Passage à raccourcir', 'diapositive et modification prévue'),
        field('Question probable du jury', 'question liée au choix de méthode ou à une limite'),
        field('Éléments de réponse', 'preuve, référence ou reconnaissance de ce qui reste inconnu'),
        check('Je sais où retrouver les annexes utiles pendant les échanges.'),
        heading('Matériel et jour de la soutenance'),
        check('Le PowerPoint et une copie PDF ont été ouverts sur le matériel prévu.'),
        check('Les polices, vidéos, liens et graphiques fonctionnent hors connexion si nécessaire.'),
        check('Une sauvegarde distincte, le chargeur et les adaptateurs sont prêts.'),
        check('La salle, l’horaire et les modalités de connexion sont confirmés.'),
        field('Points restant à régler', 'action, responsable et échéance')
      ]
    ]);
}

function readingSheet() {
  return document('Fiche de lecture et de vérification de source',
    'Une fiche par document effectivement consulté. Elle t’aide à retrouver la source, à séparer ses résultats de ton analyse et à préparer une citation fidèle avant la rédaction.', [
      [
        heading('Identification du document'),
        field('Auteur ou organisme', 'nom exact et ordre des auteurs'),
        field('Année et titre', 'titre complet et date de publication'),
        field('Revue ou éditeur', 'revue, volume, numéro et pages si disponibles'),
        field('DOI', 'identifiant vérifié ou non disponible'),
        field('URL consultée', 'adresse exacte de la page ou du document'),
        field('Date de consultation', 'jour, mois et année'),
        field('Type de document', 'article, livre, rapport, recommandation ou autre'),
        field('Document réellement lu', 'texte intégral, chapitre, pages ou résumé seulement'),
        heading('Question et méthode'),
        field('Question traitée', 'objectif de la source en tes propres mots'),
        field('Contexte et population', 'lieu, période, participants et critères si précisés'),
        field('Méthode', 'type d’étude, recueil et analyse tels que décrits'),
        field('Résultats principaux', 'constats pertinents, chiffres exacts et pages correspondantes'),
        field('Limites annoncées', 'limites mentionnées par les auteurs et leur emplacement'),
        note('Si une information est absente ou si tu n’as lu que le résumé, indique-le. Ne complète pas la méthode ou les résultats par supposition.')
      ],
      [
        page('Extrait consulté et reformulation'),
        field('Extrait exact', 'courte citation recopiée fidèlement entre guillemets'),
        field('Emplacement', 'page, paragraphe, section ou horodatage vérifiable'),
        field('Reformulation personnelle', 'même idée avec tes mots, sans modifier son sens'),
        field('Citation dans le texte', 'appel de référence selon APA, Vancouver ou le style demandé'),
        note('Une reformulation exige aussi une référence. Vérifie les conditions de réutilisation avant de reproduire une figure, un tableau ou un long extrait.'),
        heading('Ton commentaire et l’usage prévu'),
        field('Apport pour ton sujet', 'lien précis avec ta question de recherche'),
        field('Ton commentaire', 'interprétation personnelle, clairement séparée de celle des auteurs'),
        field('Comparaison à une autre source', 'accord ou désaccord et référence vérifiée'),
        field('Partie du mémoire concernée', 'chapitre et argument à soutenir'),
        field('Limite de réutilisation', 'différence de population, de contexte ou de méthode'),
        heading('Contrôle avant citation'),
        check('Le titre, les auteurs, l’année et le DOI ou l’URL correspondent au document.'),
        check('L’extrait et les chiffres ont été comparés au passage original.'),
        check('L’article ne fait pas l’objet d’une correction ou d’un retrait que j’aurais ignoré.'),
        check('Les résultats sont présentés dans leur contexte, sans causalité ajoutée.'),
        check('La référence finale respecte le style exigé et apparaît dans ma bibliographie.'),
        field('Référence bibliographique finale', 'notice complète à vérifier manuellement')
      ]
    ]);
}

function researchBrief() {
  return document('Fiche de cadrage du mémoire',
    'Un document de travail pour transformer un thème en question précise, vérifier la faisabilité du projet et préparer un échange utile avec ton encadrant.', [
      [
        heading('Identité du projet'),
        field('Étudiant, formation et niveau', 'à compléter'),
        field('Encadrant et établissement', 'à compléter'),
        field('Version et date', 'numéro de version et date de mise à jour'),
        field('Date de dépôt prévue', 'échéance officielle à confirmer'),
        heading('Du thème à la question'),
        field('Titre provisoire', 'objet étudié, population et contexte, sans annoncer un résultat'),
        field('Constat de départ', 'fait précis et référence ou observation datée qui le soutient'),
        field('Ce que les travaux consultés établissent', 'deux ou trois résultats pertinents et leurs sources'),
        field('Ce qui reste à comprendre', 'point non résolu dans la population ou le contexte choisi'),
        field('Question de recherche', 'une question à laquelle les données prévues permettront de répondre'),
        field('Objectif principal', 'ce que tu veux décrire, comparer, comprendre ou étudier'),
        note('La lacune doit découler des sources consultées. Une étude transversale étudie des associations ; elle ne suffit pas à établir une relation causale.')
      ],
      [
        page('Périmètre et méthode envisagée'),
        field('Population ou corpus', 'personnes, documents ou situations concernés et critères de sélection'),
        field('Lieu et période', 'terrain accessible et période de recueil prévue'),
        field('Devis envisagé', 'quantitatif, qualitatif, mixte ou documentaire ; justification'),
        field('Hypothèses, si pertinentes', 'propositions cohérentes avec la question et le devis'),
        table(['Objectif secondaire', 'Données nécessaires', 'Recueil et analyse envisagés'], [
          ['[objectif 1]', '[variable, thème ou document]', '[outil, méthode et justification]'],
          ['[objectif 2]', '[variable, thème ou document]', '[outil, méthode et justification]'],
          ['[objectif 3, si utile]', '[variable, thème ou document]', '[outil, méthode et justification]']
        ], [2900, 3200, 3538]),
        heading('Faisabilité et précautions'),
        field('Accès au terrain ou au corpus', 'personne à contacter, autorisation et état réel de la démarche'),
        field('Participants et recrutement', 'modalité envisagée et justification de l’effectif à discuter'),
        field('Protection des personnes et des données', 'information, consentement, anonymisation et stockage selon le cadre applicable'),
        field('Contraintes et solution de repli', 'délai, accès, outil ou compétence manquante et option réaliste'),
        note('Les démarches d’autorisation dépendent de ton établissement et de ton terrain. Valide-les avant de recruter ou de recueillir des données ; ne mentionne jamais un accord non obtenu.')
      ],
      [
        page('Calendrier et décisions avec l’encadrant'),
        table(['Étape', 'Livrable vérifiable', 'Échéance'], [
          ['Cadrage', '[question et périmètre discutés]', '[date]'],
          ['Revue de littérature', '[stratégie de recherche et matrice renseignées]', '[date]'],
          ['Protocole et autorisations', '[outils relus et accords requis obtenus]', '[date]'],
          ['Recueil', '[données ou corpus disponibles]', '[date]'],
          ['Analyse', '[résultats documentés et limites explicitées]', '[date]'],
          ['Rédaction et dépôt', '[version relue selon le guide]', '[date]']
        ], [2450, 4850, 2338]),
        heading('Questions à trancher'),
        field('Décision attendue', 'question précise à soumettre à l’encadrant'),
        field('Retour reçu', 'date, formulation du retour et document concerné'),
        field('Prochaine action', 'action concrète, responsable et date'),
        heading('Contrôle avant validation'),
        check('La question, l’objectif et la méthode portent sur le même problème.'),
        check('Les références citées ont été consultées et vérifiées.'),
        check('Le terrain, le délai et les ressources rendent le projet réalisable.'),
        check('Les autorisations nécessaires sont identifiées et leur état est exact.'),
        check('Les formulations respectent ce que le devis permet de conclure.'),
        field('Statut du cadrage', 'à discuter, à réviser ou validé par l’encadrant, avec date')
      ]
    ]);
}

function literatureMatrix() {
  return document('Matrice de revue de littérature',
    'Un ensemble de tableaux à compléter pendant la lecture pour garder la trace de tes recherches, comparer les études et construire une synthèse argumentée.', [
      [
        heading('Définir la recherche documentaire'),
        field('Sujet et question', 'question à laquelle la revue doit contribuer'),
        field('Concepts principaux', 'termes, synonymes et traductions utiles'),
        field('Critères d’inclusion', 'population, sujet, type de document, langues et période justifiés'),
        field('Critères d’exclusion', 'raisons explicites, définies avant la sélection si possible'),
        field('Bases et portails retenus', 'sources pertinentes pour la discipline'),
        heading('Journal des recherches'),
        note('Conserve la requête exacte, y compris les opérateurs et les filtres. Duplique les lignes pour chaque recherche ; le nombre trouvé n’est pas le nombre de documents lus.'),
        table(['Date et portail', 'Requête et filtres', 'Résultats trouvés', 'Décision'], [
          ['[date ; base]', '[requête exacte]', '[nombre observé]', '[retenir, affiner ; raison]'],
          ['[date ; base]', '[requête exacte]', '[nombre observé]', '[retenir, affiner ; raison]'],
          ['[date ; base]', '[requête exacte]', '[nombre observé]', '[retenir, affiner ; raison]']
        ], [2000, 3500, 1700, 2438]),
        heading('Sélection et doublons'),
        field('Règle de dédoublonnage', 'DOI, titre et auteurs comparés ; versions conservées'),
        field('Documents exclus après lecture', 'référence et motif précis de chaque exclusion'),
        note('Cette trame ne suffit pas à qualifier une revue de systématique. Une revue systématique exige un protocole et une méthode de recherche, de sélection et d’évaluation adaptés.')
      ],
      [
        page('Extraction : une fiche par source consultée'),
        note('Duplique cette page pour chaque source. Écris « non rapporté » lorsqu’une information est absente, et « résumé seulement » lorsque le texte intégral n’a pas été consulté.'),
        table(['Élément', 'Ce que rapporte la source'], [
          ['Identifiant et référence', '[code interne ; auteurs, année, titre, DOI ou URL]'],
          ['Lecture effective', '[texte intégral, sections ou résumé ; date]'],
          ['Question et objectif', '[objectif exact, reformulé fidèlement]'],
          ['Contexte et participants', '[pays, période, population, effectif et sélection]'],
          ['Devis et instruments', '[type d’étude ; recueil ; outils utilisés]'],
          ['Analyse', '[méthode statistique ou qualitative décrite]'],
          ['Résultats pertinents', '[constats et chiffres exacts ; page ou tableau]'],
          ['Limites rapportées', '[limites annoncées par les auteurs ; emplacement]'],
          ['Évaluation personnelle', '[points solides, incertitudes et raisons]'],
          ['Lien avec mon mémoire', '[argument soutenu et limites de transposition]']
        ], [2800, 6838]),
        heading('Contrôle de fidélité'),
        check('Chaque chiffre et citation courte renvoie à un passage retrouvé.'),
        check('J’ai séparé les propos de l’auteur de mon interprétation.'),
        check('J’ai vérifié la présence éventuelle d’un erratum ou d’un retrait.'),
        check('La référence complète sera ajoutée à la bibliographie.')
      ],
      [
        page('Comparer les sources et rédiger la synthèse'),
        table(['Thème ou question', 'Sources comparées', 'Accord ou divergence', 'Explication et limite'], [
          ['[thème 1]', '[codes des fiches]', '[résultats précis]', '[contexte, méthode ou population]'],
          ['[thème 2]', '[codes des fiches]', '[résultats précis]', '[contexte, méthode ou population]'],
          ['[thème 3]', '[codes des fiches]', '[résultats précis]', '[contexte, méthode ou population]']
        ], [2300, 1900, 2700, 2738]),
        heading('Du tableau à un paragraphe argumenté'),
        field('Idée du paragraphe', 'un constat ou un débat en lien avec la question'),
        field('Preuves convergentes', 'sources et résultats qui appuient cette idée'),
        field('Résultat divergent ou nuance', 'source, résultat et raison possible de la différence'),
        field('Portée pour mon contexte', 'ce qui paraît transposable et ce qui reste incertain'),
        field('Transition', 'lien avec la question suivante ou la lacune étudiée'),
        heading('Relecture de la synthèse'),
        check('Le texte compare les études au lieu d’aligner des résumés.'),
        check('Le contexte et la méthode sont précisés quand ils changent le sens d’un résultat.'),
        check('Les désaccords et les informations absentes sont conservés.'),
        check('Les appels de référence correspondent aux sources réellement utilisées.'),
        check('Aucune conclusion causale ou générale n’a été ajoutée sans appui.')
      ]
    ]);
}

function internshipJournal() {
  return document('Journal de stage et de compétences',
    'Un carnet pour noter tes missions au fil du stage, conserver des preuves autorisées et préparer un rapport fidèle à ton expérience.', [
      [
        heading('Cadre du stage'),
        field('Étudiant et formation', 'nom, niveau et établissement'),
        field('Organisme et service', 'nom et service réels'),
        field('Période et tuteur', 'dates, nom et fonction du tuteur'),
        field('Objectifs de la formation', 'compétences attendues selon les consignes'),
        heading('Objectifs personnels'),
        table(['Compétence à développer', 'Activité envisagée', 'Preuve possible'], [
          ['[compétence 1]', '[mission à discuter avec le tuteur]', '[livrable ou observation autorisés]'],
          ['[compétence 2]', '[mission à discuter avec le tuteur]', '[livrable ou observation autorisés]'],
          ['[compétence 3]', '[mission à discuter avec le tuteur]', '[livrable ou observation autorisés]']
        ], [3000, 3300, 3338]),
        heading('Organisation du carnet'),
        field('Rythme de mise à jour', 'fin de journée ou de semaine'),
        field('Lieu de conservation', 'emplacement autorisé et accessible seulement aux personnes concernées'),
        note('Ce carnet n’est pas une feuille officielle de présence. Utilise les documents de ton établissement pour attester les heures ou faire signer le stage.'),
        note('Ne copie pas de dossier de patient, de client, d’identifiant ou de document interne confidentiel dans ce modèle. Décris la tâche sans exposer les personnes.')
      ],
      [
        page('Fiche d’activité à dupliquer'),
        field('Date ou semaine', 'période réelle'),
        field('Service et mission', 'contexte de l’activité'),
        field('Besoin de départ', 'demande reçue ou difficulté observée'),
        field('Mon rôle exact', 'réalisé seul, réalisé avec aide ou observé'),
        field('Étapes et outils', 'ce que tu as fait et dans quel ordre'),
        field('Résultat constaté', 'résultat vérifiable ; indiquer si aucun résultat n’a été mesuré'),
        field('Preuve autorisée', 'nom du livrable, date, version ou annexe anonymisée'),
        field('Difficulté rencontrée', 'obstacle précis et son effet sur la mission'),
        field('Aide ou solution', 'action entreprise, personne ressource et suite constatée'),
        field('Retour du tuteur', 'retour reçu, date et point à améliorer'),
        field('Lien avec un enseignement', 'notion ou méthode mobilisée et exemple'),
        field('Prochaine étape', 'action concrète et date prévue'),
        heading('Avant de fermer la fiche'),
        check('Je distingue mon travail, l’observation et le travail collectif.'),
        check('Les chiffres et résultats sont vérifiables.'),
        check('La fiche ne contient aucune donnée personnelle inutile.')
      ],
      [
        page('Bilan hebdomadaire et préparation du rapport'),
        field('Semaine concernée', 'dates'),
        table(['Mission ou compétence', 'Ce qui a progressé', 'Preuve et prochaine action'], [
          ['[mission ou compétence 1]', '[changement concret observé]', '[preuve ; action ; échéance]'],
          ['[mission ou compétence 2]', '[changement concret observé]', '[preuve ; action ; échéance]'],
          ['[mission ou compétence 3]', '[changement concret observé]', '[preuve ; action ; échéance]']
        ], [2900, 3200, 3538]),
        heading('Choisir les situations à analyser'),
        field('Situation significative', 'mission représentative, difficulté ou réussite documentée'),
        field('Pourquoi la retenir', 'apprentissage ou enjeu professionnel à expliquer'),
        field('Ce que je peux conclure', 'conclusion limitée à mes observations'),
        field('Ce qui manque', 'preuve, retour ou information à obtenir'),
        heading('Passer du carnet au rapport'),
        check('Les dates et missions concordent avec les documents du stage.'),
        check('J’ai sélectionné quelques situations et expliqué leur intérêt.'),
        check('Les pièces jointes sont autorisées, lisibles et appelées dans le texte.'),
        check('Les informations sur l’organisme ont une source et une date.'),
        check('Mon bilan distingue acquis, limites et pistes d’amélioration.')
      ]
    ]);
}

function supervisorCorrections() {
  return document('Suivi des corrections de l’encadrant',
    'Un registre pour traiter chaque retour, conserver les décisions et envoyer une version dont les modifications peuvent être retrouvées.', [
      [
        heading('Identifier la version de référence'),
        field('Étudiant et titre du mémoire', 'à compléter'),
        field('Encadrant', 'nom et fonction'),
        field('Fichier corrigé reçu', 'nom exact et date de réception'),
        field('Version de travail', 'nom du fichier qui reprend les corrections'),
        field('Échéance de retour', 'date convenue'),
        note('Travaille à partir de la dernière version corrigée demandée par ton encadrant. Conserve une copie de référence avant d’intégrer les changements.'),
        heading('Registre des remarques'),
        note('Une ligne par remarque. Utilise un identifiant stable pour retrouver la fiche détaillée de la page suivante. Le statut « terminé » suppose une vérification.'),
        table(['ID et emplacement', 'Remarque reçue', 'Priorité et échéance', 'Statut'], [
          ['[C01 ; chapitre / page]', '[retour exact ou résumé fidèle]', '[priorité ; date]', '[à faire]'],
          ['[C02 ; chapitre / page]', '[retour exact ou résumé fidèle]', '[priorité ; date]', '[à clarifier]'],
          ['[C03 ; chapitre / page]', '[retour exact ou résumé fidèle]', '[priorité ; date]', '[en cours]'],
          ['[C04 ; chapitre / page]', '[retour exact ou résumé fidèle]', '[priorité ; date]', '[à vérifier]']
        ], [2200, 3650, 2200, 1588]),
        field('Statuts utilisés', 'à faire ; à clarifier ; en cours ; à vérifier ; terminé'),
        note('Traite d’abord les remarques qui modifient la question, la méthode ou l’interprétation ; la mise en forme intervient une fois le contenu stabilisé.')
      ],
      [
        page('Fiche de correction à dupliquer'),
        field('Identifiant', 'C01, C02…'),
        field('Remarque et date', 'retour reçu et emplacement dans la version de référence'),
        field('Ce qui est demandé', 'reformulation courte de la modification attendue'),
        field('Action réalisée', 'ce qui a été ajouté, supprimé, déplacé ou reformulé'),
        field('Justification', 'raison du choix et source vérifiée si nécessaire'),
        field('Nouvel emplacement', 'chapitre, titre de section et page dans la nouvelle version'),
        field('Effets sur le reste du mémoire', 'hypothèses, tableaux, questionnaire, résumé ou conclusion à harmoniser'),
        field('Vérification', 'comparaison avant / après et cohérence contrôlée'),
        field('Question restante', 'point qui nécessite une clarification de l’encadrant'),
        field('Statut et date', 'état actuel, sans déclarer validé un retour non reçu'),
        heading('Lorsque deux consignes semblent incompatibles'),
        field('Consignes concernées', 'reproduire leur sens avec les dates'),
        field('Proposition', 'solution cohérente à soumettre et conséquence sur le document'),
        note('Ne supprime pas une remarque sans la traiter. Si tu ne peux pas appliquer une demande, explique la difficulté et propose une option vérifiable.')
      ],
      [
        page('Contrôle avant l’envoi de la nouvelle version'),
        check('Je suis parti de la version corrigée désignée par l’encadrant.'),
        check('Chaque remarque reçue apparaît dans le registre.'),
        check('La question, les objectifs, la méthode et la conclusion restent cohérents.'),
        check('Les chiffres du texte concordent avec les tableaux et annexes.'),
        check('Les références ajoutées ont été consultées et sont correctement citées.'),
        check('Le sommaire, les renvois et la pagination ont été actualisés.'),
        check('Les commentaires résolus ont été traités selon les consignes de l’encadrant.'),
        check('Le fichier envoyé porte un nom et une date sans ambiguïté.'),
        heading('Bilan à joindre au message'),
        field('Modifications principales', 'trois à cinq changements concrets et leur emplacement'),
        field('Points restant à clarifier', 'questions précises ; signaler si aucun point ne reste'),
        field('Pièces envoyées', 'nom exact du mémoire et du tableau de suivi'),
        field('Date de l’envoi', 'date réelle'),
        field('Prochain retour attendu', 'échéance convenue ou à confirmer')
      ]
    ]);
}

function defenseStoryboard() {
  return document('Plan de présentation de soutenance',
    'Un storyboard Word pour préparer le contenu de tes diapositives, les preuves à montrer et le fil de ton exposé avant de passer à PowerPoint.', [
      [
        heading('Cadre et message central'),
        field('Titre du travail et formation', 'à compléter'),
        field('Durée autorisée', 'consigne officielle en minutes'),
        field('Consignes du jury', 'format, support, langue et modalités des questions'),
        field('Question de départ', 'question ou objectif réellement traité'),
        field('Message principal', 'ce que le jury doit retenir en une phrase'),
        heading('Architecture de l’exposé'),
        note('Cette structure est à adapter au travail réalisé. Il n’existe pas de nombre universel de diapositives. Réserve du temps à l’analyse et vérifie la durée par une répétition réelle.'),
        table(['Séquence', 'Question à laquelle répondre', 'Durée prévue'], [
          ['Ouverture et sujet', 'Quel problème ai-je étudié et pourquoi ?', '[durée]'],
          ['Objectif et périmètre', 'Qu’ai-je cherché à savoir ou à réaliser ?', '[durée]'],
          ['Méthode ou missions', 'Comment ai-je travaillé et pourquoi ces choix ?', '[durée]'],
          ['Résultats et discussion', 'Qu’ai-je constaté et comment l’interpréter ?', '[durée]'],
          ['Limites et conclusion', 'Que puis-je conclure et que reste-t-il à faire ?', '[durée]'],
          ['Total', 'Somme à comparer à la durée autorisée', '[total]']
        ], [2700, 4900, 2038]),
        field('Trois preuves essentielles', 'résultats, réalisations ou sources que tu peux expliquer')
      ],
      [
        page('Fiche de diapositive à dupliquer'),
        field('Numéro et séquence', 'position dans l’exposé'),
        field('Titre qui porte le message', 'une phrase ou un intitulé précis'),
        field('Idée unique', 'ce que cette diapositive apporte au raisonnement'),
        field('Contenu visible', 'mots clés, schéma, tableau ou graphique lisible'),
        field('Preuve et source', 'résultat réel, figure ou référence ; page et version vérifiées'),
        field('Commentaire oral', 'explication avec tes mots, sans relire tout le support'),
        field('Transition', 'phrase qui relie à la diapositive suivante'),
        field('Temps visé', 'durée à confirmer pendant la répétition'),
        field('Question probable', 'question liée à la preuve, à la méthode ou à une limite'),
        field('Réponse préparée', 'réponse précise et élément vérifiable'),
        heading('Vérification de cette diapositive'),
        check('Chaque chiffre, citation et visuel est sourcé et correctement légendé.'),
        check('Les éléments confidentiels ont été retirés ou autorisés.'),
        check('Je distingue résultat, interprétation et proposition.'),
        check('Le titre, les axes et la légende restent lisibles à distance.'),
        check('La diapositive soutient mon explication sans la remplacer.')
      ],
      [
        page('Répétition, questions et version finale'),
        table(['Essai et date', 'Durée mesurée', 'Point à modifier', 'Action'], [
          ['[essai 1 ; date]', '[durée réelle]', '[passage trop long ou peu clair]', '[modification prévue]'],
          ['[essai 2 ; date]', '[durée réelle]', '[passage trop long ou peu clair]', '[modification prévue]'],
          ['[essai final ; date]', '[durée réelle]', '[dernier contrôle]', '[action ou terminé]']
        ], [2000, 1900, 3100, 2638]),
        heading('Préparer les échanges'),
        field('Choix méthodologique à défendre', 'choix, raison et limite reconnue'),
        field('Résultat à expliquer', 'sens, portée et comparaison avec une référence pertinente'),
        field('Limite importante', 'conséquence sur ce qui peut être conclu'),
        field('Annexe utile', 'diapositive de réserve ou document à retrouver rapidement'),
        heading('Dernier contrôle'),
        check('La conclusion répond à la question annoncée au début.'),
        check('L’exposé tient dans le temps autorisé lors d’une répétition à voix haute.'),
        check('Le PowerPoint et sa copie PDF s’ouvrent correctement.'),
        check('Les sources, contrastes, polices et légendes ont été relus.'),
        check('Les fichiers, le matériel et une sauvegarde distincte sont prêts.'),
        field('Version finale du support', 'nom exact du fichier et date')
      ]
    ]);
}

export async function buildTemplates(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const templates = [
    ['plan-rapport-stage.docx', internshipOutline()],
    ['checklist-soutenance.docx', defenseChecklist()],
    ['fiche-lecture-source.docx', readingSheet()],
    ['fiche-cadrage-memoire.docx', researchBrief()],
    ['matrice-revue-litterature.docx', literatureMatrix()],
    ['journal-stage.docx', internshipJournal()],
    ['suivi-corrections-encadrant.docx', supervisorCorrections()],
    ['plan-presentation-soutenance.docx', defenseStoryboard()]
  ];
  for (const [filename, doc] of templates) {
    await writeFile(join(outputDirectory, filename), await Packer.toBuffer(doc));
  }
  return templates.map(([filename]) => filename);
}
