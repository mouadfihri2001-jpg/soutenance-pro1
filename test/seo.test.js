import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const expected = ['/', '/guides', '/pfe-ispits', '/these-medecine',
  '/guides/problematique-pfe-infirmier', '/guides/questionnaire-recherche-sante',
  '/guides/analyse-spss-pfe-sante', '/guides/presentation-soutenance-pfe',
  '/guides/recherche-bibliographique-sante'];
const file = path => root + 'dist/' + (path === '/' ? 'index.html' : path.slice(1) + '.html');
const read = path => readFileSync(root + 'dist/' + path, 'utf8');
const build = environment => execFileSync(process.execPath, ['scripts/build.mjs'], {
  cwd:root, env:{...process.env,VERCEL_ENV:environment,SITE_URL:'https://soutenancepro.com'}, stdio:'pipe'
});

test('preview builds stay out of search; production exposes only the nine public pages with working links', () => {
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
      assert.ok(expected.includes(url.pathname),'public link: '+href+' from '+path);
      if(url.hash && !['#inscription','#connexion','#workspace'].includes(url.hash)) {
        const target=readFileSync(file(url.pathname),'utf8');
        assert.ok(target.includes(`id="${url.hash.slice(1)}"`),'anchor: '+href+' from '+path);
      }
    }
  }
  assert.match(read('404.html'),/name="robots" content="noindex,follow"/);
  const png=readFileSync(root+'dist/assets/share.png');
  assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
});
