import { build } from 'esbuild';
import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
const production = process.env.VERCEL_ENV === 'production';
const site = new URL(process.env.SITE_URL?.trim() || 'https://soutenance-pro1.vercel.app');
if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) {
  throw new Error('SITE_URL must be the public HTTPS origin, without credentials, path, query or fragment.');
}
const canonical = site.origin + '/';
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const website = { '@context':'https://schema.org', '@type':'WebSite', name:'Soutenance Pro AI', alternateName:'Soutenance Pro', url:canonical, inLanguage:'fr' };
const seo = `<meta name="robots" content="${production ? 'index,follow' : 'noindex,follow'}"/>
<link rel="canonical" href="${escape(canonical)}"/>
<meta property="og:url" content="${escape(canonical)}"/>
<script type="application/ld+json">${JSON.stringify(website).replace(/</g,'\\u003c')}</script>`;
const html = await readFile('index.html','utf8');
if (!html.includes('<!-- SEO_DEPLOYMENT_META -->')) throw new Error('SEO metadata insertion point is missing.');
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await writeFile('dist/index.html', html.replace('<!-- SEO_DEPLOYMENT_META -->',seo));
// Allow crawlers to read the noindex meta tag on previews. Disallow would hide it.
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n${production ? `Sitemap: ${canonical}sitemap.xml\n` : ''}`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${production ? `\n  <url><loc>${escape(canonical)}</loc></url>\n` : ''}</urlset>\n`);
await copyFile('src/app.css', 'dist/assets/app.css');
await build({
  entryPoints: ['src/app.js'], outdir: 'dist/assets', bundle: true,
  minify: true, splitting: true, format: 'esm', platform: 'browser',
  target: ['es2022'], entryNames: 'app', chunkNames: 'chunk-[hash]',
  legalComments: 'eof'
});
