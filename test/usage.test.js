import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { MODULES, sourceReady, validateInputs } from '../shared/modules.js';
import { authModeFromHash } from '../src/onboarding.js';
import { authLinkErrorFromHash } from '../src/auth.js';
import { WHATSAPP_URL, renderInstagramContact } from '../src/contact.js';
import { normalizeUsage, usageAfterGeneration, usageLimitReached } from '../src/usage.js';

const source = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
const free = remaining => ({ plan: 'free', limit: 3, used: 3 - remaining, remaining, resetsAt: '2026-10-01T00:00:00.000Z' });

async function mount({ usage = free(1), chat, usageError = false } = {}) {
  const listeners = {}, requests = [], elements = new Map();
  let html = '', renders = 0;
  const element = () => ({ innerHTML: '', hidden: false, textContent: '', disabled: false, querySelector() { return { focus() {} }; } });
  for (const id of ['usage-status', 'upgrade-panel', 'plan-name', 'generation-submit', 'document-panel', 'document-editor', 'history-panel', 'save-status']) elements.set(id, element());
  elements.get('upgrade-panel').hidden = true;
  const root = {
    hidden: false,
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; renders++; },
    addEventListener(name, fn) { listeners[name] = fn; },
    querySelector(selector) { return elements.get(selector === '#generation-form [type="submit"]' ? 'generation-submit' : selector.slice(1)) || null; }
  };
  const notice = { ...element(), addEventListener() {} };
  const user = { id: 'student-test', email: 'student@example.test' };
  const context = {
    document: { getElementById: id => id === 'workspace' ? root : id === 'sp-notice' ? notice : elements.get(id), body: { classList: { add() {}, remove() {} } } },
    window: { addEventListener() {} }, location: { hash: '', search: '' },
    createClient: () => ({ auth: { onAuthStateChange() {}, getSession: async () => ({ data: { session: { user, access_token: 'test-session' } } }) }, from(table) { const query = { select() { return query; }, order: async () => ({ data: [] }), single: async () => ({ data: table === 'student_accounts' ? { plan: 'free' } : {} }) }; return query; } }),
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (url === '/api/config') return { ok: true, json: async () => ({ authReady: true, ready: true }) };
      if (url === '/api/usage') {
        if (usageError) throw new Error('network unavailable');
        return { ok: true, json: async () => typeof usage === 'function' ? usage() : usage };
      }
      if (url === '/api/chat') return typeof chat === 'function' ? chat() : chat || { ok: true, json: async () => ({ document: { id: 'saved-third', title: 'Mon plan', content: '# Plan enregistré', module: 'plan', updated_at: '2026-09-11T00:00:00Z' }, remaining: 0 }) };
      throw new Error('Unexpected request');
    },
    FormData: class { [Symbol.iterator]() { return [['instructions', 'Précisions conservées']][Symbol.iterator](); } },
    MODULES, sourceReady, validateInputs, normalizeUsage, usageAfterGeneration, usageLimitReached, WHATSAPP_URL, renderInstagramContact, authModeFromHash, authLinkErrorFromHash,
    marked: { parse: text => text }, DOMPurify: { sanitize: text => text },
    AbortSignal, setTimeout, clearTimeout, console
  };
  runInNewContext(`${source}\nglobalThis.controls={state,ready,refreshUsage,loadProjects,renderProjects,renderModule,showPlans,syncUsagePanel};`, context);
  const controls = context.controls;
  await controls.ready;
  Object.assign(controls.state, { route: 'plan', project: { id: 'project-test', title: 'Mon mémoire', profile: {}, sources: [] }, usage: free(1) });
  controls.renderModule();
  return {
    ...controls, root, notice, requests, elements,
    get renders() { return renders; },
    submit: () => listeners.submit({ preventDefault() {}, target: { id: 'generation-form', querySelector: () => elements.get('generation-submit') } })
  };
}

test('the third result stays accessible while the generation button stops and offers remain informational', async () => {
  const app = await mount({ usage: free(0) });
  await app.submit();
  assert.equal(app.state.doc.id, 'saved-third');
  assert.match(app.elements.get('document-panel').innerHTML, /Plan enregistré/);
  assert.match(app.elements.get('document-panel').innerHTML, /Modifier le contenu/);
  assert.match(app.elements.get('document-panel').innerHTML, /Word \(\.docx\)/);
  assert.equal(app.elements.get('generation-submit').disabled, true);
  assert.match(app.elements.get('usage-status').innerHTML, /3 générations gratuites/);
  await app.submit();
  assert.equal(app.requests.filter(item => item.url === '/api/chat').length, 1);
  const renders = app.renders;
  app.showPlans();
  const offers = app.elements.get('upgrade-panel').innerHTML;
  assert.match(offers, /19 €/); assert.match(offers, /29 €/); assert.match(offers, /Recommandé/);
  assert.match(offers, /https:\/\/wa.me\/212708186441/);
  assert.match(offers, /aucun paiement ni changement d’offre/);
  assert.equal(app.renders, renders);
  assert.equal(app.state.account, null);
});

test('reload restores the server quota and usage updates never replace dirty text or existing documents', async () => {
  const app = await mount({ usage: free(0) });
  const original = { id: 'old', module: 'correction', content: 'Mon texte modifié non enregistré' };
  app.state.doc = original; app.state.dirty = true;
  app.elements.get('document-panel').innerHTML = '<textarea>Mon texte modifié non enregistré</textarea>';
  const renders = app.renders;
  await app.loadProjects();
  assert.equal(app.state.usage.remaining, 0);
  assert.equal(app.elements.get('generation-submit').disabled, true);
  assert.equal(app.state.doc, original); assert.equal(app.state.dirty, true);
  assert.equal(app.renders, renders);
  assert.equal(app.elements.get('document-panel').innerHTML, '<textarea>Mon texte modifié non enregistré</textarea>');
  assert.equal(app.requests.find(item => item.url === '/api/usage').options.cache, 'no-store');
  assert.equal(app.requests.find(item => item.url === '/api/usage').options.headers.Authorization, 'Bearer test-session');
});

test('a server quota rejection stops a stale UI, but rate and platform-budget failures do not prompt payment', async () => {
  for (const code of ['quota_exceeded', 'rate_limited', 'service_budget_exhausted']) {
    const app = await mount({ usageError: true, chat: { ok: false, json: async () => ({ error: { code, message: 'Message du serveur' } }) } });
    await app.submit();
    assert.equal(app.state.usageBlocked, code === 'quota_exceeded');
    assert.equal(app.elements.get('generation-submit').disabled, code === 'quota_exceeded');
    assert.equal(app.elements.get('upgrade-panel').hidden, true);
    if (code === 'quota_exceeded') assert.match(app.elements.get('usage-status').innerHTML, /quota|générations gratuites/);
    else assert.doesNotMatch(app.elements.get('usage-status').innerHTML, /sp-usage-exhausted/);
    assert.equal(app.notice.textContent, 'Message du serveur');
  }
});

test('counter failures keep the workspace available and a confirmed new period re-enables generation', async () => {
  const failed = await mount({ usageError: true });
  failed.state.usage = null;
  await failed.loadProjects(); failed.renderProjects();
  assert.match(failed.root.innerHTML, /Ton premier projet commence ici/);
  assert.match(failed.root.innerHTML, /Compteur momentanément indisponible/);
  const renewed = await mount({ usage: free(3) });
  renewed.state.usage = free(0); renewed.state.usageBlocked = true;
  await renewed.refreshUsage();
  assert.equal(renewed.state.usageBlocked, false);
  assert.equal(renewed.elements.get('generation-submit').disabled, false);
  assert.equal(renewed.elements.get('generation-submit').textContent, 'Générer et enregistrer');
  assert.equal(normalizeUsage({ ...free(3), plan: 'arbitrary-plan' }), null);
  assert.equal(normalizeUsage({ ...free(3), remaining: 99 }), null);
});

test('a failed final generation refreshes the refunded quota, rejects an older reserved snapshot and unlocks its unchanged editor', async () => {
  let finishChat, finishOlderUsage, usageCalls = 0;
  const app = await mount({
    chat: () => new Promise(resolve => { finishChat = resolve; }),
    usage: () => {
      usageCalls++;
      if (usageCalls === 1) return free(0); // Focus while the last generation is reserved.
      if (usageCalls === 2) return new Promise(resolve => { finishOlderUsage = resolve; });
      return free(1); // The failed provider attempt has refunded the reservation.
    }
  });
  const oldDocument = { id: 'old', module: 'plan', content: 'Mon document déjà enregistré' };
  app.state.doc = oldDocument;
  app.elements.get('document-panel').innerHTML = 'Mon document déjà enregistré';
  const pending = app.submit();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(app.state.busy, true);
  assert.equal(app.elements.get('document-editor').readOnly, true);
  await app.refreshUsage();
  assert.equal(app.state.usage.remaining, 0);
  assert.doesNotMatch(app.elements.get('usage-status').innerHTML, /sp-usage-exhausted/);
  const older = app.refreshUsage();
  await new Promise(resolve => setTimeout(resolve, 0));
  finishChat({ ok: false, json: async () => ({ error: { code: 'provider_unavailable', message: 'Réessaie dans un instant.' } }) });
  await pending;
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(usageCalls, 3);
  assert.equal(app.state.usage.remaining, 1);
  assert.equal(app.state.usageBlocked, false);
  assert.equal(app.elements.get('generation-submit').disabled, false);
  assert.equal(app.elements.get('document-editor').readOnly, false);
  assert.equal(app.state.doc, oldDocument);
  assert.equal(app.elements.get('document-panel').innerHTML, 'Mon document déjà enregistré');
  finishOlderUsage(free(0));
  await older;
  assert.equal(app.state.usage.remaining, 1);
  assert.equal(app.elements.get('generation-submit').disabled, false);
  assert.equal(app.elements.get('upgrade-panel').hidden, true);
});
