import { marked } from 'marked';
import { pages } from '../content/pages.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const brand = 'Soutenance Pro AI';
const logo = '<span class="site-mark" aria-hidden="true">S</span><span>Soutenance <strong>Pro</strong> AI</span>';
const signup = intent => `/?parcours=${intent}#inscription`;
export const publicPaths = ['/', '/guides', ...pages.map(p => '/' + p.slug)];

export function metadata({ origin, production, path = '/', title, description, article = false, breadcrumbs = [] }) {
  const url = origin + path;
  const graph = [{ '@type': path === '/' ? 'WebSite' : article ? 'Article' : 'WebPage', '@id': url + '#page', url, name: title, ...(article ? {headline:title} : {}), description, inLanguage:'fr', ...(article ? {author:{'@type':'Organization',name:brand,url:origin+'/'} } : {}) }];
  if (breadcrumbs.length) graph.push({ '@type':'BreadcrumbList', itemListElement:breadcrumbs.map((b,i)=>({'@type':'ListItem',position:i+1,name:b.name,item:origin+b.path})) });
  return `<meta name="robots" content="${production ? 'index,follow' : 'noindex,follow'}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(origin)}/assets/share.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Soutenance Pro AI — PFE, mémoire et soutenance en santé">
<meta name="twitter:image" content="${escapeHtml(origin)}/assets/share.png">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>`;
}

function layout({title, description, meta, content, intent='ispits', article=false}) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | Soutenance Pro</title><meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#004d35"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${brand}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">
${meta}<link rel="stylesheet" href="/assets/site.css"></head><body class="editorial">
<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="site-header"><a class="site-brand" href="/" aria-label="Soutenance Pro AI, accueil">${logo}</a><nav aria-label="Navigation principale"><a href="/pfe-ispits">ISPITS</a><a href="/these-medecine">Médecine</a><a href="/guides">Guides</a><a href="/#pricing">Tarifs</a></nav><a class="site-button compact" href="${signup(intent)}">Essai gratuit</a></header>
${content}
<footer class="site-footer"><div><a class="site-brand" href="/">${logo}</a><p>Un espace pour ton projet, tes sources et ta soutenance.</p><p class="fine">Un service indépendant, sans affiliation revendiquée avec un ISPITS ou une faculté.</p></div><nav aria-label="Navigation de pied de page"><a href="/pfe-ispits">PFE ISPITS</a><a href="/these-medecine">Thèse de médecine</a><a href="/guides">Guides de méthode</a><a href="/#pricing">Offres et limites</a><a href="/#connexion">Se connecter</a></nav><p class="fine">© 2026 Soutenance Pro AI</p></footer></body></html>`;
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
<span class="eyebrow">${escapeHtml(page.category)} · ${page.kind==='guide'?'Guide pratique':'Parcours étudiant'}</span><h1>${escapeHtml(page.heading)}</h1><p class="article-lead">${escapeHtml(page.lead)}</p><div class="hero-actions"><a class="site-button light" href="${signup(page.intent)}">Préparer mon projet gratuitement</a><a class="text-link" href="#article">Lire le guide</a></div><p class="fine">Soutenance Pro AI · ${minutes} min de lecture · À adapter aux consignes de ton établissement</p></div></section>
<div class="article-layout"><aside class="article-aside"><div class="aside-card"><span class="eyebrow">Avant de commencer</span><ul class="checklist">${page.checklist.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><nav class="contents" aria-label="Sommaire"><h2>Dans ce guide</h2>${headings.map(h=>`<a href="#${h.id}">${escapeHtml(h.label)}</a>`).join('')}</nav></aside><article id="article" class="article-body">${body}<div class="article-end"><p>Ce guide propose une méthode de travail académique. Vérifie les consignes de ton encadrant, les références utilisées et les résultats avant tout dépôt.</p><a href="/guides">Explorer les autres guides</a></div></article></div>
<section class="related-section"><div class="section-heading"><span class="eyebrow">La prochaine étape</span><h2>Continue ton projet.</h2></div><div class="guide-grid">${related.map(card).join('')}</div></section>
<section class="bottom-cta"><div><span class="eyebrow">Ton espace personnel</span><h2>Du guide à ton propre projet.</h2><p>Rassemble tes consignes, prépare ton plan et garde tes sources. Un projet et trois générations par mois avec l’offre gratuite.</p></div><a class="site-button" href="${signup(page.intent)}">Créer mon compte gratuit</a></section></main>`;
  return layout({title:page.title,description:page.description,intent:page.intent,article:page.kind==='guide',meta:metadata({...context,path:'/'+page.slug,title:page.title,description:page.description,article:page.kind==='guide',breadcrumbs:crumbs}),content});
}

export function renderGuides(context) {
  const title='Guides PFE, ISPITS et thèse de médecine';
  const description='Des guides pratiques pour ton travail en santé : problématique, bibliographie, questionnaire, analyse des données et soutenance.';
  return layout({title,description,meta:metadata({...context,path:'/guides',title,description,breadcrumbs:[{name:'Accueil',path:'/'},{name:'Guides',path:'/guides'}]}),content:`<main id="contenu"><section class="article-hero"><div class="article-hero-inner"><span class="eyebrow">La méthode, avant la rédaction</span><h1>Un guide pour chaque étape de ton PFE.</h1><p class="article-lead">Pour les étudiants ISPITS, en médecine et dans les filières de santé : des exemples, des points à vérifier et une prochaine étape concrète.</p><a class="site-button light" href="/#inscription">Créer mon espace gratuit</a></div></section><section class="related-section"><div class="section-heading"><span class="eyebrow">Choisis ton parcours</span><h2>Le point de départ de ton projet.</h2></div><div class="guide-grid pathways">${pages.filter(p=>p.kind==='parcours').map(card).join('')}</div></section><section class="related-section"><div class="section-heading"><span class="eyebrow">Passe à l’action</span><h2>Débloque l’étape qui te ralentit.</h2></div><div class="guide-grid">${pages.filter(p=>p.kind==='guide').map(card).join('')}</div></section></main>`});
}

export function renderNotFound(context) {
  return layout({title:'Page introuvable',description:'Retrouve les guides et ton espace Soutenance Pro AI.',meta:metadata({...context,production:false,path:'/404',title:'Page introuvable',description:'Retrouve les guides Soutenance Pro AI.'}),content:'<main id="contenu" class="not-found"><span class="eyebrow">Erreur 404</span><h1>Cette page n’existe pas.</h1><p>Tu peux retrouver ton espace depuis l’accueil ou continuer avec un guide.</p><a class="site-button" href="/">Revenir à l’accueil</a> <a href="/guides">Consulter les guides</a></main>'});
}
