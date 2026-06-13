// Public /jokes checks: renders from live data (both themes x viewports),
// the bag-shuffle never repeats until the language pool is exhausted, the
// language switcher persists across reload, Devanagari renders in the Noto
// face and that face loads ONLY on this route (the homepage never requests
// it), and a Supabase outage still shows the bundled fallback.
// Requires the dev server on :5173 (`npm run dev`).
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';
const SHOTS = fileURLToPath(new URL('./shots/jokes', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

const env = readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8');
const ANON_KEY = env.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY=')).replace('VITE_SUPABASE_ANON_KEY=', '').trim();
const SB_URL = env.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_URL=')).replace('VITE_SUPABASE_URL=', '').trim();

const out = [];
const fail = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const liveJokes = await fetch(
  `${SB_URL}/rest/v1/jokes?select=lang,text&is_active=eq.true&order=sort_order`,
  { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } }
).then((r) => r.json());
const enPool = liveJokes.filter((j) => j.lang === 'en');
const hiPool = liveJokes.filter((j) => j.lang === 'hi');
out.push(`live jokes: ${liveJokes.length} active (en ${enPool.length}, hi ${hiPool.length})`);

const readJoke = (p) => p.$eval('.cm-joke-card__text', (el) => el.textContent.trim());
const hit = (p) => p.evaluate(() => document.querySelector('.pt-jokes-actions .cm-btn').click());

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  // ---------- 1. renders from live data; reads the jokes table ----------
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812 });
    const cerr = [];
    p.on('console', (m) => { if (m.type() === 'error') cerr.push(m.text().slice(0, 160)); });
    p.on('pageerror', (e) => cerr.push('pageerror: ' + e.message.slice(0, 160)));
    let jokesReq = null;
    await p.setRequestInterception(true);
    p.on('request', (req) => { if (req.url().includes('/rest/v1/jokes')) jokesReq = req.url(); req.continue(); });
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0', timeout: 20000 });
    await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
    const txt = await readJoke(p);
    if (!jokesReq) fail.push('no /rest/v1/jokes request observed');
    else if (!decodeURIComponent(jokesReq).includes('is_active=eq.true')) fail.push('jokes query missing is_active filter: ' + jokesReq);
    else out.push('jokes read filters server-side: ...' + decodeURIComponent(jokesReq).split('?')[1]);
    if (!txt) fail.push('joke card empty on load');
    else out.push(`/jokes shows a joke ("${txt.slice(0, 38)}…")`);
    if (cerr.length) fail.push('console errors on /jokes: ' + cerr.join(' | '));
    else out.push('/jokes console clean');
    await p.close();
  }

  // ---------- 2. both themes x viewports ----------
  for (const vp of [{ w: 375, h: 812, n: 'mobile' }, { w: 1280, h: 900, n: 'desktop' }]) {
    for (const theme of ['light', 'dark']) {
      const p = await browser.newPage();
      await p.setViewport({ width: vp.w, height: vp.h });
      await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('cm-theme', t); } catch (e) {} }, theme);
      await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0', timeout: 20000 });
      await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
      await sleep(200);
      const t = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (t !== theme) fail.push(`viewport ${vp.n}: theme ${t} != ${theme}`);
      await p.screenshot({ path: `${SHOTS}/jokes-${vp.n}-${theme}.png`, fullPage: true });
      await p.close();
    }
  }
  out.push('screenshots: jokes-{mobile,desktop}-{light,dark}.png in shots/jokes/');

  // ---------- 3. bag-shuffle: no repeat until pool exhausts ----------
  if (enPool.length >= 2) {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812 });
    await p.evaluateOnNewDocument(() => { try { localStorage.removeItem('cm-jokes-seen'); localStorage.setItem('cm-jokes-lang', 'en'); } catch (e) {} });
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0', timeout: 20000 });
    await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
    const N = enPool.length;
    const seen = [await readJoke(p)];
    for (let i = 1; i < N; i++) { await hit(p); await sleep(110); seen.push(await readJoke(p)); }
    const uniq = new Set(seen);
    if (uniq.size !== N) fail.push(`shuffle repeated within a bag: ${N} draws, ${uniq.size} unique`);
    else out.push(`bag-shuffle: ${N} draws all unique (no repeat until the pool is exhausted)`);
    const last = seen[seen.length - 1];
    await hit(p); await sleep(110);
    const next = await readJoke(p);
    if (next === last) fail.push('shuffle: back-to-back repeat across the reset');
    else out.push('bag-shuffle: reshuffles after exhaustion without a back-to-back repeat');
    await p.close();
  } else {
    out.push(`bag-shuffle: skipped (en pool ${enPool.length} < 2)`);
  }

  // ---------- 4. language switcher persists ----------
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812 });
    /* Set state on the page (NOT evaluateOnNewDocument — that re-runs on the
       reload and would wipe the very value we're testing). */
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0', timeout: 20000 });
    await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
    const hasSwitcher = await p.$('.pt-jokes-langs');
    if (!hasSwitcher) {
      out.push('language switcher: hidden (only one active language)');
    } else {
      // start from a known state (English), then switch to Hindi
      await p.evaluate(() => { const en = [...document.querySelectorAll('.pt-jokes-lang')].find((b) => b.getAttribute('lang') === 'en'); if (en) en.click(); });
      await sleep(150);
      const clicked = await p.evaluate(() => {
        const pill = [...document.querySelectorAll('.pt-jokes-lang')].find((b) => b.getAttribute('lang') === 'hi');
        if (!pill) return false; pill.click(); return true;
      });
      if (!clicked) { fail.push('no Hindi pill present to switch to'); }
      else {
        await sleep(200);
        const stored = await p.evaluate(() => localStorage.getItem('cm-jokes-lang'));
        if (stored !== 'hi') fail.push('lang not persisted: ' + stored);
        await p.reload({ waitUntil: 'networkidle0' });
        await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
        const onPill = await p.evaluate(() => { const a = document.querySelector('.pt-jokes-lang--on'); return a ? a.getAttribute('lang') : null; });
        const indic = await p.$eval('.cm-joke-card__text', (el) => el.getAttribute('data-indic'));
        if (onPill !== 'hi') fail.push('after reload, active pill not Hindi: ' + onPill);
        else if (indic !== 'devanagari') fail.push('after reload, joke not Devanagari: ' + indic);
        else out.push('language switcher persists Hindi across reload (pill + Devanagari joke)');
      }
    }
    await p.close();
  }

  // ---------- 5. Devanagari renders + the face loads on /jokes ----------
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812 });
    const fontReqs = [];
    p.on('request', (req) => { const u = req.url(); if (u.includes('fonts-indic.css') || u.includes('noto-sans-devanagari')) fontReqs.push(u); });
    await p.evaluateOnNewDocument(() => { try { localStorage.setItem('cm-jokes-lang', 'hi'); } catch (e) {} });
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0', timeout: 20000 });
    await p.waitForSelector('.cm-joke-card__text[data-indic="devanagari"]', { timeout: 15000 });
    await sleep(400);
    const font = await p.$eval('.cm-joke-card__text[data-indic="devanagari"]', (el) => getComputedStyle(el).fontFamily);
    const glyphs = await p.$eval('.cm-joke-card__text[data-indic="devanagari"]', (el) => /[ऀ-ॿ]/.test(el.textContent) && el.getBoundingClientRect().width > 0);
    if (!/Noto Sans Devanagari/.test(font)) fail.push('Hindi joke not in Noto face: ' + font);
    else if (!glyphs) fail.push('Hindi joke has no Devanagari glyphs / zero width');
    else out.push('Devanagari renders in Noto Sans Devanagari (glyphs present, non-zero width)');
    if (!fontReqs.some((u) => u.includes('fonts-indic.css'))) fail.push('/jokes did not load tokens/fonts-indic.css');
    else out.push('/jokes loads tokens/fonts-indic.css' + (fontReqs.some((u) => u.includes('noto-sans-devanagari')) ? ' + the woff2 (Hindi shown)' : ''));
    await p.close();
  }

  // ---------- 6. homepage pulls NO Devanagari font ----------
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812 });
    const fontReqs = [];
    p.on('request', (req) => { const u = req.url(); if (u.includes('fonts-indic.css') || u.includes('noto-sans-devanagari')) fontReqs.push(u); });
    await p.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
    await p.waitForSelector('#menu .cm-menu-card', { timeout: 20000 });
    await sleep(400);
    if (fontReqs.length) fail.push('homepage requested Indic font(s): ' + fontReqs.join(', '));
    else out.push('homepage initial load: zero Indic-font requests (route-scoped; Lighthouse font budget unchanged)');
    await p.close();
  }

  // ---------- 7. Supabase-down fallback ----------
  {
    const p = await browser.newPage();
    await p.setViewport({ width: 375, height: 812 });
    await p.setRequestInterception(true);
    p.on('request', (req) => { if (req.url().includes('supabase.co')) req.abort('internetdisconnected'); else req.continue(); });
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0', timeout: 20000 });
    await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
    const txt = await readJoke(p);
    const isEmptyState = /workshopping them in the kitchen/i.test(txt);
    if (!txt || isEmptyState) fail.push('offline: no bundled joke shown (empty state)');
    else out.push(`offline: bundled fallback joke renders ("${txt.slice(0, 38)}…")`);
    await p.close();
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
