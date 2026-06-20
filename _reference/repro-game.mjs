// Mobile /game checks:
//  1) contained view: the stage fits above the fixed CallBar (base visible).
//  2) immersive view: tap-to-play -> full-screen stage + close button, nav /
//     footer / CallBar hidden, stage much taller, height locked.
//  3) close button returns to the contained view.
//  4) multiplier still scores while playing (immersive).
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));
const BASE = 'http://localhost:5055';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };

const VIEWPORTS = [
  { name: 'iPhone 12 (390x844)', w: 390, h: 844 },
  { name: 'small (360x640)', w: 360, h: 640 },
];

async function stageCenter(page) {
  return page.evaluate(() => { const b = document.querySelector('.stk-stage').getBoundingClientRect(); return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }; });
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
  try {
    // ---- 1) contained view fits above the CallBar ----
    console.log('=== contained view (before tap) ===');
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(BASE + '/game', { waitUntil: 'networkidle0', timeout: 30000 });
      await sleep(600);
      const m = await page.evaluate(() => {
        const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
        const st = document.querySelector('.stk-stage');
        const cb = document.querySelector('.pt-callbar');
        return { stage: rr(st), callbarTop: cb ? Math.round(cb.getBoundingClientRect().top) : null };
      });
      const ok = m.stage && m.callbarTop && m.stage.bottom <= m.callbarTop;
      console.log(`${vp.name}: stage ${JSON.stringify(m.stage)} callbarTop ${m.callbarTop} -> fits above bar? ${ok}`);
      await page.close();
    }

    // ---- 2/3/4) immersive flow on a tall phone ----
    console.log('\n=== immersive flow (390x844) ===');
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(BASE + '/game', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(600);

    const before = await page.evaluate(() => ({
      stageH: Math.round(document.querySelector('.stk-stage').getBoundingClientRect().height),
      hasNav: !!document.querySelector('.pt-nav, nav'),
      hasFooter: !!document.querySelector('.cm-footer-links'),
      hasCallbar: !!document.querySelector('.pt-callbar'),
      hasClose: !!document.querySelector('.stk-close'),
    }));
    console.log('before tap :', JSON.stringify(before));
    await page.screenshot({ path: '_reference/shot-contained-390x844.png' });

    // tap-to-play -> immersive
    let c = await stageCenter(page);
    await page.touchscreen.tap(c.x, c.y);
    await sleep(500);
    const after = await page.evaluate(() => {
      const st = document.querySelector('.stk-stage');
      const cl = document.querySelector('.stk-close');
      return {
        stageH: st ? Math.round(st.getBoundingClientRect().height) : null,
        immersive: !!document.querySelector('.stk-page--immersive'),
        hasNav: !!document.querySelector('.pt-nav, nav'),
        hasFooter: !!document.querySelector('.cm-footer-links'),
        hasCallbar: !!document.querySelector('.pt-callbar'),
        hasBoard: !!document.querySelector('.stk-board'),
        close: cl ? (() => { const b = cl.getBoundingClientRect(); return { top: Math.round(b.top), right: Math.round(window.innerWidth - b.right) }; })() : null,
      };
    });
    console.log('after tap  :', JSON.stringify(after));
    console.log(`-> immersive=${after.immersive}, stage ${before.stageH}->${after.stageH}px, chrome hidden (nav/footer/callbar/board)=${!after.hasNav && !after.hasFooter && !after.hasCallbar && !after.hasBoard}, close top-right=${after.close && after.close.top < 60 && after.close.right < 60}`);
    await page.screenshot({ path: '_reference/shot-immersive-390x844.png' });

    // multiplier still works in immersive (recompute centre, tap a few times)
    c = await stageCenter(page);
    for (let i = 0; i < 4; i++) { await page.touchscreen.tap(c.x, c.y); await sleep(450); }
    const score = await page.evaluate(() => (document.querySelector('.stk-score') || {}).textContent || '');
    console.log('after 4 drops, score reads:', JSON.stringify((score || '').replace(/\s+/g, ' ').trim()));

    // close -> back to contained
    await page.evaluate(() => document.querySelector('.stk-close').click());
    await sleep(500);
    const closed = await page.evaluate(() => ({
      immersive: !!document.querySelector('.stk-page--immersive'),
      hasNav: !!document.querySelector('.pt-nav, nav'),
      hasCallbar: !!document.querySelector('.pt-callbar'),
      hasFooter: !!document.querySelector('.cm-footer-links'),
    }));
    console.log('after close:', JSON.stringify(closed), '-> back to contained?', !closed.immersive && closed.hasNav && closed.hasCallbar && closed.hasFooter);
    await page.close();
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
