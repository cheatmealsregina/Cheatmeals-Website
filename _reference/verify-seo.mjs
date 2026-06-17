// Verifies the SEO surface end-to-end against the production build (dist):
//   - /robots.txt and /sitemap.xml serve as static files (not the SPA shell)
//   - each route gets the right title / canonical / description / robots after
//     the app boots and applyRouteHead() runs.
// Spawns `vite preview`, drives headless Edge, then kills the preview tree.
import puppeteer from 'puppeteer-core';
import { spawn, execSync } from 'child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 4317;
const BASE = `http://localhost:${PORT}`;

const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  shell: true,
  stdio: 'ignore',
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + '/'); if (r.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error('preview server did not come up');
}

function cleanup() {
  try { execSync(`taskkill /PID ${srv.pid} /T /F`, { stdio: 'ignore' }); } catch {}
}

try {
  await waitUp();

  console.log('=== static files ===');
  for (const f of ['robots.txt', 'sitemap.xml']) {
    const r = await fetch(`${BASE}/${f}`);
    const body = await r.text();
    const isShell = body.includes('<div id="root">');
    console.log(`/${f}  ${r.status}  ${r.headers.get('content-type')}  ${isShell ? 'SERVED SPA SHELL (BAD)' : 'static OK'}`);
    console.log('   ' + body.trim().split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4).join(' | '));
  }

  console.log('\n=== per-route <head> ===');
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
  const page = await browser.newPage();
  for (const route of ['/', '/game', '/jokes', '/admin']) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(4000); // boot (DS bundle + data fallback) + applyRouteHead effect
    const m = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null,
    }));
    console.log(`\n${route}`);
    console.log('  title    :', m.title);
    console.log('  canonical:', m.canonical);
    console.log('  og:url   :', m.ogUrl);
    console.log('  robots   :', m.robots ?? '(none — indexable)');
    console.log('  desc     :', (m.description || '').slice(0, 80) + '…');
  }
  await browser.close();
} finally {
  cleanup();
}
