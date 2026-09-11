import { marked } from 'marked';
import { pages } from '../content/catalog.mjs';
import { contactStyles, renderInstagramContact } from '../src/contact.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const brand = 'Soutenance Pro AI';
const logo = '<span class="site-mark" aria-hidden="true">S</span><span>Soutenance <strong>Pro</strong> AI</span>';
const signup = intent => ['ispits','medecine'].includes(intent) ? `/?parcours=${intent}#inscription` : '/#inscription';
export const publicPaths = ['/', '/guides', '/bibliotheque', '/methode-editoriale', '/etablissements', ...pages.map(p => '/' + p.slug)];

export function metadata({ origin, production, path = '/', title, description, article = false, breadcrumbs = [], updatedAt, collection }) {
  const url = origin + path;
  const graph = [{ '@type': path === '/' ? 'WebSite' : collection ? 'CollectionPage' : article ? 'Article' : 'WebPage', '@id': url + '#page', url, name: title, ...(article ? {headline:title} : {}), description, inLanguage:'fr', ...(updatedAt ? {dateModified:updatedAt} : {}), ...(article ? {author:{'@type':'Organization',name:brand,url:origin+'/methode-editoriale'} } : {}) }];
  if (collection) graph.push({'@type':'ItemList',itemListElement:collection.map((item,i)=>({'@type':'ListItem',position:i+1,name:item.name,url:origin+item.path}))});
  if (breadcrumbs.length) graph.push({ '@type':'BreadcrumbList', itemListElement:breadcrumbs.map((b,i)=>({'@type':'ListItem',position:i+1,name:b.name,item:origin+b.path})) });
  return `<meta name="robots" content="${production ? 'index,follow' : 'noindex,follow'}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(origin)}/assets/share.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Soutenance Pro AI — Ton PFE, une méthode claire">
<meta name="twitter:image" content="${escapeHtml(origin)}/assets/share.png">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>`;
}

export function layout({title, description, meta, content, intent='general', article=false}) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | Soutenance Pro</title><meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#004d35"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${brand}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">
${meta}<link rel="stylesheet" href="/assets/site.css"><style id="sp-contact-styles">${contactStyles}</style></head><body class="editorial">
<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="site-header"><a class="site-brand" href="/" aria-label="Soutenance Pro AI, accueil">${logo}</a><nav aria-label="Navigation principale"><a href="/bibliotheque">Bibliothèque</a><a href="/pfe">PFE</a><a href="/rapport-de-stage">Stage</a><a href="/soutenance">Soutenance</a><a href="/etablissements">Établissements</a><a href="/#pricing">Tarifs</a></nav><a class="site-button compact" href="${signup(intent)}">Essai gratuit</a></header>
${content}
<footer class="site-footer"><div><a class="site-brand" href="/">${logo}</a><p>Un espace pour ton projet, tes sources et ta soutenance.</p><p class="fine">Un service indépendant, sans affiliation revendiquée avec une école ou une université.</p>${renderInstagramContact()}</div><nav aria-label="Navigation de pied de page"><a href="/bibliotheque">Bibliothèque gratuite</a><a href="/etablissements">Consignes des établissements</a><a href="/pfe-ispits">PFE ISPITS</a><a href="/these-medecine">Thèse de médecine</a><a href="/guides">Par où commencer ?</a><a href="/methode-editoriale">À propos et méthode</a><a href="/#pricing">Offres et limites</a><a href="/#connexion">Se connecter</a></nav><p class="fine">© 2026 Soutenance Pro AI</p></footer>${renderInstagramContact({floating:true})}</body></html>`;
}

const card = p => `<a class="guide-card" href="/${p.slug}"><span class="eyebrow">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.heading)}</h3><p>${escapeHtml(p.lead)}</p><span class="card-link">Lire le guide <span aria-hidden="true">→</span></span></a>`;

export function renderPage(page, context) {
  let headingIndex=0; const headings=[];
  const renderer = new marked.Renderer();
  renderer.heading = ({depth,text,tokens}) => {
    const html=renderer.parser.parseInline(tokens);
    if(depth!==2)return `<h${depth}>${html}</h${depth}>`;
    const id=`section-${++headingIndex}`;headings.push({id,label:text.replace(/<[^>]+>/g,'')});
    return `<h2 id="${id}">${html}</h2>`;
  };
  const body=marked.parse(page.body,{renderer});
  const crumbs=[{name:'Accueil',path:'/'},...(page.kind==='guide'?[{name:'Guides',path:'/guides'}]:[]),{name:page.category,path:'/'+page.slug}];
  const minutes=Math.max(3,Math.ceil(page.body.split(/\s+/).length/210));
  const related=page.related.map(slug=>pages.find(p=>p.slug===slug));
  if(related.some(p=>!p))throw new Error('Broken editorial relation: '+page.slug);
  const content=`<main id="contenu"><section class="article-hero"><div class="article-hero-inner"><nav class="breadcrumbs" aria-label="Fil d’Ariane">${crumbs.map((b,i)=>i===crumbs.length-1?`<span aria-current="page">${escapeHtml(b.name)}</span>`:`<a href="${b.path}">${escapeHtml(b.name)}</a><span aria-hidden="true">/</span>`).join('')}</nav>
<span class="eyebrow">${escapeHtml(page.category)} · ${page.kind==='guide'?'Guide pratique':'Parcours étudiant'}</span><h1>${escapeHtml(page.heading)}</h1><p class="article-lead">${escapeHtml(page.lead)}</p><div class="hero-actions"><a class="site-button light" href="${signup(page.intent)}">Préparer mon projet gratuitement</a><a class="text-link" href="#article">Lire le guide</a></div><p class="fine">Publication : <a class="text-link" href="/methode-editoriale">Soutenance Pro</a> · ${minutes} min de lecture${page.updatedAt ? ` · Mis à jour le <time datetime="${escapeHtml(page.updatedAt)}">${escapeHtml(new Date(page.updatedAt+'T12:00:00Z').toLocaleDateString('fr-FR',{timeZone:'UTC'}))}</time>` : ''} · À adapter aux consignes de ton établissement</p></div></section>
<div class="article-layout"><aside class="article-aside"><div class="aside-card"><span class="eyebrow">Avant de commencer</span><ul class="checklist">${page.checklist.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><nav class="contents" aria-label="Sommaire"><h2>Dans ce guide</h2>${headings.map(h=>`<a href="#${h.id}">${escapeHtml(h.label)}</a>`).join('')}</nav></aside><article id="article" class="article-body">${body}<div class="article-end"><p>Ce guide propose une méthode de travail académique. Vérifie les consignes de ton encadrant, les références utilisées et les résultats avant tout dépôt.</p><a href="/guides">Explorer les autres guides</a></div></article></div>
<section class="related-section"><div class="section-heading"><span class="eyebrow">La prochaine étape</span><h2>Continue ton projet.</h2></div><div class="guide-grid">${related.map(card).join('')}</div></section>
<section class="bottom-cta"><div><span class="eyebrow">Ton espace personnel</span><h2>Du guide à ton propre projet.</h2><p>Rassemble tes consignes, prépare ton plan et garde tes sources. Un projet et trois générations par mois avec l’offre gratuite.</p></div><a class="site-button" href="${signup(page.intent)}">Créer mon compte gratuit</a></section></main>`;
  return layout({title:page.title,description:page.description,intent:page.intent,article:page.kind==='guide',meta:metadata({...context,path:'/'+page.slug,title:page.title,description:page.description,article:page.kind==='guide',breadcrumbs:crumbs,updatedAt:page.updatedAt}),content});
}

export function renderGuides(context) {
  const title='Méthode pour un PFE ou un rapport de stage : par où commencer ?';
  const description='Choisis la prochaine étape de ton travail : cadrage, sources, plan, rédaction, résultats et soutenance. Un parcours de lecture dans les guides Soutenance Pro.';
  const steps = [
    ['Délimiter le travail', 'Écris ce que tu dois produire, à partir de quelles observations ou ressources, et pour quelle échéance. Si le projet vient d’un stage, pars de tes missions réelles.', 'pfe', 'Cadrer mon PFE'],
    ['Préparer les sources', 'Garde les références, les extraits consultés et une note sur leur intérêt pour ta question. Une liste de titres sans lecture ne suffit pas à soutenir un raisonnement.', 'guides/recherche-bibliographique-sante', 'Organiser la recherche bibliographique'],
    ['Construire une structure', 'Associe à chaque partie une question, un document ou une observation disponible. Le guide et le modèle de rapport de stage montrent comment passer d’un titre à un contenu attendu.', 'guides/plan-rapport-de-stage', 'Construire le plan de mon rapport'],
    ['Rédiger avec des éléments précis', 'Présente le contexte, ton rôle et l’objectif du travail. L’exemple d’introduction explique les corrections d’une formulation trop générale ; adapte la démarche à ton propre sujet.', 'guides/introduction-rapport-de-stage', 'Travailler mon introduction'],
    ['Interpréter ce qui a été observé', 'Distingue les résultats disponibles, leur interprétation et les limites. Pour un travail quantitatif, vérifie les variables et le traitement retenu avant de commenter un tableau.', 'guides/analyse-spss-pfe-sante', 'Préparer la lecture de résultats'],
    ['Préparer le passage à l’oral', 'Sélectionne un fil conducteur, choisis les éléments qui le montrent et répète avec un chronomètre. Le dossier soutenance aide à adapter ce travail au temps donné par ton établissement.', 'soutenance', 'Préparer ma soutenance']
  ];
  return layout({title,description,meta:metadata({...context,path:'/guides',title,description,breadcrumbs:[{name:'Accueil',path:'/'},{name:'Parcours de lecture',path:'/guides'}]}),content:`<main id="contenu"><section class="article-hero"><div class="article-hero-inner"><span class="eyebrow">Une étape à la fois</span><h1>Choisis ce qui fera avancer ton travail aujourd’hui.</h1><p class="article-lead">Tu n’as pas besoin de tout lire dans l’ordre. Repère le point qui bloque ton PFE, ton rapport ou ton oral, puis termine une étape concrète.</p><a class="site-button light" href="/bibliotheque">Chercher dans la bibliothèque</a></div></section><article class="method-page article-body">${steps.map(([heading,text,slug,label],i)=>`<section><h2>${i+1}. ${heading}</h2><p>${text}</p><p><a href="/${slug}">${label} →</a></p></section>`).join('')}<div class="article-end"><h2>Des besoins propres à ta filière ?</h2><p>Les parcours <a href="/pfe-ispits">PFE ISPITS</a> et <a href="/these-medecine">thèse de médecine</a> détaillent les points de méthode en santé. Pour un stage d’observation ou une mission en entreprise, consulte le <a href="/rapport-de-stage">dossier rapport de stage</a>.</p></div></article></main>`});
}

export function renderNotFound(context) {
  return layout({title:'Page introuvable',description:'Retrouve les guides et ton espace Soutenance Pro AI.',meta:metadata({...context,production:false,path:'/404',title:'Page introuvable',description:'Retrouve les guides Soutenance Pro AI.'}),content:'<main id="contenu" class="not-found"><span class="eyebrow">Erreur 404</span><h1>Cette page n’existe pas.</h1><p>Tu peux retrouver ton espace depuis l’accueil ou continuer avec un guide.</p><a class="site-button" href="/">Revenir à l’accueil</a> <a href="/guides">Consulter les guides</a></main>'});
}
