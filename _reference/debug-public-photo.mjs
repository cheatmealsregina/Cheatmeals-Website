import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const envFile = readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8');
const ANON_KEY = envFile.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY=')).replace('VITE_SUPABASE_ANON_KEY=', '').trim();
const SB_URL = envFile.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_URL=')).replace('VITE_SUPABASE_URL=', '').trim();
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new' });
const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844 });
p.on('console', (m) => { if (['warn', 'error'].includes(m.type())) console.log(`[${m.type()}]`, m.text().slice(0, 200)); });
const hits = [];
await p.setRequestInterception(true);
p.on('request', async (req) => {
  const url = req.url();
  if (req.method() === 'GET' && url.includes('/rest/v1/items')) {
    hits.push(url.slice(0, 120));
    const r = await fetch(url, { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } });
    const rows = await r.json();
    for (const row of rows) if (row.name === 'Aloo 420') row.photo_url = SB_URL + '/storage/v1/object/public/menu-photos/items/test.webp';
    return req.respond({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(rows) });
  }
  req.continue();
});
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await p.waitForSelector('#menu .cm-menu-card');
console.log('items GETs intercepted:', hits.length, hits[0] || '');
const info = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('#menu .cm-menu-card')];
  const c420 = cards.find((c) => c.textContent.includes('Aloo 420'));
  const hulk = cards.find((c) => c.textContent.includes('The Red Hulk'));
  return {
    cardCount: cards.length,
    c420html: c420 ? c420.innerHTML.slice(0, 300) : 'NOT FOUND',
    hulkHasMedia: hulk ? !!hulk.querySelector('.cm-menu-card__media') : 'card missing',
    hulkHtml: hulk ? hulk.innerHTML.slice(0, 200) : 'NOT FOUND',
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
