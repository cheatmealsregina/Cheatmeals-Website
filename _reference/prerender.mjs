// Build-time prerender: snapshot each public route's fully-rendered HTML into
// dist so crawlers (and the first paint) get real content before any JS runs.
// The app still boots and hydrates normally on top of it.
//
// How it works: serve the freshly built dist over a tiny static server, drive a
// headless browser to each route (at a MOBILE viewport — the primary audience —
// with live data blocked so the page renders from the bundled seed), then write
// the serialized DOM back to dist as static HTML. The browser is local Edge on
// dev machines and @sparticuz/chromium on Linux/Vercel. The step is NON-FATAL:
// if no browser can be launched it logs and exits 0, leaving the normal SPA
// shell (the build still succeeds and the site still works, just client-only).
//
//   /        -> dist/index.html        (the one-page site: hero + menu + about
//                                        + team + visit — all real content)
//   /game    -> dist/game/index.html
//   /jokes   -> dist/jokes/index.html
//   /admin   is intentionally NOT prerendered (owner-only, noindex).
import http from 'http';
import puppeteer from 'puppeteer-core';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = 4319;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* route -> { out: dist path, ready: selector that proves the page rendered } */
const ROUTES = [
  { path: '/', key: 'site', out: 'index.html', ready: '#visit' },
  { path: '/game', key: 'game', out: 'game/index.html', ready: '.stk-board' },
  { path: '/jokes', key: 'jokes', out: 'jokes/index.html', ready: '.cm-joke-card__text' },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/* Serve dist with directory-index + SPA fallback (so an extension-less route
   like /game resolves to the SPA shell — the prerendered files don't exist yet
   while this runs). */
function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p.includes('..')) p = '/';
      let file = path.join(DIST, p);
      if (p === '/' || !path.extname(p)) file = path.join(DIST, 'index.html');
      if (!existsSync(file)) file = path.join(DIST, 'index.html');
      const body = await readFile(file);
      res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
      res.end(body);
    } catch (e) {
      res.statusCode = 500;
      res.end('prerender server error');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

/* Local Edge first (fast, no download); else a bundled Chromium for Linux/CI. */
async function resolveLaunch() {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && existsSync(envPath)) {
    return { executablePath: envPath, args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' };
  }
  const edge = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => existsSync(p));
  if (edge) {
    return { executablePath: edge, args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' };
  }
  try {
    const chromium = (await import('@sparticuz/chromium')).default;
    return { executablePath: await chromium.executablePath(), args: chromium.args, headless: chromium.headless };
  } catch (e) {
    return null;
  }
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.warn('[prerender] dist/index.html not found — run vite build first. Skipping.');
    return;
  }

  const launch = await resolveLaunch();
  if (!launch) {
    console.warn('[prerender] No browser available (no Edge, no @sparticuz/chromium). Skipping — site ships as a client-rendered SPA.');
    return;
  }

  const server = await startServer();
  let browser;
  let ok = 0;
  try {
    browser = await puppeteer.launch({ executablePath: launch.executablePath, args: launch.args, headless: launch.headless });
    for (const route of ROUTES) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        /* Block live data so the snapshot renders from the bundled seed (the
           agreed source for prerendered content) — never from Supabase. */
        await page.setRequestInterception(true);
        page.on('request', (r) => {
          const u = r.url();
          if (u.includes('supabase') || u.includes('/api/')) r.abort();
          else r.continue();
        });

        await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector(route.ready, { timeout: 20000 });
        await sleep(700); // let mount effects (route head, fonts) settle

        await page.evaluate((k) => {
          document.documentElement.setAttribute('data-prerendered', k);
          /* The DS bundle is injected by main.jsx AFTER it sets window.React;
             leaving its <script> in the static HTML would run it too early (no
             window.React) on the next load. main.jsx re-injects it correctly. */
          document.querySelectorAll('script[src*="_ds_bundle"]').forEach((s) => s.remove());
        }, route.key);

        const html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
        const outFile = path.join(DIST, route.out);
        mkdirSync(path.dirname(outFile), { recursive: true });
        writeFileSync(outFile, html);
        const kb = (html.length / 1024).toFixed(0);
        console.log(`[prerender] ${route.path.padEnd(7)} -> dist/${route.out}  (${kb} KB)`);
        ok++;
      } catch (e) {
        console.warn(`[prerender] ${route.path} FAILED: ${e.message} — leaving the SPA shell for this route.`);
      } finally {
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  console.log(`[prerender] done — ${ok}/${ROUTES.length} routes prerendered.`);
}

main().catch((e) => {
  // Never fail the build because of prerendering — degrade to the SPA shell.
  console.warn('[prerender] skipped due to error:', e && e.message);
  process.exit(0);
});
