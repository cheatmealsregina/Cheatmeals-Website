import puppeteer from 'puppeteer-core';

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const iso = new Date().toISOString();
  const user = { id: '00000000-0000-4000-8000-000000000000', aud: 'authenticated', role: 'authenticated', email: 's@c.ca', email_confirmed_at: iso, app_metadata: {}, user_metadata: {}, created_at: iso, updated_at: iso };
  const jwt = b64url({ alg: 'HS256' }) + '.' + b64url({ sub: user.id, aud: 'authenticated', role: 'authenticated', iat: now, exp: now + 3600 }) + '.fake';
  return { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'fake', user };
}
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
const p = await browser.newPage();
p.on('console', (m) => { if (m.type() !== 'debug') console.log(`[${m.type()}]`, m.text().slice(0, 300)); });
p.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 500)));
await p.setRequestInterception(true);
p.on('request', (req) => {
  const url = req.url();
  if (req.method() === 'OPTIONS' && url.includes('supabase.co')) return req.respond({ status: 204, headers: CORS });
  if (url.includes('/auth/v1/token')) return req.respond({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(fakeSession()) });
  req.continue();
});
await p.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
await p.waitForSelector('.pt-login');
await p.type('.pt-login__card .cm-field:nth-of-type(1) .cm-input', 's@c.ca');
await p.type('.pt-login__card .cm-field:nth-of-type(2) .cm-input', 'x');
await p.evaluate(() => [...document.querySelectorAll('.pt-login__card button')].find((b) => b.textContent.includes('Sign In')).click());
await new Promise((r) => setTimeout(r, 6000));
const html = await p.evaluate(() => document.querySelector('.admin-page')?.innerHTML.slice(0, 400));
console.log('ADMIN HTML:', html);
await browser.close();
