import { build } from 'esbuild';
import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pages } from '../content/catalog.mjs';
import { metadata, renderPage, renderGuides, renderNotFound, publicPaths, escapeHtml } from './seo.mjs';
import { renderLibrary, renderEditorialMethod, renderInstitutions } from './library.mjs';
import { buildTemplates } from './templates.mjs';
import { assertProductionConfiguration } from '../server/runtime-config.js';
assertProductionConfiguration();
const production = process.env.VERCEL_ENV === 'production';
const site = new URL(process.env.SITE_URL?.trim() || 'https://soutenancepro.com');
if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('SITE_URL must be the public HTTPS origin, without credentials, path, query or fragment.');
}
const canonical = site.origin + '/';
const context={origin:site.origin,production};
const html = await readFile('index.html','utf8');
const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
if (!title || !description) throw new Error('The public homepage must define its title and description.');
const seo=metadata({...context,title,description});
if (!html.includes('<!-- SEO_DEPLOYMENT_META -->')) throw new Error('SEO metadata insertion point is missing.');
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await writeFile('dist/index.html', html.replace('<!-- SEO_DEPLOYMENT_META -->',seo));
for(const page of pages){const file=`dist/${page.slug}.html`;await mkdir(dirname(file),{recursive:true});await writeFile(file,renderPage(page,context));}
await writeFile('dist/guides.html',renderGuides(context));
await writeFile('dist/bibliotheque.html',renderLibrary(context));
await writeFile('dist/methode-editoriale.html',renderEditorialMethod(context));
await writeFile('dist/etablissements.html',renderInstitutions(context));
await writeFile('dist/404.html',renderNotFound(context));
await buildTemplates('dist/modeles');
// Allow crawlers to read the noindex meta tag on previews. Disallow would hide it.
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n${production ? `Sitemap: ${canonical}sitemap.xml\n` : ''}`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${production ? publicPaths.map(path=>`\n  <url><loc>${escapeHtml(site.origin+path)}</loc></url>`).join('')+'\n' : ''}</urlset>\n`);
await copyFile('src/app.css', 'dist/assets/app.css');
await copyFile('src/site.css','dist/assets/site.css');
await copyFile('src/home.css','dist/assets/home.css');
await copyFile('public/favicon.svg','dist/assets/favicon.svg');
await copyFile('public/share.png','dist/assets/share.png');
await build({
  entryPoints: { app: 'src/app.js', library: 'src/library.js' }, outdir: 'dist/assets', bundle: true,
  minify: true, splitting: true, format: 'esm', platform: 'browser',
  target: ['es2022'], entryNames: '[name]', chunkNames: 'chunk-[hash]',
  legalComments: 'eof'
});
