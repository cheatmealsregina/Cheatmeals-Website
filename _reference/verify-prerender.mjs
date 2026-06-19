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
  { path: '/', key: 'site', canonical: 'https://cheatmealshoib.com/', titleHas: ['CheatMeals', 'Indian Burgers', 'Regina'], must: ['HOME OF', 'INDIAN', 'Regina', '4306 Dewdney', 'The Red Hulk', 'VISIT'] },
  { path: '/game/', key: 'game', canonical: 'https://cheatmealshoib.com/game', titleHas: ['Patty Stacker', 'CheatMeals', 'Regina'], must: ['STACKER', 'While you wait', 'TOP STACKERS'] },
  { path: '/jokes/', key: 'jokes', canonical: 'https://cheatmealshoib.com/jokes', titleHas: ['Jokes', 'CheatMeals', 'Regina'], must: ['JOKES', 'cm-joke-card__text'] },
];

let fails = 0;
const bad = (m) => { console.log('  ✗ ' + m); fails++; };
const good = (m) => console.log('  ✓ ' + m);

/* head/element extractors that tolerate attribute order (browser-serialized) */
const titleOf = (h) => (h.match(/<title>([^<]*)<\/title>/i) || [])[1] || null;
const canonicalOf = (h) => { const t = (h.match(/<link[^>]*rel="canonical"[^>]*>/i) || [])[0]; return t ? (t.match(/href="([^"]*)"/i) || [])[1] : null; };
function metaContent(h, attr, val) {
  const esc = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = (h.match(new RegExp('<meta[^>]*\\b' + attr + '="' + esc + '"[^>]*>', 'i')) || [])[0];
  return tag ? ((tag.match(/content="([^"]*)"/i) || [])[1] ?? null) : null;
}
const h1Text = (h) => { const m = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null; };

const collected = { title: [], description: [], canonical: [] };

async function phaseA() {
  console.log('\n=== A) raw prerendered HTML — content + per-route metadata (no JS) ===');
  for (const r of RAW) {
    console.log(`\n${r.path}`);
    const html = await (await fetch(BASE + r.path)).text();
    if (html.includes('<div id="root"></div>')) bad('empty #root — NOT prerendered');
    else good('#root has content');
    for (const s of r.must) (html.includes(s) ? good : bad)(`body contains "${s}"`);
    (html.includes(`data-prerendered="${r.key}"`) ? good : bad)(`data-prerendered="${r.key}"`);
    (!html.includes('_ds_bundle') ? good : bad)('DS bundle script stripped');

    const title = titleOf(html);
    const desc = metaContent(html, 'name', 'description');
    const canon = canonicalOf(html);
    collected.title.push(title); collected.description.push(desc); collected.canonical.push(canon);
    console.log(`  title: ${title}`);
    (title ? good : bad)('has <title>');
    for (const w of r.titleHas) ((title || '').toLowerCase().includes(w.toLowerCase()) ? good : bad)(`title includes "${w}"`);
    (desc && desc.length > 50 ? good : bad)(`has meta description (${desc ? desc.length : 0} chars)`);
    (canon === r.canonical ? good : bad)(`self-canonical ${r.canonical}`);

    /* complete OpenGraph + Twitter set */
    const og = {
      'og:title': metaContent(html, 'property', 'og:title'),
      'og:description': metaContent(html, 'property', 'og:description'),
      'og:url': metaContent(html, 'property', 'og:url'),
      'og:type': metaContent(html, 'property', 'og:type'),
      'og:image': metaContent(html, 'property', 'og:image'),
      'og:image:alt': metaContent(html, 'property', 'og:image:alt'),
      'og:locale': metaContent(html, 'property', 'og:locale'),
      'twitter:card': metaContent(html, 'name', 'twitter:card'),
      'twitter:title': metaContent(html, 'name', 'twitter:title'),
      'twitter:description': metaContent(html, 'name', 'twitter:description'),
      'twitter:image': metaContent(html, 'name', 'twitter:image'),
      'twitter:image:alt': metaContent(html, 'name', 'twitter:image:alt'),
    };
    for (const [k, v] of Object.entries(og)) (v ? good : bad)(`${k} present`);
    (og['og:url'] === r.canonical ? good : bad)('og:url matches canonical');
    (og['og:image'] === 'https://cheatmealshoib.com/assets/og-image.png' ? good : bad)('og:image = /assets/og-image.png (1200×630)');

    /* structured data: Restaurant JSON-LD on home only */
    const ld = (html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i) || [])[1];
    if (r.key === 'site') {
      (ld ? good : bad)('Restaurant JSON-LD present');
      if (ld) {
        try {
          const o = JSON.parse(ld);
          (o['@type'] === 'Restaurant' && o.address && o.telephone ? good : bad)('JSON-LD @type=Restaurant w/ address + telephone');
          (o.address && o.address.postalCode && o.address.streetAddress ? good : bad)('JSON-LD address has streetAddress + postalCode');
          (Array.isArray(o.openingHoursSpecification) && o.openingHoursSpecification.length ? good : bad)('JSON-LD openingHoursSpecification present');
          (Array.isArray(o.servesCuisine) && o.servesCuisine.length ? good : bad)('JSON-LD servesCuisine present');
          (o.geo && typeof o.geo.latitude === 'number' && typeof o.geo.longitude === 'number' ? good : bad)('JSON-LD geo coordinates present');
        } catch (e) { bad('JSON-LD parses as valid JSON'); }
      }
    } else {
      (!ld ? good : bad)('no Restaurant JSON-LD on non-home route');
    }
    if (r.key === 'jokes') (/<h1[\s>]/i.test(html) ? good : bad)('/jokes ships a real <h1>');

    if (r.key === 'site') {
      const h1 = h1Text(html);
      console.log(`  H1: "${h1}"`);
      (h1 && /cheatmeals/i.test(h1) ? good : bad)('H1 real text includes "CheatMeals"');
      (h1 && /indian burgers/i.test(h1) ? good : bad)('H1 real text includes the tagline "Indian Burgers"');
      for (const kw of ['indian burgers', 'regina', 'dewdney']) (new RegExp(kw, 'i').test(html) ? good : bad)(`body has search term "${kw}"`);
    }
  }

  console.log('\n--- cross-route distinctness ---');
  for (const field of ['title', 'description', 'canonical']) {
    const vals = collected[field].filter(Boolean);
    const uniq = new Set(vals);
    (uniq.size === RAW.length && vals.length === RAW.length ? good : bad)(`all ${RAW.length} ${field}s present & distinct (${uniq.size}/${RAW.length})`);
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
