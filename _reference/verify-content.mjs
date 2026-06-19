// Verifies the Step-1 content pages:
//  A) raw prerendered HTML (no JS) carries real readable content, the right
//     per-page title/description/self-canonical, internal links, and the
//     data-prerendered marker.
//  B) each page hydrates cleanly in a headless browser at 375px (light + dark)
//     with NO React hydration errors and NO horizontal overflow.
//  C) cross-page distinctness + the home page links to every content page.
import http from 'http';
import puppeteer from 'puppeteer-core';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { CONTENT_ROUTES } from '../src/lib/contentRoutes.js';

const ORIGIN = 'https://cheatmealshoib.com';
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = 4327;
const BASE = `http://localhost:${PORT}`;
const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

/* dist server WITH directory index — mirrors Vercel: /about -> dist/about/index.html */
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

let fails = 0;
const bad = (m) => { console.log('  ✗ ' + m); fails++; };
const good = (m) => console.log('  ✓ ' + m);
const dec = (s) => (s == null ? s : s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<'));
const titleOf = (h) => dec((h.match(/<title>([^<]*)<\/title>/i) || [])[1] || null);
const descOf = (h) => { const t = (h.match(/<meta[^>]*name="description"[^>]*>/i) || [])[0]; return t ? dec((t.match(/content="([^"]*)"/i) || [])[1]) : null; };
const canonOf = (h) => { const t = (h.match(/<link[^>]*rel="canonical"[^>]*>/i) || [])[0]; return t ? (t.match(/href="([^"]*)"/i) || [])[1] : null; };
const ogOf = (h, p) => { const t = (h.match(new RegExp(`<meta[^>]*property="og:${p}"[^>]*>`, 'i')) || [])[0]; return t ? dec((t.match(/content="([^"]*)"/i) || [])[1]) : null; };
const stripTags = (s) => (s == null ? s : s.replace(/<[^>]+>/g, ''));
const h1Of = (h) => { const m = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); return m ? dec(stripTags(m[1])).replace(/\s+/g, ' ').trim() : null; };
const ldOf = (h) => (h.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || null;

const titles = {}, descs = {}, canons = {};

async function main() {
  const server = await startServer();
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    console.log('=== A) raw prerendered HTML — content + per-page metadata (no JS) ===\n');
    for (const r of CONTENT_ROUTES) {
      console.log(r.path);
      const html = await readFile(path.join(DIST, r.path.replace(/^\//, ''), 'index.html'), 'utf8');
      // content present
      if (/<div id="root">\s*<\/div>/.test(html)) bad('#root is EMPTY (not prerendered)'); else good('#root has content');
      if (html.includes('cm-content')) good('content layout present'); else bad('missing .cm-content');
      if (html.includes('cm-content__lead')) good('lead paragraph present'); else bad('missing lead');
      if (/cm-content__h2/.test(html)) good('section subheading(s) present'); else bad('missing section subheadings');
      if (html.includes('cm-learnmore__item')) good('LearnMore cross-links present'); else bad('missing LearnMore links');
      // internal links: to the other content pages + menu
      const others = CONTENT_ROUTES.filter((o) => o.path !== r.path);
      const linkedOthers = others.filter((o) => html.includes('href="' + o.path + '"')).length;
      if (linkedOthers >= 1) good(`links to ${linkedOthers}/${others.length} other content pages`); else bad('no links to other content pages');
      if (html.includes('href="/#menu"')) good('links to the Menu'); else bad('no Menu link');
      // marker + DS strip
      if (/data-prerendered="content"/.test(html)) good('data-prerendered="content"'); else bad('missing/incorrect data-prerendered');
      if (!/_ds_bundle/.test(html)) good('DS bundle script stripped'); else bad('DS bundle NOT stripped');
      // metadata
      const t = titleOf(html), d = descOf(html), c = canonOf(html);
      titles[r.path] = t; descs[r.path] = d; canons[r.path] = c;
      console.log('  title: ' + t);
      if (t === r.title) good('title matches registry'); else bad(`title mismatch (got "${t}")`);
      if (d === r.description) good('description matches registry'); else bad('description mismatch');
      if (c === ORIGIN + r.path) good('self-canonical ' + c); else bad(`canonical wrong (got "${c}")`);
      if (ogOf(html, 'url') === ORIGIN + r.path) good('og:url matches canonical'); else bad('og:url wrong');
      if (ogOf(html, 'title') === r.title) good('og:title matches'); else bad('og:title wrong');
      const h1 = h1Of(html);
      if (h1 === r.heading) good('H1 matches file heading'); else bad(`H1 mismatch (got "${h1}", want "${r.heading}")`);
      // FAQPage JSON-LD (pages with an FAQ) or none (/about)
      const ld = ldOf(html);
      if (r.faq && r.faq.length) {
        let obj = null; try { obj = JSON.parse(ld); } catch (e) {}
        if (!obj) bad('FAQPage JSON-LD missing/unparseable');
        else if (obj['@type'] !== 'FAQPage') bad('JSON-LD @type is not FAQPage');
        else if (!Array.isArray(obj.mainEntity) || obj.mainEntity.length !== r.faq.length) bad(`FAQPage mainEntity count ${obj.mainEntity && obj.mainEntity.length} != ${r.faq.length}`);
        else {
          good(`FAQPage JSON-LD valid (${obj.mainEntity.length} Q&A)`);
          const matches = r.faq.every((f, i) => obj.mainEntity[i] && obj.mainEntity[i].name === f.q && obj.mainEntity[i].acceptedAnswer && obj.mainEntity[i].acceptedAnswer.text === f.a);
          if (matches) good('JSON-LD Q&A matches the visible FAQ verbatim'); else bad('JSON-LD Q&A does not match faq data');
        }
      } else {
        if (!ld) good('no JSON-LD (no FAQ on this page)'); else bad('unexpected JSON-LD');
      }
      console.log('');
    }

    console.log('--- Jain page: dietary lines verbatim in raw HTML ---');
    const jainHtml = await readFile(path.join(DIST, 'jain-swaminarayan-food-regina', 'index.html'), 'utf8');
    const DIET = [
      'egg, emulsifier, onion, potato, or garlic.',
      'egg, emulsifier, onion, or garlic.',
      'On the CheatMeals menu, <strong>eggless</strong> means the product does not contain egg or emulsifier.',
      'For Jain orders, CheatMeals uses eggless sauces instead of regular mayo-based sauces. Regular mayo sauces contain egg, so please mention Jain clearly when ordering.',
      'For Swaminarayan orders, CheatMeals uses eggless sauces instead of regular mayo-based sauces.',
      'Regular sauces at CheatMeals are mayo-based and contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces.',
    ];
    for (const line of DIET) {
      if (jainHtml.includes(line)) good('verbatim: ' + line.slice(0, 52) + (line.length > 52 ? '…' : ''));
      else bad('MISSING verbatim dietary line: ' + line);
    }
    console.log('');

    const readPage = (p) => readFile(path.join(DIST, p.replace(/^\//, ''), 'index.html'), 'utf8');

    console.log('--- egg / eggless sauce lines verbatim (per page) ---');
    const EGG = {
      '/frankies-regina': 'For Jain or Swaminarayan orders, mention your restriction clearly so eggless sauces can be used instead of regular mayo-based sauces.',
      '/indian-sandwiches-regina': 'For Jain or Swaminarayan orders, mention the restriction clearly before ordering so eggless sauces can be used instead of regular mayo-based sauces.',
      '/loaded-fries-regina': 'Regular dips and sauces are mayo-based and contain egg. For Jain and Swaminarayan orders, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering so the sauce situation behaves itself.',
      '/paneer-burgers-regina': 'Regular mayo-based sauces contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering.',
      '/aloo-burgers-regina': 'Regular mayo-based sauces contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering.',
    };
    for (const [p, line] of Object.entries(EGG)) {
      const h = await readPage(p);
      if (h.includes(line)) good(p + ' — egg/eggless line verbatim'); else bad(p + ' — MISSING egg/eggless line');
    }
    console.log('');

    console.log('--- page distinctness: unique signature present only on its own page ---');
    const SIG = {
      '/jain-swaminarayan-food-regina': 'Got restrictions? We’ve got a Restricted Space for that.',
      '/what-is-an-indian-burger': 'Regular burgers had their chance. Time to meet the desi stack.',
      '/vegetarian-burgers-regina': 'Bring the craving. We’ll bring the crunch.',
      '/about': 'Stay because your regular order just got replaced.',
      '/frankies-regina': 'Leave with your wrap standards permanently ruined.',
      '/indian-sandwiches-regina': 'It is not actual witchcraft, but it will possess you.',
      '/loaded-fries-regina': 'Accidentally fall in love with the fries.',
      '/paneer-burgers-regina': 'Paneer people, this is your sign.',
      '/aloo-burgers-regina': 'Aloo people, pull up. The patty is ready.',
    };
    const cache = {};
    for (const p of Object.keys(SIG)) cache[p] = await readPage(p);
    for (const [p, sig] of Object.entries(SIG)) {
      const onOwn = cache[p].includes(sig);
      const elsewhere = Object.keys(SIG).filter((q) => q !== p && cache[q].includes(sig));
      if (onOwn && elsewhere.length === 0) good(p + ' — distinct signature (absent on the other 8)');
      else if (!onOwn) bad(p + ' — signature MISSING on its own page');
      else bad(p + ' — NOT distinct; signature also on: ' + elsewhere.join(', '));
    }
    console.log('');

    console.log('--- cross-page distinctness ---');
    const tv = Object.values(titles); const dv = Object.values(descs); const cv = Object.values(canons);
    if (new Set(tv).size === tv.length) good(`all ${tv.length} titles distinct`); else bad('duplicate titles');
    if (new Set(dv).size === dv.length) good(`all ${dv.length} descriptions distinct`); else bad('duplicate descriptions');
    if (new Set(cv).size === cv.length) good(`all ${cv.length} canonicals distinct`); else bad('duplicate canonicals');

    console.log('\n--- home page links to every content page ---');
    const home = await readFile(path.join(DIST, 'index.html'), 'utf8');
    for (const r of CONTENT_ROUTES) {
      if (home.includes('href="' + r.path + '"')) good('home links to ' + r.path); else bad('home MISSING link to ' + r.path);
    }

    console.log('\n=== D) no dead internal links (every href resolves) ===\n');
    // Valid anchor ids come from the home page (where /#x anchors point).
    const homeIds = new Set([...home.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    const prerendered = new Set(['/', '/game', '/jokes', ...CONTENT_ROUTES.map((r) => r.path)]);
    const classify = (href) => {
      if (/^(tel:|mailto:)/i.test(href)) return 'action';
      if (/^https?:\/\//i.test(href)) return 'external';
      if (href === '/' ) return 'route';
      if (href.startsWith('/#')) return homeIds.has(href.slice(2)) ? 'anchor' : 'DEAD-ANCHOR';
      if (href.startsWith('#')) return homeIds.has(href.slice(1)) ? 'anchor' : 'DEAD-ANCHOR';
      const pathOnly = href.split('#')[0].replace(/\/+$/, '') || '/';
      if (prerendered.has(pathOnly) || prerendered.has(href)) return 'route';
      return 'DEAD/INVENTED';
    };
    for (const r of CONTENT_ROUTES) {
      const html = await readFile(path.join(DIST, r.path.replace(/^\//, ''), 'index.html'), 'utf8');
      // Navigational <a> links only — not <link>/asset hrefs.
      const hrefs = [...new Set([...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)].map((m) => m[1]))];
      const dead = hrefs.filter((h) => classify(h).startsWith('DEAD'));
      if (dead.length === 0) good(`${r.path} — ${hrefs.length} unique hrefs, all resolve`);
      else bad(`${r.path} — DEAD links: ${dead.join(', ')}`);
    }

    console.log('\n=== B) hydration @375px (light + dark) ===\n');
    for (const r of CONTENT_ROUTES) {
      for (const theme of ['light', 'dark']) {
        const page = await browser.newPage();
        const errors = [];
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('pageerror', (e) => errors.push(String(e.message || e)));
        await page.setViewport({ width: 375, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('cm-theme', t); } catch (e) {} }, theme);
        await page.setRequestInterception(true);
        page.on('request', (req) => { const u = req.url(); if (u.includes('supabase') || u.includes('/api/') || u.includes('/_vercel/')) req.abort(); else req.continue(); });
        await page.goto(BASE + r.path, { waitUntil: 'networkidle0', timeout: 30000 });
        await sleep(900);
        const res = await page.evaluate(() => ({
          hasContent: !!document.querySelector('#root .cm-content'),
          errorCard: !!document.querySelector('[role="alert"]'),
          theme: document.documentElement.getAttribute('data-theme'),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          h1: (document.querySelector('h1') || {}).textContent || null,
        }));
        const hydrationErr = errors.filter((e) => /hydrat|did not match|Minified React error|Text content does not match/i.test(e));
        const label = `${r.path} ${theme}`.padEnd(46);
        if (res.hasContent && !res.errorCard) good(`${label} rendered`); else bad(`${label} NOT rendered (errorCard=${res.errorCard})`);
        if (res.theme === theme) good(`${label} theme=${theme}`); else bad(`${label} theme=${res.theme} (expected ${theme})`);
        if (hydrationErr.length === 0) good(`${label} no hydration errors`); else bad(`${label} ${hydrationErr.length} hydration errors: ${hydrationErr[0]}`);
        if (res.overflow <= 1) good(`${label} no horizontal overflow`); else bad(`${label} overflow ${res.overflow}px`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log('\n' + (fails === 0 ? 'ALL PASS ✓' : fails + ' CHECK(S) FAILED ✗'));
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
