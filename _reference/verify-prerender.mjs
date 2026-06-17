// Verifies the prerendered build:
//  A) raw HTML (no JS) of each public route contains real readable content +
//     the right per-route canonical / data-prerendered marker, and the DS
//     bundle script was stripped.
//  B) each route hydrates cleanly in a headless browser at 375px (light + dark)
//     with NO React hydration errors, and stays interactive.
//  C) /admin is not prerendered and resolves noindex.
import http from 'http';
import puppeteer from 'puppeteer-core';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = 4321;
const BASE = `http://localhost:${PORT}`;
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

/* dist server WITH directory index — mirrors Vercel: /game -> dist/game/index.html */
function fileFor(p) {
  if (p.includes('..') || p === '/') return path.join(DIST, 'index.html');
  const direct = path.join(DIST, p);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const idx = path.join(DIST, p, 'index.html');
  if (existsSync(idx)) return idx;
  if (!path.extname(p)) return path.join(DIST, 'index.html');
  return direct;
}
function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const p = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = fileFor(p);
      if (!existsSync(file)) { res.statusCode = 404; res.end('nf'); return; }
      res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch (e) { res.statusCode = 500; res.end('err'); }
  });
  return new Promise((r) => server.listen(PORT, () => r(server)));
}

const RAW = [
  { path: '/', key: 'site', canonical: 'https://cheatmealshoib.com/', must: ['HOME OF', 'INDIAN', 'Regina', '4306 Dewdney', 'The Red Hulk', 'VISIT'] },
  { path: '/game/', key: 'game', canonical: 'https://cheatmealshoib.com/game', must: ['STACKER', 'While you wait', 'TOP STACKERS'] },
  { path: '/jokes/', key: 'jokes', canonical: 'https://cheatmealshoib.com/jokes', must: ['JOKES', 'cm-joke-card__text'] },
];

let fails = 0;
const bad = (m) => { console.log('  ✗ ' + m); fails++; };
const good = (m) => console.log('  ✓ ' + m);

async function phaseA() {
  console.log('\n=== A) raw prerendered HTML (no JS) ===');
  for (const r of RAW) {
    console.log(`\n${r.path}`);
    const html = await (await fetch(BASE + r.path)).text();
    if (html.includes('<div id="root"></div>')) bad('empty #root — NOT prerendered');
    else good('#root has content');
    for (const s of r.must) (html.includes(s) ? good : bad)(`contains "${s}"`);
    (html.includes(`data-prerendered="${r.key}"`) ? good : bad)(`data-prerendered="${r.key}"`);
    (html.includes(`<link rel="canonical" href="${r.canonical}">`) ? good : bad)(`canonical ${r.canonical}`);
    (!html.includes('_ds_bundle') ? good : bad)('DS bundle script stripped');
    (html.includes('assets/index-') ? good : bad)('still references the SPA entry (boots/hydrates)');
  }
}

async function hydrationRun(browser, url, { dark = false, width = 375 } = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.setViewport({ width, height: 812, deviceScaleFactor: 2, isMobile: width < 768, hasTouch: width < 768 });
  /* Set the target theme explicitly (and isolate from the previous run's
     localStorage) before the measured navigation, so the FOUC script applies
     a deterministic theme. */
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('cm-theme', t), dark ? 'dark' : 'light');
  await page.goto(url + '?cb=' + (dark ? 'd' : 'l') + width, { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500); // allow hydration + post-mount effects
  const info = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    rootHasContent: !!document.getElementById('root') && document.getElementById('root').childElementCount > 0,
    errorCard: document.body.textContent.includes('Something went wrong'),
    title: document.title,
    robots: document.querySelector('meta[name="robots"]')?.content || null,
  }));
  const hydrationErrs = errors.filter((e) => /hydrat|did not match|Minified React error #(418|419|420|421|422|423|424|425)|server (HTML|rendered)/i.test(e));
  await page.close();
  return { info, errors, hydrationErrs };
}

async function phaseB(browser) {
  console.log('\n=== B) hydration @375px (light + dark) ===');
  for (const r of RAW) {
    for (const dark of [false, true]) {
      const label = `${r.path} ${dark ? 'dark ' : 'light'}`;
      const { info, hydrationErrs, errors } = await hydrationRun(browser, BASE + r.path, { dark });
      const okTheme = info.theme === (dark ? 'dark' : 'light');
      console.log(`\n${label}  theme=${info.theme} title="${info.title}"`);
      (info.rootHasContent ? good : bad)('app rendered (root has content)');
      (!info.errorCard ? good : bad)('no error card');
      (okTheme ? good : bad)(`theme is ${dark ? 'dark' : 'light'}`);
      (hydrationErrs.length === 0 ? good : bad)(`no hydration errors${hydrationErrs.length ? ' — ' + hydrationErrs[0].slice(0, 120) : ''}`);
      if (errors.length) console.log('    (console errors: ' + errors.length + (errors.length ? ' — e.g. ' + errors[0].slice(0, 90) : '') + ')');
    }
  }

  /* Desktop (1280px): routes are prerendered at mobile, so a hydration
     re-render to the desktop layout is EXPECTED here — informational only.
     What must hold is that it still renders correctly with no error card. */
  console.log('\n--- desktop / @1280px (mobile-prerendered → re-render expected, informational) ---');
  const { info, hydrationErrs } = await hydrationRun(browser, BASE + '/', { dark: false, width: 1280 });
  (info.rootHasContent ? good : bad)('app rendered (root has content)');
  (!info.errorCard ? good : bad)('no error card');
  console.log(`  hydration notices: ${hydrationErrs.length} (expected ≥0; desktop reflows to desktop layout)`);
}

async function phaseC(browser) {
  console.log('\n=== C) /admin excluded ===');
  (!existsSync(path.join(DIST, 'admin', 'index.html')) ? good : bad)('no dist/admin/index.html (not prerendered)');
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1500);
  const m = await page.evaluate(() => ({ robots: document.querySelector('meta[name="robots"]')?.content || null, title: document.title }));
  (m.robots && /noindex/.test(m.robots) ? good : bad)(`/admin robots = ${m.robots}`);
  console.log('  /admin title:', m.title);
  await page.close();
}

const server = await startServer();
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
try {
  await phaseA();
  await phaseB(browser);
  await phaseC(browser);
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${fails === 0 ? 'ALL PASS ✓' : fails + ' CHECK(S) FAILED ✗'}`);
process.exit(fails === 0 ? 0 : 1);
