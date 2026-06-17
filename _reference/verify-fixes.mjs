// Verify the mobile audit fixes: nav fits (theme toggle not clipped) down to
// 320px, jokes pills + footer links clear 44px, and the game stage clears the
// fixed CallBar. Requires `npm run preview` on :4173.
import puppeteer from 'puppeteer-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:4173';
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
const log = (ok, msg) => console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${msg}`);
try {
  // ---- #1 nav fit: theme toggle (last action) must sit inside the viewport ----
  console.log('#1 nav fit (theme toggle right edge <= viewport):');
  for (const w of [320, 360, 375, 390]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-toggle');
    const r = await p.evaluate(() => {
      const t = document.querySelector('.pt-nav__actions .pt-toggle');
      const acts = document.querySelector('.pt-nav__actions');
      return { toggleRight: Math.round(t.getBoundingClientRect().right), actsRight: Math.round(acts.getBoundingClientRect().right), iw: window.innerWidth };
    });
    log(r.toggleRight <= r.iw, `${w}px: toggle right=${r.toggleRight} actions right=${r.actsRight} (viewport ${r.iw})`);
    await p.close();
  }
  // ---- #4 / #7 touch targets ----
  console.log('#4 jokes pills + #7 footer links >= 44px:');
  {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(BASE + '/jokes', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.pt-jokes-lang');
    const pills = await p.evaluate(() => [...document.querySelectorAll('.pt-jokes-lang')].map((e) => ({ t: e.textContent.trim(), h: Math.round(e.getBoundingClientRect().height) })));
    pills.forEach((x) => log(x.h >= 44, `jokes pill "${x.t}" height=${x.h}`));
    const flinks = await p.evaluate(() => [...document.querySelectorAll('.cm-footer__meta a')].map((e) => ({ t: e.textContent.trim().slice(0, 20), h: Math.round(e.getBoundingClientRect().height) })));
    flinks.forEach((x) => log(x.h >= 44, `footer link "${x.t}" height=${x.h}`));
    await p.close();
  }
  // ---- #3 game stage clears the call bar ----
  console.log('#3 game stage bottom vs call-bar top (overlap should be ~0 on normal phones):');
  for (const [w, h] of [[360, 780], [390, 844], [414, 896]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(BASE + '/game', { waitUntil: 'networkidle0' });
    await p.waitForSelector('.stk-stage');
    const r = await p.evaluate(() => {
      const s = document.querySelector('.stk-stage').getBoundingClientRect();
      const bar = document.querySelector('.pt-callbar').getBoundingClientRect();
      return { stageBottom: Math.round(s.bottom), stageH: Math.round(s.height), barTop: Math.round(bar.top), overlap: Math.max(0, Math.round(s.bottom - bar.top)) };
    });
    log(r.overlap === 0, `${w}x${h}: stageH=${r.stageH} stageBottom=${r.stageBottom} barTop=${r.barTop} overlap=${r.overlap}`);
    await p.close();
  }
  // ---- no horizontal page scroll anywhere we touched ----
  console.log('no horizontal page overflow:');
  for (const [route, w] of [['/', 320], ['/', 360], ['/game', 360], ['/jokes', 360]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(BASE + route, { waitUntil: 'networkidle0' });
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    log(r.sw <= r.iw + 1, `${route} @${w}: scrollWidth=${r.sw} (viewport ${r.iw})`);
    await p.close();
  }
} finally {
  await b.close();
}
