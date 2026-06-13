// Admin editor verification at phone width (390x844).
// Auth is mocked (fake session); PostgREST WRITES are intercepted with
// CORS-correct success/failure responses and their bodies captured for
// assertions; READS hit the real database. Final section proves RLS
// blocks anon writes for real.
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';
const out = [];
const fail = [];

const ANON_KEY = readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8')
  .split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY='))
  .replace('VITE_SUPABASE_ANON_KEY=', '').trim();
const SB_URL = readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8')
  .split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_URL='))
  .replace('VITE_SUPABASE_URL=', '').trim();

// test image: 1600x900 PNG
const TEST_IMG = fileURLToPath(new URL('./shots/test-photo.png', import.meta.url));
{
  const png = new PNG({ width: 1600, height: 900 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 251; png.data[i + 1] = 4; png.data[i + 2] = 3; png.data[i + 3] = 255;
  }
  writeFileSync(TEST_IMG, PNG.sync.write(png));
}

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

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

const writes = []; // { method, url, body }
let failWrites = false;
let storageUploads = 0;

async function instrument(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();
    if (method === 'OPTIONS' && (url.includes('/rest/v1/') || url.includes('/auth/v1/') || url.includes('/storage/v1/'))) {
      return req.respond({ status: 204, headers: CORS });
    }
    if (url.includes('/auth/v1/token')) {
      return req.respond({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(fakeSession()) });
    }
    if (url.includes('/auth/v1/logout')) {
      return req.respond({ status: 204, headers: CORS });
    }
    if (url.includes('/storage/v1/object/menu-photos/')) {
      storageUploads++;
      writes.push({ method, url, contentType: req.headers()['content-type'] });
      return req.respond({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ Key: 'menu-photos/x' }) });
    }
    if (url.includes('/rest/v1/') && method === 'GET') {
      /* the fake session JWT would 401 against the real API — replay reads
         with the anon key so the editor loads real data */
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

const lastWrite = () => writes[writes.length - 1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitToast(p, text) {
  try {
    await p.waitForFunction(
      (t) => document.querySelector('.pt-toastdock .cm-toast')?.textContent.includes(t),
      { timeout: 5000 },
      text
    );
    return true;
  } catch {
    return false;
  }
}

async function setInput(p, selector, value) {
  await p.evaluate((sel, v) => {
    const inp = document.querySelector(sel);
    const proto = inp.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(inp, v);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, value);
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--force-device-scale-factor=1'] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 375, height: 812 });
  p.on('pageerror', (e) => fail.push('pageerror: ' + e.message.slice(0, 120)));
  await instrument(p);

  // ---------- sign in, editor loads real data ----------
  await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
  await p.waitForSelector('.pt-login');
  await p.type('.pt-login__card .cm-field:nth-of-type(1) .cm-input', 'staff@cheatmeals.ca');
  await p.type('.pt-login__card .cm-field:nth-of-type(2) .cm-input', 'x');
  await p.evaluate(() => [...document.querySelectorAll('.pt-login__card button')].find((b) => b.textContent.includes('Sign In')).click());
  await p.waitForSelector('.cm-editor-row', { timeout: 15000 });
  const rowCount = await p.$$eval('.cm-editor-row', (els) => els.length);
  /* compare against the live database, not a hard-coded count */
  const liveAloo = await fetch(`${SB_URL}/rest/v1/items?select=id&category_id=eq.1`, { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } }).then((r) => r.json());
  out.push(`editor loaded with ${rowCount} item rows (live DB has ${liveAloo.length})`);
  if (rowCount !== liveAloo.length) fail.push(`expected ${liveAloo.length} Aloo rows, got ${rowCount}`);
  /* pick dynamic targets so the harness survives data edits */
  const targetName = await p.evaluate(() => document.querySelector('.cm-editor-row .cm-editor-row__name').textContent);

  // ---------- edit price (13.49) ----------
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Aloo 420'));
    row.querySelector('button.cm-btn').click();
  });
  await p.waitForSelector('.pt-editcard');
  await setInput(p, '.pt-editcard .cm-price .cm-input', '13.49');
  await p.evaluate(() => [...document.querySelectorAll('.pt-editcard__actions button')].find((b) => b.textContent === 'Save').click());
  await sleep(400);
  let w = writes.filter((x) => x.method === 'PATCH' && x.url.includes('/items')).pop();
  if (!w || w.body.price !== 13.49 || w.body.name !== 'Aloo 420') fail.push('price edit PATCH wrong: ' + JSON.stringify(w && w.body));
  else out.push('price edit -> PATCH items {price: 13.49}');
  if (!(await waitToast(p, 'Saved'))) fail.push('price edit: no Saved toast');
  await p.waitForFunction(() => [...document.querySelectorAll('.cm-editor-row')].some((r) => r.textContent.includes('$13.49')), { timeout: 5000 })
    .then(() => out.push('row shows $13.49'))
    .catch(() => fail.push('row does not show $13.49'));

  // ---------- clear price -> null ("N/A") ----------
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Aloo 420'));
    row.querySelector('button.cm-btn').click();
  });
  await p.waitForSelector('.pt-editcard');
  await setInput(p, '.pt-editcard .cm-price .cm-input', '');
  await p.evaluate(() => [...document.querySelectorAll('.pt-editcard__actions button')].find((b) => b.textContent === 'Save').click());
  await sleep(400);
  w = writes.filter((x) => x.method === 'PATCH' && x.url.includes('/items')).pop();
  if (!w || w.body.price !== null) fail.push('null price PATCH wrong: ' + JSON.stringify(w && w.body));
  else out.push('cleared price -> PATCH {price: null}');
  await p.waitForFunction(() => [...document.querySelectorAll('.cm-editor-row')].some((r) => r.textContent.includes('Aloo 420') && r.textContent.includes('N/A')), { timeout: 5000 })
    .then(() => out.push('row renders N/A'))
    .catch(() => fail.push('row does not render N/A'));

  // ---------- availability toggle (optimistic) ----------
  await p.evaluate((nm) => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes(nm));
    row.querySelector('.cm-toggle input').click();
  }, targetName);
  await sleep(400);
  w = writes.filter((x) => x.method === 'PATCH' && x.url.includes('/items')).pop();
  if (!w || w.body.is_available !== false) fail.push('availability PATCH wrong: ' + JSON.stringify(w && w.body));
  else out.push('availability toggle -> PATCH {is_available: false}');
  if (!(await waitToast(p, 'Saved'))) fail.push('availability: no Saved toast');

  // ---------- availability rollback on failure ----------
  failWrites = true;
  const beforeState = await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Aloo Anarkali'));
    return row.querySelector('.cm-toggle input').checked;
  });
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Aloo Anarkali'));
    row.querySelector('.cm-toggle input').click();
  });
  if (!(await waitToast(p, "Didn't save"))) fail.push('rollback: no error toast');
  await sleep(300);
  const afterState = await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Aloo Anarkali'));
    return row.querySelector('.cm-toggle input').checked;
  });
  if (afterState !== beforeState) fail.push(`rollback failed: toggle stayed flipped (${beforeState} -> ${afterState})`);
  else out.push('failed write -> toggle rolled back + error toast');
  failWrites = false;

  // ---------- add item (first group, whatever it is) ----------
  const groupTitle = await p.evaluate(() => {
    const g = document.querySelector('.pt-rowgroup');
    const label = g.querySelector('.pt-rowgroup__head .cm-label').textContent;
    [...g.querySelectorAll('button')].find((b) => b.textContent.includes('Add item')).click();
    return label.split('·')[0].trim();
  });
  await p.waitForSelector('.pt-editcard');
  await setInput(p, '.pt-editcard .cm-field:nth-of-type(1) .cm-input', 'Test Burger');
  await setInput(p, '.pt-editcard .cm-price .cm-input', '9.99');
  await p.evaluate(() => [...document.querySelectorAll('.pt-editcard__actions button')].find((b) => b.textContent === 'Save').click());
  await sleep(400);
  w = writes.filter((x) => x.method === 'POST' && x.url.includes('/items')).pop();
  const wantSection = groupTitle === 'Items' ? null : groupTitle;
  if (!w || w.body.name !== 'Test Burger' || w.body.price !== 9.99 || w.body.section !== wantSection || typeof w.body.sort_order !== 'number') {
    fail.push('add item POST wrong: ' + JSON.stringify(w && w.body));
  } else out.push(`add item -> POST {name, price, section: ${w.body.section}, sort_order: ${w.body.sort_order}}`);
  await p.waitForFunction(() => [...document.querySelectorAll('.cm-editor-row')].some((r) => r.textContent.includes('Test Burger')), { timeout: 5000 })
    .then(() => out.push('new row appears'))
    .catch(() => fail.push('new row missing'));

  // ---------- delete (with confirm modal) ----------
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Test Burger'));
    row.querySelector('button.cm-btn').click();
  });
  await p.waitForSelector('.pt-editcard');
  await p.evaluate(() => [...document.querySelectorAll('.pt-editcard__actions button')].find((b) => b.textContent === 'Delete').click());
  await p.waitForSelector('.cm-modal', { timeout: 5000 })
    .then(() => out.push('delete confirm modal shown'))
    .catch(() => fail.push('no delete confirm modal'));
  await p.evaluate(() => [...document.querySelectorAll('.cm-modal__actions button')].find((b) => b.textContent === 'Delete').click());
  await sleep(400);
  w = writes.filter((x) => x.method === 'DELETE').pop();
  if (!w || !w.url.includes('id=eq.9999')) fail.push('delete request wrong: ' + (w && w.url));
  else out.push('confirmed delete -> DELETE id=eq.9999');
  const gone = await p.evaluate(() => ![...document.querySelectorAll('.cm-editor-row')].some((r) => r.textContent.includes('Test Burger')));
  if (!gone) fail.push('deleted row still visible');

  // ---------- badges ----------
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes('Aloo 420'));
    row.querySelector('button.cm-btn').click();
  });
  await p.waitForSelector('.pt-editcard');
  await p.evaluate(() => [...document.querySelectorAll('.pt-badgepick button')].find((b) => b.textContent.includes('Extra Spicy')).click());
  await p.evaluate(() => [...document.querySelectorAll('.pt-badgepick button')].find((b) => b.textContent.includes("Chef's Pick")).click());
  await p.evaluate(() => [...document.querySelectorAll('.pt-editcard__actions button')].find((b) => b.textContent === 'Save').click());
  await sleep(400);
  w = writes.filter((x) => x.method === 'PATCH' && x.url.includes('/items')).pop();
  const wantBadges = [{ kind: 'pick', label: "Chef's Pick" }, { kind: 'spicy', level: 2, label: 'Extra Spicy' }];
  if (!w || JSON.stringify(w.body.badges) !== JSON.stringify(wantBadges)) fail.push('badges PATCH wrong: ' + JSON.stringify(w && w.body.badges));
  else out.push('badge picker -> PATCH badges jsonb [pick, spicy level 2]');

  // ---------- reorder via drag handle ----------
  const order1 = await p.$$eval('.pt-rowgroup', (gs) => {
    const g = gs.find((x) => x.textContent.includes('SPICY ALOO'));
    return [...g.querySelectorAll('.cm-editor-row__name')].map((n) => n.textContent);
  });
  const handle = await p.evaluateHandle(() => {
    const g = [...document.querySelectorAll('.pt-rowgroup')].find((x) => x.textContent.includes('SPICY ALOO'));
    return g.querySelectorAll('.pt-rowwrap')[0].querySelector('.cm-editor-row__drag');
  });
  const box = await handle.asElement().boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 70, { steps: 8 });
  await p.mouse.up();
  await sleep(500);
  const order2 = await p.$$eval('.pt-rowgroup', (gs) => {
    const g = gs.find((x) => x.textContent.includes('SPICY ALOO'));
    return [...g.querySelectorAll('.cm-editor-row__name')].map((n) => n.textContent);
  });
  const sortWrites = writes.filter((x) => x.method === 'PATCH' && x.body && typeof x.body.sort_order === 'number');
  if (order1[0] === order2[0] || sortWrites.length < 2) {
    fail.push(`reorder failed: ${order1[0]} still first; sort writes: ${sortWrites.length}`);
  } else {
    out.push(`reorder: "${order1[0]}" -> position 2, ${sortWrites.length} sort_order PATCHes [${sortWrites.map((s) => s.body.sort_order).join(',')}]`);
  }
  if (!(await waitToast(p, 'Saved'))) fail.push('reorder: no Saved toast');

  // ---------- category note ----------
  await setInput(p, '.pt-notefield textarea', 'Fresh note from the test kitchen');
  await p.evaluate(() => [...document.querySelectorAll('.pt-notefield button')].find((b) => b.textContent.includes('Save note')).click());
  await sleep(400);
  w = writes.filter((x) => x.method === 'PATCH' && x.url.includes('/categories')).pop();
  if (!w || w.body.note !== 'Fresh note from the test kitchen') fail.push('note PATCH wrong: ' + JSON.stringify(w && w.body));
  else out.push('category note -> PATCH categories {note}');

  // ---------- photo upload ----------
  await p.evaluate((nm) => {
    const row = [...document.querySelectorAll('.cm-editor-row')].find((r) => r.textContent.includes(nm));
    row.querySelector('button.cm-btn').click();
  }, targetName);
  await p.waitForSelector('.pt-editcard');
  const fileInput = await p.$('.pt-editcard input[type=file]');
  await fileInput.uploadFile(TEST_IMG);
  await p.waitForSelector('.pt-editcard__photo', { timeout: 15000 })
    .then(() => out.push('photo preview rendered in edit card'))
    .catch(() => fail.push('no photo preview'));
  await sleep(300);
  const up = writes.find((x) => x.url.includes('/storage/v1/object/menu-photos/'));
  if (!up || !/\/items\/\d+-\d+\.webp$/.test(up.url)) fail.push('storage upload wrong: ' + JSON.stringify(up));
  else out.push('upload -> storage menu-photos/items/<id>-<ts>.webp');
  w = writes.filter((x) => x.method === 'PATCH' && x.url.includes('/items')).pop();
  if (!w || !String(w.body.photo_url || '').includes('/storage/v1/object/public/menu-photos/items/')) {
    fail.push('photo_url PATCH wrong: ' + JSON.stringify(w && w.body));
  } else out.push('photo public URL saved to photo_url');
  await p.evaluate(() => [...document.querySelectorAll('.pt-editcard__actions button')].find((b) => b.textContent === 'Cancel').click());

  // ---------- site content ----------
  await p.waitForFunction(() => {
    const tabs = document.querySelector('.cm-tabs'); // view switcher is the first Tabs
    const t = tabs && [...tabs.querySelectorAll('.cm-tab')].find((x) => x.textContent.includes('Site content'));
    if (t) { t.click(); return true; }
    return false;
  }, { timeout: 8000 });
  await p.waitForSelector('.pt-sitefields');
  await setInput(p, '.pt-sitefields .cm-input', 'Fresh announcement from the test kitchen');
  await p.evaluate(() => [...document.querySelectorAll('.pt-sitefields button')].find((b) => b.textContent.includes('Save announcement')).click());
  await sleep(400);
  w = writes.filter((x) => x.method === 'POST' && x.url.includes('/site_content')).pop();
  const body0 = Array.isArray(w && w.body) ? w.body[0] : w && w.body;
  if (!body0 || body0.key !== 'announcement' || body0.value !== 'Fresh announcement from the test kitchen') {
    fail.push('site_content upsert wrong: ' + JSON.stringify(w && w.body));
  } else out.push('announcement -> upsert site_content');
  await p.close();

  // ---------- public card renders a photo (read-side) ----------
  {
    const p2 = await browser.newPage();
    await p2.setViewport({ width: 390, height: 844 });
    await p2.setRequestInterception(true);
    p2.on('request', async (req) => {
      const url = req.url();
      /* replay ALL reads with the anon key — the fake admin session in this
         browser profile would 401 against the real API */
      if (req.method() === 'GET' && url.includes('/rest/v1/')) {
        const r = await fetch(url, { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } });
        let body = await r.text();
        if (url.includes('/rest/v1/items')) {
          const rows = JSON.parse(body);
          for (const row of rows) if (row.name === 'Aloo 420') row.photo_url = SB_URL + '/storage/v1/object/public/menu-photos/items/test.webp';
          body = JSON.stringify(rows);
        }
        return req.respond({ status: r.status, headers: { ...CORS, 'content-type': 'application/json' }, body });
      }
      req.continue();
    });
    await p2.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p2.waitForSelector('#menu .cm-menu-card');
    const img = await p2.evaluate(() => {
      const card = [...document.querySelectorAll('#menu .cm-menu-card')].find((c) => c.textContent.includes('Aloo 420'));
      const im = card && card.querySelector('.cm-menu-card__media img');
      return im ? im.getAttribute('src') : null;
    });
    if (!img || !img.includes('menu-photos')) fail.push('public card photo missing: ' + img);
    else out.push('public menu card renders the photo from photo_url');
    /* halftone fallback shows on media cards without an image — only "The
       Red Hulk" always shows media, so skip gracefully if it's off the menu */
    const halftone = await p2.evaluate(() => {
      const card = [...document.querySelectorAll('#menu .cm-menu-card')].find((c) => c.textContent.includes('The Red Hulk'));
      if (!card) return 'absent';
      return card.querySelector('.cm-menu-card__media.cm-halftone') ? 'ok' : 'missing';
    });
    if (halftone === 'missing') fail.push('halftone fallback missing on photo-less media card');
    else if (halftone === 'absent') out.push('halftone check skipped (The Red Hulk not on the menu)');
    else out.push('halftone fallback intact for cards without photos');
    await p2.close();
  }

  // ---------- signed-out writes blocked for real (RLS) ----------
  {
    const headers = { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY, 'content-type': 'application/json', prefer: 'return=representation' };
    const r1 = await fetch(`${SB_URL}/rest/v1/items?id=eq.1`, { method: 'PATCH', headers, body: JSON.stringify({ price: 1.23 }) });
    const rows1 = r1.ok ? await r1.json() : [];
    if (rows1.length) fail.push('RLS: anon PATCH updated rows!');
    else out.push(`anon PATCH blocked by RLS (status ${r1.status}, 0 rows)`);
    const r2 = await fetch(`${SB_URL}/storage/v1/object/menu-photos/items/anon-test.webp`, { method: 'POST', headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY, 'content-type': 'image/webp' }, body: Buffer.from([0]) });
    if (r2.ok) fail.push('RLS: anon storage upload succeeded!');
    else out.push(`anon storage upload blocked (status ${r2.status})`);
  }
} catch (e) {
  fail.push('CRASHED: ' + e.message.slice(0, 300));
} finally {
  await browser.close();
}

console.log('--- RESULTS ---');
out.forEach((l) => console.log('  ' + l));
console.log('--- FAILURES ---');
console.log(fail.length ? fail.join('\n') : '(none)');
process.exit(fail.length ? 1 : 0);
