// Migration verification harness — captures screenshots + console output
// for every screen/theme, runs interaction checks (theme toggle, announce
// dismiss, menu tabs/search, game play-through), and writes results to
// _reference/shots/<tag>/. Run: node _reference/verify.mjs <tag>
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const TAG = process.argv[2] || 'run';
const BASE = 'http://localhost:5173';
const DIR = new URL(`./shots/${TAG}/`, import.meta.url);
mkdirSync(DIR, { recursive: true });

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const consoleLog = [];
const failures = [];
const notes = [];

const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`;

function shotPath(name) {
  return fileURLToPath(new URL(name + '.png', DIR));
}

async function freshPage(browser, { width = 1280, height = 900 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warn') consoleLog.push(`[${t}] ${m.text()}`);
  });
  page.on('pageerror', (e) => consoleLog.push(`[pageerror] ${e.message}`));
  return page;
}

async function settle(page) {
  await page.addStyleTag({ content: FREEZE_CSS });
  await new Promise((r) => setTimeout(r, 250));
}

async function shot(page, name, fullPage = true) {
  await page.screenshot({ path: shotPath(name), fullPage });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('cm-theme', t);
  }, theme);
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});

try {
  // ---------- HOME (covers Menu/About/Team/Visit sections, full page) ----------
  for (const theme of ['light', 'dark']) {
    const p = await freshPage(browser);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.evaluate((t) => localStorage.setItem('cm-theme', t), theme);
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-nav', { timeout: 10000 });
    await settle(p);
    await shot(p, `home-${theme}`);
    await p.close();
  }

  // ---------- interactions on home (light) ----------
  {
    const p = await freshPage(browser);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.evaluate(() => localStorage.setItem('cm-theme', 'light'));
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-nav');
    await settle(p);

    // theme toggle flips data-theme and persists
    await p.click('.pt-nav .pt-toggle');
    await new Promise((r) => setTimeout(r, 400));
    const t1 = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const stored = await p.evaluate(() => localStorage.getItem('cm-theme'));
    if (t1 !== 'dark' || stored !== 'dark') failures.push(`theme toggle: data-theme=${t1} stored=${stored}`);
    else notes.push('theme toggle: light->dark OK, persisted');
    await shot(p, 'home-toggled-dark');

    // announcement dismiss
    const hadAnnounce = await p.$('.cm-announce');
    if (!hadAnnounce) failures.push('announcement bar missing');
    await p.click('.cm-announce__close');
    await new Promise((r) => setTimeout(r, 200));
    const gone = await p.$('.cm-announce');
    if (gone) failures.push('announcement did not dismiss');
    else notes.push('announcement dismiss OK');

    // hero burger: smash class on click
    await p.hover('.pt-xb');
    await p.evaluate(() => {
      const el = document.querySelector('.pt-xb');
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    const smashed = await p.evaluate(() => document.querySelector('.pt-xb').className.includes('pt-xb--smash'));
    if (!smashed) failures.push('hero burger smash class not applied');
    else notes.push('hero burger smash OK');
    // easter egg: 5 fast pokes
    await p.evaluate(() => {
      const el = document.querySelector('.pt-xb');
      for (let i = 0; i < 5; i++) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 150));
    const egg = await p.$('.pt-xb__egg');
    if (!egg) failures.push('easter egg did not trigger');
    else notes.push('easter egg OK');
    await p.close();
  }

  // ---------- menu tabs + search + picks toggle (light) ----------
  {
    const p = await freshPage(browser);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForSelector('#menu .cm-tabs');
    await settle(p);
    const tabCount = await p.$$eval('#menu .cm-tab', (els) => els.length);
    if (tabCount !== 11) failures.push(`expected 11 tabs, got ${tabCount}`);
    for (let i = 0; i < tabCount; i++) {
      await p.evaluate((idx) => document.querySelectorAll('#menu .cm-tab')[idx].click(), i);
      await new Promise((r) => setTimeout(r, 120));
      const el = await p.$('#menu');
      await el.screenshot({ path: shotPath(`menu-tab-${String(i).padStart(2, '0')}`) });
    }
    // back to tab 0, search
    await p.evaluate(() => document.querySelectorAll('#menu .cm-tab')[0].click());
    await p.type('#menu .cm-input', 'aloo');
    await new Promise((r) => setTimeout(r, 150));
    const results = await p.$$eval('#menu .cm-menu-card', (els) => els.length);
    notes.push(`search "aloo": ${results} cards`);
    const menuEl = await p.$('#menu');
    await menuEl.screenshot({ path: shotPath('menu-search-aloo') });
    // no-results state
    await p.evaluate(() => {
      const inp = document.querySelector('#menu .cm-input');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(inp, 'zzzz');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 150));
    const empty = await p.$('#menu .pt-empty');
    if (!empty) failures.push('search empty state missing');
    else notes.push('search empty state OK');
    await menuEl.screenshot({ path: shotPath('menu-search-empty') });
    // clear, picks only
    await p.evaluate(() => {
      const inp = document.querySelector('#menu .cm-input');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(inp, '');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await p.click('#menu .cm-toggle');
    await new Promise((r) => setTimeout(r, 150));
    const pickCards = await p.$$eval('#menu .cm-menu-card', (els) => els.length);
    notes.push(`picks-only: ${pickCards} cards`);
    await menuEl.screenshot({ path: shotPath('menu-picks-only') });
    await p.close();
  }

  // ---------- game: static shots + full play-through ----------
  for (const theme of ['light', 'dark']) {
    const p = await freshPage(browser);
    await p.goto(BASE + '/game', { waitUntil: 'networkidle0' });
    await p.evaluate((t) => { localStorage.setItem('cm-theme', t); localStorage.removeItem('cm-stacker-howto'); localStorage.removeItem('cm-stacker-board'); }, theme);
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.stk-stage');
    await settle(p);
    // howto veil visible on fresh visit — screenshot header area only (arm is animated)
    const head = await p.$('.stk-head');
    await head.screenshot({ path: shotPath(`game-head-${theme}`) });
    const veil = await p.$('.stk-howto');
    if (!veil) failures.push(`game(${theme}): howto veil missing`);
    await p.close();
  }
  {
    const p = await freshPage(browser);
    await p.goto(BASE + '/game', { waitUntil: 'networkidle0' });
    await p.evaluate(() => { localStorage.removeItem('cm-stacker-howto'); localStorage.removeItem('cm-stacker-board'); });
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.stk-stage');
    const tap = () => p.evaluate(() => {
      document.querySelector('.stk-stage').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await tap(); // dismiss howto -> play
    await new Promise((r) => setTimeout(r, 300));
    const playing = await p.$('.stk-howto');
    if (playing) failures.push('game: howto did not clear on tap');
    // drop until game over (max 40 taps) — misses end the game eventually
    let overSeen = false;
    for (let i = 0; i < 40 && !overSeen; i++) {
      await tap();
      await new Promise((r) => setTimeout(r, 380));
      overSeen = !!(await p.$('.stk-overcard'));
    }
    const score = await p.$eval('.stk-score', (el) => el.textContent).catch(() => null);
    const layers = await p.$$eval('.stk-layer', (els) => els.length).catch(() => 0);
    notes.push(`game play-through: ${overSeen ? 'reached game over' : 'still playing after 40 drops'}, score=${score}, layers=${layers}`);
    if (overSeen) {
      // entry (initials) or plain over card
      const entry = await p.$('.stk-initials');
      if (entry) {
        await p.type('.stk-initials', 'CMX');
        await p.evaluate(() => {
          const btn = [...document.querySelectorAll('.stk-overcard button')].find((b) => b.textContent.includes('Save'));
          if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 300));
        const boardRows = await p.$$eval('.stk-board li', (els) => els.map((e) => e.textContent));
        notes.push(`leaderboard after save: ${JSON.stringify(boardRows)}`);
        if (!boardRows.length) failures.push('leaderboard empty after save');
      } else {
        notes.push('game over without top-5 entry (score did not qualify or 0)');
        // stack again still works
        await p.evaluate(() => {
          const btn = [...document.querySelectorAll('.stk-overcard button')].find((b) => b.textContent.includes('Stack Again'));
          if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 200));
        const veilGone = await p.$('.stk-overcard');
        if (veilGone) failures.push('Stack Again did not restart');
        else notes.push('Stack Again restart OK');
      }
    }
    await p.close();
  }

  // ---------- admin (both themes) ----------
  for (const theme of ['light', 'dark']) {
    const p = await freshPage(browser);
    await p.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
    await p.evaluate((t) => localStorage.setItem('cm-theme', t), theme);
    await p.reload({ waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-login');
    await settle(p);
    await shot(p, `admin-${theme}`);
    // editor interactions: tab + badge picker + availability toggle render
    const rows = await p.$$eval('.cm-editor-row, .pt-rows > *', (els) => els.length).catch(() => 0);
    notes.push(`admin(${theme}): ${rows} editor rows/cards`);
    await p.close();
  }

  // ---------- mobile spot checks ----------
  for (const route of ['/', '/game']) {
    const p = await freshPage(browser, { width: 390, height: 844 });
    await p.goto(BASE + route, { waitUntil: 'networkidle0' });
    await p.waitForSelector('.cm-screen');
    await settle(p);
    await shot(p, `mobile-${route === '/' ? 'home' : 'game'}`);
    const callbar = await p.$('.pt-callbar');
    if (route === '/' && !callbar) failures.push('mobile home: call bar missing');
    await p.close();
  }
} finally {
  await browser.close();
}

writeFileSync(new URL('console.txt', DIR), consoleLog.join('\n') || '(no console errors/warnings)');
writeFileSync(new URL('notes.txt', DIR), ['NOTES:', ...notes, '', 'FAILURES:', ...(failures.length ? failures : ['(none)'])].join('\n'));
console.log('--- NOTES ---');
notes.forEach((n) => console.log(' ', n));
console.log('--- FAILURES ---');
console.log(failures.length ? failures.join('\n') : '(none)');
console.log('--- CONSOLE (errors/warns) ---');
console.log(consoleLog.length ? consoleLog.slice(0, 30).join('\n') : '(clean)');
process.exit(failures.length ? 1 : 0);
