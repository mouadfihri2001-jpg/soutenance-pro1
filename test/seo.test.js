import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { institutions } from '../content/institutions.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const expected = ['/', '/guides', '/bibliotheque', '/methode-editoriale', '/etablissements', '/pfe-ispits', '/these-medecine',
  '/guides/problematique-pfe-infirmier', '/guides/questionnaire-recherche-sante',
  '/guides/analyse-spss-pfe-sante', '/guides/presentation-soutenance-pfe',
  '/guides/recherche-bibliographique-sante', '/pfe', '/rapport-de-stage', '/soutenance',
  '/guides/plan-rapport-de-stage', '/guides/introduction-rapport-de-stage'];
const templates = ['/modeles/plan-rapport-stage.docx','/modeles/checklist-soutenance.docx','/modeles/fiche-lecture-source.docx'];
const file = path => root + 'dist/' + (path === '/' ? 'index.html' : path.slice(1) + '.html');
const read = path => readFileSync(root + 'dist/' + path, 'utf8');
// Nonfunctional fixtures for offline builds. These are not service credentials.
const fixtures={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'sb_publishable_offline-test',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_offline-test',ANTHROPIC_API_KEY:'offline-provider-test'};
const build = (environment, overrides={}) => execFileSync(process.execPath, ['scripts/build.mjs'], {
  cwd:root, env:{...process.env,...fixtures,VERCEL_ENV:environment,SITE_URL:'https://soutenancepro.com',...overrides}, stdio:'pipe'
});

test('production builds stop on missing configuration or a misplaced secret without logging its value',()=>{
  for(const overrides of [{SUPABASE_ANON_KEY:''},{SUPABASE_ANON_KEY:'sb_secret_misplaced-fixture'}]){
    let failure;
    try{build('production',overrides);}catch(error){failure=error;}
    assert.ok(failure,'an incomplete Production build must not succeed');
    const output=String(failure.stderr);
    assert.match(output,/Production configuration incomplete/);
    assert.match(output,/SUPABASE_ANON_KEY/);
    assert.doesNotMatch(output,/sb_secret_misplaced-fixture|sb_secret_offline-test|offline-provider-test/);
  }
});

test('preview builds stay out of search; production exposes the library and all public pages with working links', () => {
  build('preview');
  for (const path of expected) assert.match(readFileSync(file(path),'utf8'), /name="robots" content="noindex,follow"/, path);
  assert.doesNotMatch(read('sitemap.xml'), /<loc>/);
  assert.doesNotMatch(read('robots.txt'), /Disallow:\s*\/$/m);

  build('production');
  const locations = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
  assert.deepEqual(locations,expected.map(path=>'https://soutenancepro.com'+path));
  assert.match(read('robots.txt'), /Sitemap: https:\/\/soutenancepro\.com\/sitemap.xml/);
  const titles = new Set();
  for(const path of expected) {
    const html=readFileSync(file(path),'utf8');
    assert.match(html,/name="robots" content="index,follow"/,path);
    assert.ok(html.includes(`rel="canonical" href="https://soutenancepro.com${path}"`),path);
    assert.equal([...html.matchAll(/<h1\b/g)].length,1,path);
    const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
    assert.ok(title && !titles.has(title),'distinct title for '+path);titles.add(title);
    for(const [,raw] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data=JSON.parse(raw);assert.equal(data['@context'],'https://schema.org');
      assert.equal(data['@graph'][0].url,'https://soutenancepro.com'+path);
    }
    for(const [,href] of html.matchAll(/\bhref="([^"]+)"/g)) {
      const url=new URL(href,'https://soutenancepro.com'+path);
      if(url.origin!=='https://soutenancepro.com')continue;
      if(url.pathname.startsWith('/assets/')) { assert.ok(existsSync(root+'dist'+url.pathname),href);continue; }
      if(url.pathname.startsWith('/modeles/')) { assert.ok(templates.includes(url.pathname),href);assert.ok(existsSync(root+'dist'+url.pathname),href);continue; }
      assert.ok(expected.includes(url.pathname),'public link: '+href+' from '+path);
      if(url.hash && !['#inscription','#connexion','#workspace'].includes(url.hash)) {
        const target=readFileSync(file(url.pathname),'utf8');
        assert.ok(target.includes(`id="${url.hash.slice(1)}"`),'anchor: '+href+' from '+path);
      }
    }
  }
  assert.match(read('404.html'),/name="robots" content="noindex,follow"/);
  const library=read('bibliotheque.html');
  assert.equal([...library.matchAll(/\sdata-resource(?:\s|>)/g)].length,15,'all guides and templates have default-visible resource cards');
  assert.match(library,/"@type":"CollectionPage"/);
  assert.match(library,/"@type":"ItemList"/);
  assert.match(library,/src="\/assets\/library.js"/);
  assert.ok(existsSync(root+'dist/assets/library.js'));
  for(const template of templates) assert.ok(library.includes(`href="${template}" download`),template);
  for(const location of locations) assert.doesNotMatch(location,/modeles|\?|#/,'only canonical HTML routes enter the sitemap');
  assert.doesNotMatch(library,/adsbygoogle|ca-pub-/,'no invented publisher setup');
  const directory=read('etablissements.html');
  assert.match(directory,/"@type":"CollectionPage"/);
  assert.deepEqual([...new Set(institutions.map(item=>item.country))].sort(),['DZ','FR','MA','TN']);
  for (const institution of institutions) {
    assert.equal(new URL(institution.sourceUrl).protocol,'https:','HTTPS official source');
    assert.ok(directory.includes(institution.sourceUrl.replaceAll('&','&amp;')),'official source is present without JavaScript');
    assert.ok(directory.includes(institution.name),'institution name is present without JavaScript');
    assert.ok(institution.scope && institution.checkedAt && institution.guidePath,'scope, date and next step are explicit');
  }
  const home=read('index.html');
  assert.match(home,/action="\/bibliotheque"/,'homepage search reaches the library');
  assert.match(home,/name="q"/);
  assert.match(home,/\/assets\/home.css/);
  const headers=JSON.parse(readFileSync(root+'vercel.json','utf8')).headers;
  assert.ok(headers.find(rule=>rule.source==='/modeles/(.*)').headers.some(h=>h.key==='X-Robots-Tag'&&h.value==='noindex'));
  const png=readFileSync(root+'dist/assets/share.png');
  assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
});
