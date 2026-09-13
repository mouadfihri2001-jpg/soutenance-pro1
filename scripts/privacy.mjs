import { layout, metadata, escapeHtml as e } from './seo.mjs';
import { CONTACT_EMAIL, CONTACT_EMAIL_URL } from '../src/contact.js';

export const privacyPath = '/confidentialite';

/** Public information only: never load advertising or consent-message tags here. */
export function renderPrivacy(context) {
  const title = 'Confidentialité et données personnelles';
  const description = 'Comprendre les données utilisées par Soutenance Pro, les notes enregistrées sur ton appareil, les services externes et tes choix concernant la publicité.';
  const contact = `<a href="${e(CONTACT_EMAIL_URL)}">${e(CONTACT_EMAIL)}</a>`;
  const content = `<main id="contenu">
<section class="article-hero"><div class="article-hero-inner">
<nav class="breadcrumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Confidentialité</span></nav>
<span class="eyebrow">Tes données et tes choix</span><h1>Confidentialité et données personnelles</h1>
<p class="article-lead">Cette page explique ce qui reste sur ton appareil, ce qui est enregistré dans ton compte et ce qui est transmis aux services utilisés par Soutenance Pro.</p>
<p class="fine">Mise à jour : <time datetime="2026-09-13">13 septembre 2026</time></p>
</div></section>
<article class="method-page article-body">
<h2>Lire les ressources publiques</h2>
<p>Les guides, les modèles et la bibliothèque sont accessibles sans créer de compte. Pour afficher les pages et répondre aux recherches, le site reçoit des informations techniques, notamment l’adresse IP, l’adresse demandée et des informations sur le navigateur. L’hébergement est assuré par Vercel.</p>
<p>La recherche étendue transmet les mots-clés et les filtres choisis au service documentaire HAL. La recherche de références de l’espace projet peut transmettre ta requête à Crossref ; une recherche automatique de références peut utiliser le titre du projet. Les liens vers une publication, une université ou un autre site ouvrent un service externe, qui applique ses propres règles de confidentialité.</p>

<h2>Créer un compte et travailler sur un projet</h2>
<p>Ton adresse email et ton mot de passe servent à créer ton compte et à te connecter, avec le service d’authentification Supabase. Une session de connexion peut être conservée dans ton navigateur pour te permettre de retrouver ton espace.</p>
<p>Les informations que tu enregistres dans un projet comprennent notamment ton nom, ton établissement, ta filière, ton sujet, les consignes, les sources et extraits ajoutés, ainsi que les documents produits ou modifiés. Elles sont stockées avec ton compte dans Supabase pour retrouver et poursuivre ton travail. Elles ne sont pas publiées dans la bibliothèque par cette action.</p>
<p>Le service enregistre aussi l’offre associée au compte, ses droits d’accès et l’utilisation des générations pour appliquer les limites de l’offre. Des informations techniques sur les tentatives d’inscription servent à limiter les abus.</p>

<h2>Utiliser les fonctions de génération</h2>
<p>Lorsque tu lances une génération, le contexte utile du projet, les consignes du module, le plan et les sources ou extraits sélectionnés sont transmis au service Anthropic pour préparer une réponse. Le résultat est ensuite enregistré dans ton espace. Les informations que tu inclus dans ces textes peuvent donc être traitées par ce fournisseur.</p>
<p>Ajoute seulement les éléments nécessaires à ton travail. Retire les noms, coordonnées et autres informations permettant d’identifier des patients, des participants ou des personnes citées dans tes données avant de les utiliser dans un module.</p>

<h2>Garder des notes sur ton appareil</h2>
<p>Les fiches de lecture personnelles, la liste de tes lectures enregistrées et la sélection du catalogue utilisent le stockage local du navigateur. Ces notes ne sont pas envoyées au serveur par leur fonction d’enregistrement et ne sont pas synchronisées avec ton compte.</p>
<p>Tu peux exporter tes fiches pour en garder une copie. Effacer les données du site dans les réglages du navigateur supprime les notes et sélections locales ; changer d’appareil ne les transfère pas. Les fichiers déjà téléchargés restent dans l’emplacement où tu les as enregistrés.</p>

<h2>Payer une offre</h2>
<p>Le paiement s’effectue sur une page externe Stripe. Les informations de carte sont saisies auprès de Stripe, pas dans les formulaires de projet Soutenance Pro. Les informations relatives à l’offre et à l’activation de l’accès servent à gérer ton compte. Selon le parcours de paiement utilisé, des identifiants et statuts de paiement ou d’abonnement peuvent être associés à ce compte.</p>

<h2>Publicité Google AdSense</h2>
<p>Des publicités Google AdSense pourront être proposées sur certaines ressources publiques après leur activation. La présence de cette information ne signifie pas que la publicité est déjà active sur la page que tu consultes.</p>
<p>Lorsque cette publicité est active, Google et ses partenaires peuvent utiliser des cookies, des identifiants et des informations telles que l’adresse IP ou l’activité de navigation pour diffuser les annonces, mesurer leur diffusion et prévenir les abus. Avec les choix et consentements nécessaires, des publicités peuvent être personnalisées à partir de visites sur ce site ou sur d’autres sites.</p>
<p>Pour les visiteurs situés dans l’Espace économique européen, au Royaume-Uni ou en Suisse, l’activation de publicités personnalisées prévoit une plateforme de gestion du consentement certifiée par Google. Le message présente les finalités, les partenaires et les choix disponibles. Lorsqu’il est proposé, tu peux accepter, refuser ou gérer ces choix, puis les modifier au moyen du lien de gestion de la confidentialité présent sur les pages concernées.</p>
<p>Consulte <a href="https://business.safety.google/privacy/" target="_blank" rel="noopener noreferrer">comment Google utilise les données</a> et les <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">paramètres publicitaires Google</a>. Ces paramètres complètent les choix proposés sur le site.</p>

<h2>Nous contacter et demander une modification</h2>
<p>Pour une question sur tes données ou pour demander leur accès, leur rectification ou leur suppression, écris à ${contact}. Précise l’adresse associée à ton compte et l’objet de ta demande, sans envoyer ton mot de passe ni tes informations de carte.</p>
<p>Une déconnexion ou l’effacement des données du navigateur ne supprime pas les projets enregistrés dans ton compte. Pour une demande concernant ces projets ou la fermeture du compte, contacte-nous. Les notes uniquement enregistrées sur ton appareil se gèrent depuis ce navigateur.</p>
<p>Si tu nous écris par email, WhatsApp ou Instagram, ton message et les informations que tu choisis de communiquer servent à traiter ta demande. Ces canaux utilisent les services de leurs fournisseurs respectifs.</p>
<p><a href="/methode-editoriale">Lire aussi notre méthode éditoriale</a></p>
</article></main>`;
  return layout({
    title,
    description,
    meta: metadata({
      ...context,
      path: privacyPath,
      title,
      description,
      updatedAt: '2026-09-13',
      breadcrumbs: [{ name: 'Accueil', path: '/' }, { name: 'Confidentialité', path: privacyPath }]
    }),
    content
  });
}
