import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  AlignmentType, Document, ExternalHyperlink, Footer, HeadingLevel,
  PageNumber, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType
} from 'docx';

const SITE = 'https://soutenancepro.com/';
const GREEN = '004D35';
const CREAM = 'F4ECDD';
const TEXT = '25342C';

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

export async function buildTemplates(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const templates = [
    ['plan-rapport-stage.docx', internshipOutline()],
    ['checklist-soutenance.docx', defenseChecklist()],
    ['fiche-lecture-source.docx', readingSheet()]
  ];
  for (const [filename, doc] of templates) {
    await writeFile(join(outputDirectory, filename), await Packer.toBuffer(doc));
  }
  return templates.map(([filename]) => filename);
}
