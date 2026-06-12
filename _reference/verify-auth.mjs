// /admin auth verification.
// Real request: wrong password -> brand-voice error; logged-out guard.
// Mocked auth endpoints (fake session): sign-in -> editor, reload
// persistence, sign-out -> login.
import puppeteer from 'puppeteer-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';
const out = [];
const fail = [];

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const iso = new Date().toISOString();
  const user = {
    id: '00000000-0000-4000-8000-000000000000',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'staff@cheatmeals.ca',
    email_confirmed_at: iso,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: iso,
    updated_at: iso,
  };
  const jwt =
    b64url({ alg: 'HS256', typ: 'JWT' }) +
    '.' +
    b64url({ sub: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, iat: now, exp: now + 3600 }) +
    '.fake';
  return {
    access_token: jwt,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'fake-refresh-token',
    user,
  };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

async function mockAuth(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/auth/v1/')) {
      if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: CORS });
      if (url.includes('/auth/v1/token')) {
        return req.respond({
          status: 200,
          headers: { ...CORS, 'content-type': 'application/json' },
          body: JSON.stringify(fakeSession()),
        });
      }
      if (url.includes('/auth/v1/logout')) {
        return req.respond({ status: 204, headers: CORS });
      }
    }
    req.continue();
  });
}

async function typeLogin(p, email, pass) {
  await p.click('.pt-login__card .cm-field:nth-of-type(1) .cm-input');
  await p.type('.pt-login__card .cm-field:nth-of-type(1) .cm-input', email);
  await p.click('.pt-login__card .cm-field:nth-of-type(2) .cm-input');
  await p.type('.pt-login__card .cm-field:nth-of-type(2) .cm-input', pass);
  await p.evaluate(() => {
    [...document.querySelectorAll('.pt-login__card button')].find((b) => b.textContent.includes('Sign In')).click();
  });
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  // ---------- 1. logged-out guard: /admin shows login, not editor ----------
  {
    const p = await browser.newPage();
    await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-login', { timeout: 10000 });
    const editor = await p.$('.pt-admin-head');
    if (editor) fail.push('guard: editor rendered without a session');
    else out.push('logged out: /admin shows login only');
    await p.close();
  }

  // ---------- 2. wrong password (REAL supabase auth) -> brand error ----------
  {
    const p = await browser.newPage();
    await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-login');
    await typeLogin(p, 'wrong@cheatmeals.ca', 'definitely-not-it');
    await p.waitForFunction(
      () => document.querySelector('.cm-field__msg--error')?.textContent.length > 0,
      { timeout: 15000 }
    );
    const msg = await p.$eval('.cm-field__msg--error', (el) => el.textContent.trim());
    if (!msg.includes('Not the secret recipe')) fail.push(`wrong-password error text: "${msg}"`);
    else out.push(`wrong password (real auth request): error shown — "${msg}"`);
    const stillLogin = await p.$('.pt-login');
    if (!stillLogin) fail.push('wrong password: left the login screen');
    await p.close();
  }

  // ---------- 3-6. mocked session: sign-in, persistence, sign-out ----------
  {
    const p = await browser.newPage();
    await mockAuth(p);
    await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-login');
    await typeLogin(p, 'staff@cheatmeals.ca', 'the-secret-recipe');
    await p.waitForSelector('.pt-admin-head', { timeout: 10000 });
    const title = await p.$eval('.pt-admin-head h1', (el) => el.textContent);
    out.push(`sign-in: landed on "${title}"`);
    const loginGone = await p.$('.pt-login');
    if (loginGone) fail.push('sign-in: login still visible');

    // reload — session must persist (getSession reads localStorage)
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-admin-head', { timeout: 10000 });
    out.push('reload: session persisted, editor still shown');

    // sign out -> back to login
    await p.evaluate(() => {
      [...document.querySelectorAll('.pt-admin-head button')].find((b) => b.textContent.includes('Sign Out')).click();
    });
    await p.waitForSelector('.pt-login', { timeout: 10000 });
    const editorGone = await p.$('.pt-admin-head');
    if (editorGone) fail.push('sign-out: editor still visible');
    else out.push('sign-out: returned to login');

    // /admin again while signed out -> login
    await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-login', { timeout: 10000 });
    out.push('post-sign-out /admin visit: login shown');
    await p.close();
  }

  // ---------- 7. public site unaffected while a session exists ----------
  {
    const p = await browser.newPage();
    await mockAuth(p);
    await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-login');
    await typeLogin(p, 'staff@cheatmeals.ca', 'x');
    await p.waitForSelector('.pt-admin-head');
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-nav', { timeout: 10000 });
    const cards = await p.$$eval('#menu .cm-menu-card', (els) => els.length);
    if (cards < 13) fail.push(`public site with session: only ${cards} menu cards`);
    else out.push(`public site renders normally with an active session (${cards} cards)`);
    await p.close();
  }
} finally {
  await browser.close();
}

console.log('--- RESULTS ---');
out.forEach((l) => console.log('  ' + l));
console.log('--- FAILURES ---');
console.log(fail.length ? fail.join('\n') : '(none)');
process.exit(fail.length ? 1 : 0);
