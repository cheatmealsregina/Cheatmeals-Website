// Production checks: vite preview pages render clean (no console errors,
// live data), and the dist bundle contains no secrets beyond the expected
// public values (project URL + anon key; service_role must be absent).
// Requires `npm run preview` running on :4173.
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:4173';
const out = [];
const fail = [];

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const envFile = readFileSync(ROOT + '.env.local', 'utf8');
const PROJECT_REF = envFile.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)[1];
const ANON_KEY = envFile.split(/\r?\n/).find((l) => l.startsWith('VITE_SUPABASE_ANON_KEY=')).replace('VITE_SUPABASE_ANON_KEY=', '').trim();

// ---------- preview pages ----------
const consoleProblems = [];
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  for (const route of ['/', '/game', '/jokes', '/admin']) {
    const p = await browser.newPage();
    p.on('console', (m) => {
      if (['error', 'warn'].includes(m.type())) consoleProblems.push(`${route} [${m.type()}] ${m.text().slice(0, 200)}`);
    });
    p.on('pageerror', (e) => consoleProblems.push(`${route} [pageerror] ${e.message.slice(0, 200)}`));
    await p.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 30000 });
    if (route === '/') {
      await p.waitForSelector('#menu .cm-menu-card', { timeout: 15000 });
      const cards = await p.$$eval('#menu .cm-menu-card', (els) => els.length);
      const live = await fetch(
        `https://${PROJECT_REF}.supabase.co/rest/v1/items?select=id&category_id=eq.1&is_available=eq.true`,
        { headers: { apikey: ANON_KEY, authorization: 'Bearer ' + ANON_KEY } }
      ).then((r) => r.json());
      if (cards !== live.length) fail.push(`preview /: ${cards} cards rendered, live DB has ${live.length}`);
      else out.push(`preview /: renders live data (${cards} cards, matches DB)`);
    }
    if (route === '/game') {
      await p.waitForSelector('.stk-stage', { timeout: 15000 });
      out.push('preview /game: stage renders');
    }
    if (route === '/jokes') {
      await p.waitForSelector('.cm-joke-card__text', { timeout: 15000 });
      out.push('preview /jokes: joke card renders');
    }
    if (route === '/admin') {
      await p.waitForSelector('.pt-login', { timeout: 15000 });
      out.push('preview /admin: login renders (route guard)');
    }
    await p.close();
  }
} finally {
  await browser.close();
}
if (consoleProblems.length) fail.push('console not clean:\n    ' + consoleProblems.join('\n    '));
else out.push('preview console: zero errors/warnings across /, /game, /admin');

// ---------- dist scan ----------
const distFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p);
    else distFiles.push(p);
  }
})(ROOT + 'dist');

let refHits = 0;
let serviceHits = 0;
const jwtRoles = new Set();
let anonKeyFound = false;
for (const f of distFiles) {
  const text = readFileSync(f, 'latin1');
  refHits += (text.match(new RegExp(PROJECT_REF, 'g')) || []).length;
  serviceHits += (text.match(/service_role/g) || []).length;
  if (text.includes(ANON_KEY)) anonKeyFound = true;
  for (const jwt of text.match(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g) || []) {
    try {
      const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
      jwtRoles.add(payload.role || '(none)');
    } catch { /* not a JWT */ }
  }
}
out.push(`dist scan: ${distFiles.length} files; project ref appears ${refHits}x (expected: URL + anon key), anon key inlined: ${anonKeyFound}`);
if (serviceHits > 0) fail.push(`dist contains "service_role" ${serviceHits}x`);
else out.push('dist scan: no "service_role" anywhere');
const badRoles = [...jwtRoles].filter((r) => r !== 'anon');
if (badRoles.length) fail.push('dist contains JWTs with roles: ' + badRoles.join(', '));
else out.push(`dist scan: every embedded JWT decodes to role "anon" (${jwtRoles.size ? [...jwtRoles].join(',') : 'none found'})`);
if (distFiles.some((f) => f.includes('/api/') || f.includes('\\api\\'))) fail.push('server api/ code leaked into dist');
else out.push('dist scan: api/ server code not bundled');

console.log('--- RESULTS ---');
out.forEach((l) => console.log('  ' + l));
console.log('--- FAILURES ---');
console.log(fail.length ? fail.join('\n') : '(none)');
process.exit(fail.length ? 1 : 0);
