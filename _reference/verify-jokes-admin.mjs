// Admin Jokes editor verification at phone width (375x812).
// Auth is mocked (fake session); PostgREST WRITES are intercepted with
// CORS-correct responses and their bodies captured for assertions; READS hit
// the real database via the anon key (so the editor loads real active jokes).
// The final section proves RLS blocks anon writes to `jokes` for real.
// Requires the dev server on :5173 (`npm run dev`).
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';
const out = [];
const fail = [];

const env = readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8');
const ANON_KEY = env.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY=')).replace('VITE_SUPABASE_ANON_KEY=', '').trim();
const SB_URL = env.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_URL=')).replace('VITE_SUPABASE_URL=', '').trim();

const HI_TEXT = 'PLACEHOLDER — कढ़ाई में तड़का, दिल में श्रद्धा।';

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const iso = new Date().toISOString();
  const user = {
    id: '00000000-0000-4000-8000-000000000000', aud: 'authenticated', role: 'authenticated',
    email: 'staff@cheatmeals.ca', email_confirmed_at: iso,
    app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: iso, updated_at: iso,
  };
  const jwt = b64url({ alg: 'HS256', typ: 'JWT' }) + '.' +
    b64url({ sub: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, iat: now, exp: now + 3600 }) + '.fake';
  return { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'fake', user };
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const writes = [];
let failWrites = false;

async function instrument(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();
    if (method === 'OPTIONS' && (url.includes('/rest/v1/') || url.includes('/auth/v1/'))) {
      return req.respond({ status: 204, headers: CORS });
    }
    if (url.includes('/auth/v1/token')) {
      return req.respond({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(fakeSession()) });
    }
    if (url.includes('/auth/v1/logout')) return req.respond({ status: 204, headers: CORS });
    if (url.includes('/rest/v1/') && method === 'GET') {
      fetch(url, { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } })
        .then(async (r) => req.respond({ status: r.status, headers: { ...CORS, 'content-type': 'application/json' }, body: await r.text() }))
        .catch(() => req.abort());
      return;
    }
    if (url.includes('/rest/v1/') && ['PATCH', 'POST', 'DELETE'].includes(method)) {
      const body = req.postData() ? JSON.parse(req.postData()) : null;
      writes.push({ method, url, body });
      if (failWrites) {
        return req.respond({ status: 401, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ message: 'denied' }) });
      }
      let resp;
      if (method === 'POST') resp = [{ ...(Array.isArray(body) ? body[0] : body), id: 9999 }];
      else if (method === 'PATCH') resp = [{ ...(body || {}), id: 0 }];
      else resp = [{ id: 0 }];
      return req.respond({ status: method === 'POST' ? 201 : 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(resp) });
    }
    req.continue();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jokeWrites = (m) => writes.filter((x) => x.method === m && x.url.includes('/rest/v1/jokes'));
const lastJoke = (m) => jokeWrites(m).pop();

async function waitToast(p, text) {
  try {
    await p.waitForFunction((t) => document.querySelector('.pt-toastdock .cm-toast')?.textContent.includes(t), { timeout: 5000 }, text);
    return true;
  } catch { return false; }
}
async function setInput(p, selector, value) {
  await p.evaluate((sel, v) => {
    const inp = document.querySelector(sel);
    const proto = inp.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(inp, v);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}
const clickBtn = (p, sel, label) => p.evaluate((s, l) => {
  const b = [...document.querySelectorAll(s)].find((x) => x.textContent.trim() === l);
  if (b) b.click(); return !!b;
}, sel, label);

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--force-device-scale-factor=1'] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 375, height: 812 });
  p.on('pageerror', (e) => fail.push('pageerror: ' + e.message.slice(0, 140)));
  await instrument(p);

  // ---------- sign in, open the Jokes view ----------
  await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
  await p.waitForSelector('.pt-login');
  await p.type('.pt-login__card .cm-field:nth-of-type(1) .cm-input', 'staff@cheatmeals.ca');
  await p.type('.pt-login__card .cm-field:nth-of-type(2) .cm-input', 'x');
  await p.evaluate(() => [...document.querySelectorAll('.pt-login__card button')].find((b) => b.textContent.includes('Sign In')).click());
  await p.waitForSelector('.cm-editor-row', { timeout: 15000 });

  await p.waitForFunction(() => {
    const tabs = document.querySelector('.cm-tabs');
    const t = tabs && [...tabs.querySelectorAll('.cm-tab')].find((x) => x.textContent.trim() === 'Jokes');
    if (t) { t.click(); return true; }
    return false;
  }, { timeout: 8000 });
  await p.waitForSelector('.pt-jokes-editor', { timeout: 8000 });

  const enRows = await p.$$eval('.pt-jokes-editor .cm-editor-row', (els) => els.length);
  const liveEn = await fetch(`${SB_URL}/rest/v1/jokes?select=id&lang=eq.en&is_active=eq.true`, { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } }).then((r) => r.json());
  out.push(`Jokes view: ${enRows} English rows (live active en: ${liveEn.length})`);
  if (enRows !== liveEn.length) fail.push(`English rows ${enRows} != live active ${liveEn.length}`);

  // ---------- add an English joke ----------
  await p.evaluate(() => [...document.querySelectorAll('.pt-jokes-editor .pt-rowgroup__head button')].find((b) => b.textContent.includes('Add joke')).click());
  await p.waitForSelector('.pt-editcard textarea');
  const newLangSel = await p.$eval('.pt-editcard select', (el) => el.value);
  if (newLangSel !== 'en') fail.push('add card language default not en: ' + newLangSel);
  await setInput(p, '.pt-editcard textarea', 'PLACEHOLDER test joke EN');
  await setInput(p, '.pt-editcard input.cm-input', 'dad');
  await clickBtn(p, '.pt-editcard__actions button', 'Save');
  await sleep(400);
  let w = lastJoke('POST');
  const enBody = w && (Array.isArray(w.body) ? w.body[0] : w.body);
  if (!enBody || enBody.lang !== 'en' || enBody.text !== 'PLACEHOLDER test joke EN' || enBody.is_active !== true || typeof enBody.sort_order !== 'number' || enBody.category !== 'dad') {
    fail.push('EN add POST wrong: ' + JSON.stringify(enBody));
  } else out.push(`add EN -> POST jokes {lang:en, text, category:dad, is_active:true, sort_order:${enBody.sort_order}}`);
  if (!(await waitToast(p, 'Saved'))) fail.push('EN add: no Saved toast');
  await p.waitForFunction(() => [...document.querySelectorAll('.pt-jokes-editor .cm-editor-row')].some((r) => r.textContent.includes('PLACEHOLDER test joke EN')), { timeout: 5000 })
    .then(() => out.push('new EN row appears in the list'))
    .catch(() => fail.push('new EN row missing'));

  // ---------- delete the English placeholder (confirm modal) ----------
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.pt-jokes-editor .cm-editor-row')].find((r) => r.textContent.includes('PLACEHOLDER test joke EN'));
    [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Edit').click();
  });
  await p.waitForSelector('.pt-editcard');
  await clickBtn(p, '.pt-editcard__actions button', 'Delete');
  await p.waitForSelector('.cm-modal', { timeout: 5000 }).then(() => out.push('delete confirm modal shown')).catch(() => fail.push('no delete confirm modal'));
  await p.evaluate(() => [...document.querySelectorAll('.cm-modal button')].find((b) => b.textContent.trim() === 'Delete').click());
  await sleep(400);
  w = lastJoke('DELETE');
  if (!w || !w.url.includes('id=eq.9999')) fail.push('delete request wrong: ' + (w && w.url));
  else out.push('confirmed delete -> DELETE jokes id=eq.9999');
  const gone = await p.evaluate(() => ![...document.querySelectorAll('.pt-jokes-editor .cm-editor-row')].some((r) => r.textContent.includes('PLACEHOLDER test joke EN')));
  if (!gone) fail.push('deleted EN row still visible');

  // ---------- edit a real English row's text (inline) ----------
  const realName = await p.evaluate(() => document.querySelector('.pt-jokes-editor .cm-editor-row__name').textContent.trim());
  await p.evaluate(() => {
    const row = document.querySelector('.pt-jokes-editor .cm-editor-row');
    [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Edit').click();
  });
  await p.waitForSelector('.pt-editcard textarea');
  await setInput(p, '.pt-editcard textarea', realName + ' (edited)');
  await clickBtn(p, '.pt-editcard__actions button', 'Save');
  await sleep(400);
  w = lastJoke('PATCH');
  if (!w || w.body.text !== realName + ' (edited)') fail.push('edit PATCH wrong: ' + JSON.stringify(w && w.body));
  else if (!/id=eq\.\d+/.test(w.url)) fail.push('edit PATCH not keyed by id: ' + w.url);
  else out.push('edit text inline -> PATCH jokes {text} keyed by id');
  if (!(await waitToast(p, 'Saved'))) fail.push('edit: no Saved toast');

  // ---------- is_active toggle (optimistic) ----------
  await p.evaluate(() => document.querySelector('.pt-jokes-editor .cm-editor-row .cm-toggle input').click());
  await sleep(400);
  w = lastJoke('PATCH');
  if (!w || w.body.is_active !== false) fail.push('toggle PATCH wrong: ' + JSON.stringify(w && w.body));
  else out.push('is_active toggle -> PATCH jokes {is_active:false}');
  if (!(await waitToast(p, 'Saved'))) fail.push('toggle: no Saved toast');

  // ---------- toggle rollback on failure ----------
  failWrites = true;
  const before = await p.evaluate(() => document.querySelectorAll('.pt-jokes-editor .cm-editor-row .cm-toggle input')[1].checked);
  await p.evaluate(() => document.querySelectorAll('.pt-jokes-editor .cm-editor-row .cm-toggle input')[1].click());
  if (!(await waitToast(p, "Didn't save"))) fail.push('rollback: no error toast');
  await sleep(300);
  const after = await p.evaluate(() => document.querySelectorAll('.pt-jokes-editor .cm-editor-row .cm-toggle input')[1].checked);
  if (after !== before) fail.push(`rollback failed: toggle stayed flipped (${before} -> ${after})`);
  else out.push('failed write -> toggle rolled back + error toast');
  failWrites = false;

  // ---------- reorder via drag handle (English) ----------
  if (enRows >= 2) {
    const order1 = await p.$$eval('.pt-jokes-editor .cm-editor-row__name', (els) => els.map((n) => n.textContent));
    /* Jokes rows wrap to several lines, so drag by the first row's full height
       (+ margin) to guarantee crossing into the next slot — a fixed small
       offset can round to "no move" when the dragged row is tall. */
    const geo = await p.evaluate(() => {
      const wrap = document.querySelector('.pt-jokes-editor .pt-rowwrap');
      const h = wrap.querySelector('.cm-editor-row__drag').getBoundingClientRect();
      return { rowH: wrap.getBoundingClientRect().height, hx: h.x + h.width / 2, hy: h.y + h.height / 2 };
    });
    await p.mouse.move(geo.hx, geo.hy);
    await p.mouse.down();
    await p.mouse.move(geo.hx, geo.hy + geo.rowH + 20, { steps: 10 });
    await p.mouse.up();
    await sleep(500);
    const order2 = await p.$$eval('.pt-jokes-editor .cm-editor-row__name', (els) => els.map((n) => n.textContent));
    const sortWrites = jokeWrites('PATCH').filter((x) => x.body && typeof x.body.sort_order === 'number');
    if (order1[0] === order2[0] || sortWrites.length < 1) fail.push(`reorder failed: "${order1[0]}" still first; sort writes: ${sortWrites.length}`);
    else out.push(`reorder -> "${order1[0]}" moved; ${sortWrites.length} sort_order PATCH(es) [${sortWrites.map((s) => s.body.sort_order).join(',')}]`);
    if (!(await waitToast(p, 'Saved'))) fail.push('reorder: no Saved toast');
  } else out.push(`reorder: skipped (only ${enRows} English row)`);

  // ---------- switch to Hindi, add a Devanagari joke ----------
  await p.evaluate(() => {
    const tabsList = [...document.querySelectorAll('.cm-tabs')];
    const langTabs = tabsList[tabsList.length - 1]; // jokes language tabs render last
    [...langTabs.querySelectorAll('.cm-tab')].find((t) => t.textContent.trim() === 'Hindi').click();
  });
  await sleep(300);
  await p.evaluate(() => [...document.querySelectorAll('.pt-jokes-editor .pt-rowgroup__head button')].find((b) => b.textContent.includes('Add joke')).click());
  await p.waitForSelector('.pt-editcard textarea');
  const hiSel = await p.$eval('.pt-editcard select', (el) => el.value);
  if (hiSel !== 'hi') fail.push('add card language default not hi on Hindi tab: ' + hiSel);
  const taIndic = await p.$eval('.pt-editcard textarea', (el) => el.getAttribute('data-indic'));
  await setInput(p, '.pt-editcard textarea', HI_TEXT);
  await sleep(150);
  const taFont = await p.$eval('.pt-editcard textarea', (el) => getComputedStyle(el).fontFamily);
  if (taIndic !== 'devanagari') fail.push('Hindi entry field missing data-indic=devanagari: ' + taIndic);
  else if (!/Noto Sans Devanagari/.test(taFont)) fail.push('Hindi entry field not in Noto face: ' + taFont);
  else out.push('Hindi entry field accepts + shows Devanagari (data-indic + Noto face)');
  await clickBtn(p, '.pt-editcard__actions button', 'Save');
  await sleep(400);
  w = lastJoke('POST');
  const hiBody = w && (Array.isArray(w.body) ? w.body[0] : w.body);
  if (!hiBody || hiBody.lang !== 'hi' || hiBody.text !== HI_TEXT || hiBody.is_active !== true) fail.push('HI add POST wrong: ' + JSON.stringify(hiBody));
  else out.push('add HI -> POST jokes {lang:hi, text:<devanagari>, is_active:true}');
  if (!(await waitToast(p, 'Saved'))) fail.push('HI add: no Saved toast');
  await p.close();

  // ---------- signed-out writes blocked for real (RLS) ----------
  {
    const headers = { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY, 'content-type': 'application/json', prefer: 'return=representation' };
    const one = await fetch(`${SB_URL}/rest/v1/jokes?select=id,is_active&limit=1`, { headers }).then((r) => r.json());
    const id = one[0] && one[0].id;
    const r1 = await fetch(`${SB_URL}/rest/v1/jokes?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify({ is_active: false }) });
    const rows1 = r1.ok ? await r1.json() : [];
    if (rows1.length) fail.push('RLS: anon PATCH updated a joke!');
    else out.push(`anon PATCH blocked by RLS (status ${r1.status}, 0 rows)`);
    const r2 = await fetch(`${SB_URL}/rest/v1/jokes`, { method: 'POST', headers, body: JSON.stringify({ lang: 'en', text: 'anon insert attempt' }) });
    const rows2 = r2.ok ? await r2.json() : [];
    if (rows2.length) fail.push('RLS: anon POST inserted a joke!');
    else out.push(`anon POST blocked by RLS (status ${r2.status}, 0 rows)`);
    const r3 = await fetch(`${SB_URL}/rest/v1/jokes?id=eq.${id}`, { method: 'DELETE', headers });
    const rows3 = r3.ok ? await r3.json() : [];
    if (rows3.length) fail.push('RLS: anon DELETE removed a joke!');
    else out.push(`anon DELETE blocked by RLS (status ${r3.status}, 0 rows)`);
  }
} catch (e) {
  fail.push('CRASHED: ' + (e.stack || e.message).slice(0, 400));
} finally {
  await browser.close();
}

console.log('--- RESULTS ---');
out.forEach((l) => console.log('  ' + l));
console.log('--- FAILURES ---');
console.log(fail.length ? fail.join('\n') : '(none)');
process.exit(fail.length ? 1 : 0);
