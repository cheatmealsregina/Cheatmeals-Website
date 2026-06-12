// Failure-mode checks: (1) is_available filter is server-side and a row's
// removal removes its card; (2) network-down falls back to bundled data
// with a console warning, never an empty page.
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';
const ANON_KEY = readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8')
  .split(/\r?\n/)
  .find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY='))
  .replace('VITE_SUPABASE_ANON_KEY=', '')
  .trim();
const out = [];
const fail = [];

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });

// ---------- 1. is_available: query filter + removal renders fewer cards ----------
{
  const p = await browser.newPage();
  let itemsUrl = null;
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    if (req.url().includes('/rest/v1/items')) itemsUrl = req.url();
    req.continue();
  });
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await p.waitForSelector('#menu .cm-menu-card');
  const names1 = await p.$$eval('#menu .cm-menu-card__name', (els) => els.map((e) => e.textContent));
  if (!itemsUrl) fail.push('items request never observed');
  else if (!decodeURIComponent(itemsUrl).includes('is_available=eq.true')) fail.push('items query missing is_available filter: ' + itemsUrl);
  else out.push('items query filters server-side: ...' + decodeURIComponent(itemsUrl).split('?')[1]);
  out.push(`live Aloo tab: ${names1.length} cards [${names1.slice(0, 4).join(', ')}…]`);
  if (!names1.includes('Achari Aloo')) fail.push('expected Achari Aloo present in live data');
  await p.close();

  // simulate the dashboard toggle: same query, response minus Achari Aloo
  const p2 = await browser.newPage();
  await p2.setRequestInterception(true);
  p2.on('request', async (req) => {
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    };
    if (req.url().includes('/rest/v1/items')) {
      if (req.method() === 'OPTIONS') {
        req.respond({ status: 204, headers: cors });
        return;
      }
      const r = await fetch(req.url(), {
        headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY },
      });
      const rows = await r.json();
      if (!Array.isArray(rows)) {
        console.log('unexpected items payload:', JSON.stringify(rows).slice(0, 300));
        req.continue();
        return;
      }
      const filtered = rows.filter((row) => row.name !== 'Achari Aloo');
      console.log(`[mock] items: ${rows.length} -> ${filtered.length} rows`);
      req.respond({
        status: 200,
        headers: { ...cors, 'content-type': 'application/json' },
        body: JSON.stringify(filtered),
      });
    } else req.continue();
  });
  await p2.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await p2.waitForSelector('#menu .cm-menu-card');
  const names2 = await p2.$$eval('#menu .cm-menu-card__name', (els) => els.map((e) => e.textContent));
  if (names2.includes('Achari Aloo')) fail.push('Achari Aloo still rendered after removal');
  else if (names2.length !== names1.length - 1) fail.push(`expected ${names1.length - 1} cards, got ${names2.length}`);
  else out.push(`unavailable item removed: ${names1.length} -> ${names2.length} cards, Achari Aloo gone`);
  await p2.close();
}

// ---------- 2. network down -> bundled fallback + warning ----------
{
  const p = await browser.newPage();
  const warnings = [];
  p.on('console', (m) => { if (m.type() === 'warn') warnings.push(m.text()); });
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    if (req.url().includes('supabase.co')) req.abort('internetdisconnected');
    else req.continue();
  });
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await p.waitForSelector('#menu .cm-menu-card', { timeout: 15000 });
  const cards = await p.$$eval('#menu .cm-menu-card', (els) => els.length);
  const announce = await p.$eval('.cm-announce span', (el) => el.textContent);
  const warned = warnings.some((w) => w.includes('falling back to bundled seed data'));
  if (!warned) fail.push('no fallback console warning; warns seen: ' + JSON.stringify(warnings));
  else out.push('offline: console warning emitted');
  if (cards < 13) fail.push(`offline: expected >=13 bundled menu cards, got ${cards}`);
  else out.push(`offline: site rendered from bundled data (${cards} cards, announce: "${announce.slice(0, 30)}…")`);
  await p.close();
}

await browser.close();
console.log('--- RESULTS ---');
out.forEach((l) => console.log('  ' + l));
console.log('--- FAILURES ---');
console.log(fail.length ? fail.join('\n') : '(none)');
process.exit(fail.length ? 1 : 0);
