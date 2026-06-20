// Reproduce the reported mobile /game issues:
//  1) gameplay area shortened  2) leaderboard ("high score screen") not visible
//  3) multiplier points misbehave.
// Uses prefers-reduced-motion so the claw parks dead-centre -> every drop is a
// perfect, making the multiplier deterministic to test.
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));
const BASE = 'http://localhost:5055';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: 'iPhone 12 (390x844)', w: 390, h: 844 },
  { name: 'small (360x640)', w: 360, h: 640 },
  { name: 'short browser-chrome (390x660)', w: 390, h: 660 },
];

async function main() {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(BASE + '/game', { waitUntil: 'networkidle0', timeout: 30000 });
      await sleep(700);

      // ---- layout metrics ----
      const layout = await page.evaluate(() => {
        const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
        const stage = document.querySelector('.stk-stage');
        const board = document.querySelector('.stk-board');
        const callbar = document.querySelector('.pt-callbar, [class*="callbar"], [class*="CallBar"]');
        const footer = document.querySelector('.cm-footer-links');
        return {
          innerHeight: window.innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
          stage: r(stage),
          board: r(board),
          callbar: r(callbar),
          footerLinks: r(footer),
        };
      });
      console.log(`\n===== ${vp.name} =====`);
      console.log('innerHeight:', layout.innerHeight, ' scrollHeight:', layout.scrollHeight);
      console.log('stage:', JSON.stringify(layout.stage));
      console.log('board:', JSON.stringify(layout.board));
      console.log('callbar:', JSON.stringify(layout.callbar));
      console.log('footerLinks:', JSON.stringify(layout.footerLinks));
      if (layout.board) {
        const cbTop = layout.callbar ? layout.callbar.top : layout.innerHeight;
        const boardHiddenBehindCallbar = layout.board.bottom > cbTop && layout.board.top < cbTop;
        console.log('board fully above the call bar?', layout.board.bottom <= cbTop, '(boardBottom', layout.board.bottom, 'vs callbarTop', cbTop, ')');
        console.log('board overlaps call bar?', boardHiddenBehindCallbar);
      }

      // ---- multiplier test (only on the first viewport) ----
      if (vp === VIEWPORTS[0]) {
        const stageBox = await page.evaluate(() => { const b = document.querySelector('.stk-stage').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
        const read = () => page.evaluate(() => ({
          score: (document.querySelector('.stk-score') || {}).textContent || '',
          mult: (document.querySelector('.stk-mult') || {}).textContent || '(none)',
          star: (document.querySelector('.stk-starpop b') || {}).textContent || '(none)',
        }));
        console.log('\n--- multiplier test (reduced-motion: claw centred, every drop perfect) ---');
        await page.touchscreen.tap(stageBox.x, stageBox.y); // dismiss how-to / start
        await sleep(500);
        for (let i = 1; i <= 8; i++) {
          await page.touchscreen.tap(stageBox.x, stageBox.y);
          await sleep(200);
          const mid = await read(); // catch the star/mult right after the drop commits
          await sleep(300);
          const after = await read();
          console.log(`drop ${i}: score=${after.score.replace(/\s+/g, ' ').trim().padEnd(8)} mult=${(mid.mult||after.mult).padEnd(6)} star=${mid.star}`);
        }
      }
      // ---- screenshot the initial gameplay view (issue 1 visual) ----
      await page.screenshot({ path: `_reference/shot-game-${vp.w}x${vp.h}.png` });
      await page.close();
    }

    // ---- game-over / high-score card capture (issue 2) on a SHORT phone ----
    console.log('\n===== game-over / high-score card (390x660, real arm) =====');
    const gp = await browser.newPage();
    await gp.setViewport({ width: 390, height: 660, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await gp.goto(BASE + '/game', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(700);
    const box = await gp.evaluate(() => { const b = document.querySelector('.stk-stage').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await gp.touchscreen.tap(box.x, box.y); // dismiss how-to / start
    await sleep(450);
    let over = false;
    for (let i = 0; i < 50 && !over; i++) {
      await gp.touchscreen.tap(box.x, box.y);
      await sleep(420); // varied arm phase => slices shrink the top, then a miss
      over = await gp.evaluate(() => !!document.querySelector('.stk-over'));
    }
    if (!over) { console.log('  (could not reach game-over in 50 taps)'); }
    else {
      const m = await gp.evaluate(() => {
        const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
        const stage = document.querySelector('.stk-stage');
        const over = document.querySelector('.stk-over');
        const card = document.querySelector('.stk-overcard');
        const btns = [...document.querySelectorAll('.stk-over .cm-btn, .stk-over button')].map((b) => ({ t: (b.textContent || '').trim().slice(0, 18), ...(() => { const x = b.getBoundingClientRect(); return { top: Math.round(x.top), bottom: Math.round(x.bottom) }; })() }));
        const entry = !!document.querySelector('.stk-initials');
        return { stage: r(stage), card: r(card), overScrollable: over.scrollHeight > over.clientHeight + 1, stageOverflowHidden: getComputedStyle(stage).overflowY, entry, btns };
      });
      console.log('  mode:', m.entry ? 'HIGH-SCORE ENTRY (has Save)' : 'game over');
      console.log('  stage:', JSON.stringify(m.stage), ' card:', JSON.stringify(m.card));
      console.log('  card taller than stage?', m.card.h > m.stage.h, ' overlay scrollable?', m.overScrollable);
      console.log('  buttons:', JSON.stringify(m.btns));
      // scroll the overlay to the bottom and confirm the last button is within the stage
      await gp.evaluate(() => { const o = document.querySelector('.stk-over'); o.scrollTop = o.scrollHeight; });
      await sleep(200);
      const reach = await gp.evaluate(() => {
        const stage = document.querySelector('.stk-stage').getBoundingClientRect();
        const btns = [...document.querySelectorAll('.stk-over .cm-btn, .stk-over button')];
        const last = btns[btns.length - 1];
        if (!last) return { ok: false, why: 'no buttons' };
        const b = last.getBoundingClientRect();
        return { ok: b.top >= stage.top - 1 && b.bottom <= stage.bottom + 1, label: (last.textContent || '').trim().slice(0, 18), btnTop: Math.round(b.top), btnBottom: Math.round(b.bottom), stageTop: Math.round(stage.top), stageBottom: Math.round(stage.bottom) };
      });
      console.log('  after scroll-to-bottom, last button fully inside stage?', reach.ok, JSON.stringify(reach));
      await gp.screenshot({ path: '_reference/shot-gameover-390x660.png' });
    }
    await gp.close();
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
