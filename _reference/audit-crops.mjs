// Focused crops for the mobile audit — element-level screenshots at readable
// scale (the full-page shots are too tall to judge detail).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:4173';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = ROOT + '_audit/crops';
mkdirSync(OUT, { recursive: true });

async function shotEl(page, sel, name) {
  const el = await page.$(sel);
  if (!el) { console.log('  (missing) ' + sel); return; }
  await el.screenshot({ path: `${OUT}/${name}.png` });
  console.log('  shot ' + name);
}

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  for (const [w, theme] of [[360, 'light'], [390, 'dark']]) {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('cm-theme', t); } catch (e) {} }, theme);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForSelector('#menu .cm-menu-card');
    const tag = `${w}-${theme}`;
    // top chrome (announcement + nav + section scroll) — viewport crop
    await p.screenshot({ path: `${OUT}/topchrome-${tag}.png`, clip: { x: 0, y: 0, width: w, height: 230 } });
    console.log(`topchrome-${tag}`);
    await shotEl(p, '.pt-hero', `hero-${tag}`);
    await shotEl(p, '#menu .cm-menu-card', `card-${tag}`);
    await shotEl(p, '.pt-toolbar', `toolbar-${tag}`);
    await shotEl(p, '.pt-about__logo', `aboutlogo-${tag}`);
    await shotEl(p, '.pt-visit', `visit-${tag}`);
    // callbar — scroll to bottom then clip
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await new Promise((r) => setTimeout(r, 120));
    await p.screenshot({ path: `${OUT}/callbar-${tag}.png`, clip: { x: 0, y: 800 - 110, width: w, height: 110 } });
    console.log(`callbar-${tag}`);
    await p.close();
  }
  // jokes pills + card
  for (const [w, theme] of [[390, 'light']]) {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('cm-theme', t); } catch (e) {} }, theme);
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.cm-joke-card__text');
    await p.screenshot({ path: `${OUT}/jokes-top-${w}-${theme}.png`, clip: { x: 0, y: 0, width: w, height: 520 } });
    console.log(`jokes-top-${w}-${theme}`);
    await p.close();
  }
} finally {
  await browser.close();
}
console.log('crops → ' + OUT);
