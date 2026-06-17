// Build-time prerender: snapshot each public route's fully-rendered HTML into
// dist so crawlers (and the first paint) get real content before any JS runs.
// The app still boots and hydrates normally on top of it.
//
// How it works: serve the freshly built dist over a tiny static server, drive a
// headless browser to each route (at a MOBILE viewport — the primary audience —
// with live data blocked so the page renders from the bundled seed), then write
// the serialized DOM back to dist as static HTML.
//
//   /        -> dist/index.html        (one-page site: hero + menu + about +
//                                        team + visit — all real content)
//   /game    -> dist/game/index.html
//   /jokes   -> dist/jokes/index.html
//   /admin   is intentionally NOT prerendered (owner-only, noindex).
//
// Browser: local Edge (or PUPPETEER_EXECUTABLE_PATH) in dev, else
// @sparticuz/chromium for Linux/Vercel. The step is NON-FATAL — if every
// strategy fails it logs, writes a status file, and exits 0, leaving the SPA
// shell so the build (and deploy) never break. A diagnostic is written to
// dist/_prerender-status.json (and deployed) so the outcome is inspectable
// from production at /_prerender-status.json.
import http from 'http';
import puppeteerCore from 'puppeteer-core';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = 4319;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROUTES = [
  { path: '/', key: 'site', out: 'index.html', ready: '#visit' },
  { path: '/game', key: 'game', out: 'game/index.html', ready: '.stk-board' },
  { path: '/jokes', key: 'jokes', out: 'jokes/index.html', ready: '.cm-joke-card__text' },
];

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

const status = {
  ok: false,
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
  vercel: !!process.env.VERCEL,
  strategy: null,
  attempts: [],
  routes: [],
  error: null,
};
function writeStatus() {
  try {
    if (existsSync(DIST)) writeFileSync(path.join(DIST, '_prerender-status.json'), JSON.stringify(status, null, 2));
  } catch (e) { /* ignore */ }
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p.includes('..')) p = '/';
      let file = path.join(DIST, p);
      if (p === '/' || !path.extname(p)) file = path.join(DIST, 'index.html');
      if (!existsSync(file)) file = path.join(DIST, 'index.html');
      res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch (e) { res.statusCode = 500; res.end('prerender server error'); }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

/* Ordered browser strategies — first one that launches wins. */
const STRATEGIES = [
  {
    name: 'local-executable',
    async launch() {
      const exe = (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH))
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : EDGE_PATHS.find((p) => existsSync(p));
      if (!exe) throw new Error('no local Edge / PUPPETEER_EXECUTABLE_PATH');
      return puppeteerCore.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    },
  },
  {
    name: 'sparticuz-chromium',
    async launch() {
      /* @sparticuz/chromium bundles Chromium's shared libs (libnss3, libnspr4,
         …) in al2023.tar.br but only EXTRACTS them when it detects an AWS Lambda
         runtime — and it always adds /tmp/al2023/lib to LD_LIBRARY_PATH. Vercel's
         BUILD step isn't Lambda, so without this the loader can't find libnss3.so
         (Code 127). Setting AWS_LAMBDA_JS_RUNTIME makes isRunningInAwsLambdaNode20()
         true, so executablePath() extracts the libs into the dir already on the
         path. Set before import so the env wiring runs with it in place. */
      process.env.AWS_LAMBDA_JS_RUNTIME ||= 'nodejs20.x';
      const chromium = (await import('@sparticuz/chromium')).default;
      const executablePath = await chromium.executablePath();
      return puppeteerCore.launch({
        executablePath,
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        headless: chromium.headless,
        defaultViewport: null,
      });
    },
  },
];

async function acquireBrowser() {
  for (const s of STRATEGIES) {
    try {
      const browser = await s.launch();
      status.attempts.push({ strategy: s.name, ok: true });
      status.strategy = s.name;
      return browser;
    } catch (e) {
      status.attempts.push({ strategy: s.name, ok: false, error: String(e && e.message || e).slice(0, 300) });
    }
  }
  return null;
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    status.error = 'dist/index.html not found — run vite build first';
    console.warn('[prerender] ' + status.error + '. Skipping.');
    writeStatus();
    return;
  }

  const server = await startServer();
  let browser;
  try {
    browser = await acquireBrowser();
    if (!browser) {
      status.error = 'no browser strategy succeeded';
      console.warn('[prerender] No browser could be launched. Tried: ' + status.attempts.map((a) => a.strategy).join(', ') + '. Skipping — site ships as a client-rendered SPA.');
      return;
    }
    console.log('[prerender] browser via: ' + status.strategy);

    for (const route of ROUTES) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await page.setRequestInterception(true);
        page.on('request', (r) => {
          const u = r.url();
          if (u.includes('supabase') || u.includes('/api/')) r.abort();
          else r.continue();
        });

        await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector(route.ready, { timeout: 20000 });
        await sleep(700);

        await page.evaluate((k) => {
          document.documentElement.setAttribute('data-prerendered', k);
          document.querySelectorAll('script[src*="_ds_bundle"]').forEach((s) => s.remove());
        }, route.key);

        const html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
        const outFile = path.join(DIST, route.out);
        mkdirSync(path.dirname(outFile), { recursive: true });
        writeFileSync(outFile, html);
        const kb = +(html.length / 1024).toFixed(0);
        status.routes.push({ path: route.path, out: route.out, kb });
        console.log(`[prerender] ${route.path.padEnd(7)} -> dist/${route.out}  (${kb} KB)`);
      } catch (e) {
        status.routes.push({ path: route.path, out: route.out, error: String(e && e.message || e).slice(0, 300) });
        console.warn(`[prerender] ${route.path} FAILED: ${e.message} — leaving the SPA shell for this route.`);
      } finally {
        await page.close();
      }
    }
    status.ok = status.routes.filter((r) => !r.error).length === ROUTES.length;
  } finally {
    if (browser) await browser.close();
    server.close();
    writeStatus();
  }
  const done = status.routes.filter((r) => !r.error).length;
  console.log(`[prerender] done — ${done}/${ROUTES.length} routes prerendered (browser: ${status.strategy || 'none'}).`);
}

main().catch((e) => {
  status.error = String(e && e.stack || e).slice(0, 600);
  console.warn('[prerender] skipped due to error:', e && e.message);
  writeStatus();
  process.exit(0);
});
