import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { requestAuth } from '../src/auth.js';
import { authModeFromHash, projectPreset } from '../src/onboarding.js';

const appSource = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
const landing = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Exercise the real app handlers with a small DOM double and an Auth client double.
// No emails, credentials or requests are sent to a live service.
function mount(overrides = {}, url = {}) {
  const listeners = {}, calls = [], diagnostics = [];
  let html = '', revision = 0;
  const notice = { hidden: true, textContent: '', addEventListener() {} };
  const root = {
    hidden: true,
    get innerHTML() { return html; },
    set innerHTML(value) { html = value; revision++; },
    addEventListener(name, handler) { listeners[name] = handler; },
    setAttribute() {}, removeAttribute() {},
    querySelector() { return { value: 'student@example.test' }; }
  };
  const auth = {
    onAuthStateChange() {}, getSession: async () => ({ data: { session: null } }),
    signUp: async payload => { calls.push(['signup', payload]); return { data: { user: { id: 'test' }, session: null }, error: null }; },
    signInWithPassword: async payload => { calls.push(['login', payload]); return { error: { code: 'invalid_credentials', status: 400 } }; },
    ...overrides
  };
  const window = { addEventListener() {} };
  runInNewContext(appSource, {
    window, location: { origin: 'https://preview.example.test',...url },
    document: {
      getElementById: id => id === 'workspace' ? root : notice,
      body: { classList: { add() {}, remove() {} } }
    },
    console: { warn: (...args) => diagnostics.push(args) },
    createClient: () => ({ auth }), requestAuth, authModeFromHash, projectPreset,
    fetch: async () => ({ ok: true, json: async () => ({ authReady: true, ready: true }) }),
    FormData: class { constructor(form) { this.values = form.values; } [Symbol.iterator]() { return this.values[Symbol.iterator](); } },
    clearTimeout, setTimeout
  });
  function form() {
    const renderedAt = revision;
    const submit = { disabled: false };
    return {
      id: 'auth-form', dataset: { mode: html.match(/data-mode="([^"]+)"/)[1] },
      values: [['email', ' student@example.test '], ['password', ' test-password-123 ']],
      get isConnected() { return revision === renderedAt; },
      querySelector: () => submit
    };
  }
  return {
    root, notice, calls, diagnostics, window, form,
    submit: form => listeners.submit({ preventDefault() {}, target: form }),
    click: (action, value = '') => listeners.click({ target: { closest: () => ({ dataset: { action, value } }) } })
  };
}

test('free-trial and signup links open signup; the displayed signup form calls signUp', async () => {
  const controls = [...landing.matchAll(/<(button|a)\b[^>]*onclick="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)];
  const signup = controls.filter(match => /Essai gratuit|Commencer gratuitement|Créer mon compte|S'inscrire/.test(match[3]));
  assert.ok(signup.length >= 5);
  for (const match of signup) assert.match(match[2], /^openApp\('signup'\)/);
  for (const match of controls.filter(match => /^(Se connecter|Connexion)$/.test(match[3]))) {
    assert.match(match[2], /^openApp\('login'\)/);
  }
  const app = mount();
  await app.window.openApp('signup');
  assert.match(app.root.innerHTML, /Créer mon compte/);
  await app.submit(app.form());
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0][0], 'signup');
  assert.equal(app.calls[0][1].email, 'student@example.test');
  assert.equal(app.calls[0][1].password, ' test-password-123 ');
  assert.equal(app.calls[0][1].options.emailRedirectTo, 'https://preview.example.test');
  assert.match(app.root.innerHTML, /data-mode="login"/);
  assert.match(app.notice.textContent, /confirmer ton inscription/);
});

test('a guide signup link opens signup on arrival and healthcare presets remain editable defaults', async()=>{
  const app=mount({}, {hash:'#inscription',search:'?parcours=medecine'});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(app.root.innerHTML,/data-mode="signup"/);
  await app.submit(app.form());
  assert.equal(app.calls[0][0],'signup');
  assert.deepEqual(projectPreset('?parcours=medecine'),{type:'Thèse',level:'Doctorat en médecine',field:'Médecine',language:'Français',citation:'Vancouver'});
  assert.deepEqual(projectPreset('?parcours=unexpected'),{});
  assert.equal(authModeFromHash('#pricing'),null);
});

test('changing from a failed login to signup clears the old error and preserves email', async () => {
  const app = mount();
  await app.window.openApp('login');
  await app.submit(app.form());
  assert.equal(app.notice.hidden, false);
  assert.match(app.notice.textContent, /Email ou mot de passe incorrect/);
  await app.click('auth-mode', 'signup');
  assert.match(app.root.innerHTML, /data-mode="signup"/);
  assert.match(app.root.innerHTML, /value="student@example.test"/);
  assert.equal(app.notice.hidden, true);
  assert.equal(app.notice.textContent, '');
  await app.submit(app.form());
  assert.deepEqual(app.calls.map(call => call[0]), ['login', 'signup']);
});

test('pending authentication prevents duplicate submits and mode changes; closing hides a late error', async () => {
  let finish, attempts = 0;
  const app = mount({ signInWithPassword: () => { attempts++; return new Promise(resolve => { finish = resolve; }); } });
  await app.window.openApp('login');
  const form = app.form();
  const pending = app.submit(form);
  await app.submit(form);
  await app.click('auth-mode', 'signup');
  assert.equal(attempts, 1);
  assert.match(app.root.innerHTML, /data-mode="login"/);
  await app.click('close');
  finish({ error: { code: 'invalid_credentials', status: 400 } });
  await pending;
  assert.equal(app.notice.hidden, true);
  await app.window.openApp('signup');
  assert.match(app.root.innerHTML, /data-mode="signup"/);
});

test('authentication errors distinguish confirmation, SMTP, configuration and credentials without logging secrets', async () => {
  for (const [mode, code, status, expected] of [
    ['login', 'email_not_confirmed', 400, /Confirme ton adresse/],
    ['signup', 'email_address_not_authorized', 400, /envoi des emails/],
    ['signup', 'weak_password', 422, /mot de passe plus robuste/],
    ['login', undefined, 401, /service de connexion est indisponible/],
    ['reset', 'over_email_send_rate_limit', 429, /Trop de demandes/],
    ['signup', 'unexpected_failure', 500, /inscription n’a pas pu aboutir/]
  ]) {
    const fail = async () => ({ error: { code, status, message: 'private-provider-detail password=secret-test' } });
    const app = mount({ signUp: fail, signInWithPassword: fail, resetPasswordForEmail: fail });
    await app.window.openApp(mode === 'signup' ? 'signup' : 'login');
    if (mode === 'reset') await app.click('auth-mode', 'reset');
    await app.submit(app.form());
    assert.match(app.notice.textContent, expected);
    assert.doesNotMatch(app.notice.textContent, /private-provider|secret-test/);
    assert.doesNotMatch(JSON.stringify(app.diagnostics), /private-provider|secret-test|student@|test-password/);
    assert.deepEqual(app.diagnostics[0][1], { mode, code: code || 'unknown', status });
  }
});
