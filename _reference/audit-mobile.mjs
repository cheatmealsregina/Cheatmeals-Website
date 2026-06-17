// Mobile UI/UX audit harness — renders the built site at phone widths in both
// themes, screenshots each page full-length, and runs programmatic checks:
// horizontal overflow, sub-44px touch targets, sticky-tab behaviour, and
// call-bar overlap. Requires `npm run preview` on :4173. Output: _audit/*.png
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:4173';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = ROOT + '_audit';
mkdirSync(OUT, { recursive: true });

const WIDTHS = [
  { name: '360', w: 360, h: 780 }, // small Android
  { name: '390', w: 390, h: 844 }, // iPhone 12–15
];
const THEMES = ['light', 'dark'];
const ROUTES = [
  { path: '/', wait: '#menu .cm-menu-card' },
  { path: '/jokes', wait: '.cm-joke-card__text' },
  { path: '/game', wait: '.stk-stage' },
  { path: '/admin', wait: '.pt-login' },
];

const report = {};

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  for (const route of ROUTES) {
    for (const wd of WIDTHS) {
      for (const theme of THEMES) {
        const key = `${route.path}|${wd.name}|${theme}`;
        const p = await browser.newPage();
        await p.setViewport({ width: wd.w, height: wd.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await p.evaluateOnNewDocument((t) => {
          try { localStorage.setItem('cm-theme', t); } catch (e) {}
        }, theme);
        const errs = [];
        p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
        await p.goto(BASE + route.path, { waitUntil: 'networkidle0', timeout: 30000 });
        try { await p.waitForSelector(route.wait, { timeout: 15000 }); } catch (e) { errs.push('missing ' + route.wait); }

        const checks = await p.evaluate(() => {
          const iw = window.innerWidth;
          const scrollW = document.documentElement.scrollWidth;
          // overflow offenders: visible elements extending past the viewport's right edge
          const offenders = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right > iw + 1) {
              offenders.push({
                sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
                right: Math.round(r.right), w: Math.round(r.width),
              });
            }
          }
          // de-dup offenders by selector, keep widest
          const offMap = {};
          for (const o of offenders) { if (!offMap[o.sel] || o.right > offMap[o.sel].right) offMap[o.sel] = o; }

          // touch targets: visible interactive elements smaller than 44px in either axis
          const small = [];
          const sel = 'a[href], button, [role="button"], input, select, [role="switch"], .pt-jokes-lang';
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue; // hidden
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (r.width < 44 || r.height < 44) {
              const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28);
              small.push({
                sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
                w: Math.round(r.width), h: Math.round(r.height), label,
              });
            }
          }
          const smallMap = {};
          for (const s of small) { const k = s.sel + '|' + s.label; if (!smallMap[k]) smallMap[k] = s; }

          return { iw, scrollW, overflow: scrollW > iw + 1, offenders: Object.values(offMap), small: Object.values(smallMap) };
        });

        // sticky-tab + callbar test only on the main site page
        let sticky = null, callbar = null;
        if (route.path === '/') {
          sticky = await p.evaluate(async () => {
            const tabs = document.querySelector('.cm-tabs');
            if (!tabs) return { found: false };
            tabs.scrollIntoView();
            await new Promise((r) => setTimeout(r, 60));
            const beforeTop = tabs.getBoundingClientRect().top;
            window.scrollBy(0, 500);
            await new Promise((r) => setTimeout(r, 60));
            const afterTop = tabs.getBoundingClientRect().top;
            // sticky working => afterTop stays near beforeTop; broken => drops ~500
            return { found: true, beforeTop: Math.round(beforeTop), afterTop: Math.round(afterTop), stuck: Math.abs(afterTop - beforeTop) < 120 };
          });
          callbar = await p.evaluate(async () => {
            window.scrollTo(0, document.documentElement.scrollHeight);
            await new Promise((r) => setTimeout(r, 80));
            const bar = document.querySelector('.pt-callbar');
            if (!bar) return { found: false };
            const br = bar.getBoundingClientRect();
            const cs = getComputedStyle(bar);
            // is something important hidden behind it? check footer link overlap
            const footer = document.querySelector('.cm-footer, footer');
            const fr = footer ? footer.getBoundingClientRect() : null;
            return {
              found: true, position: cs.position,
              top: Math.round(br.top), bottom: Math.round(br.bottom), height: Math.round(br.height),
              viewportH: window.innerHeight,
              overlapsFooter: fr ? (br.top < fr.bottom && br.bottom > fr.top) : null,
            };
          });
        }

        await p.screenshot({ path: `${OUT}/${route.path.replace(/\W+/g, '') || 'home'}-${wd.name}-${theme}.png`, fullPage: true });
        report[key] = { ...checks, sticky, callbar, errs };
        await p.close();
      }
    }
  }
} finally {
  await browser.close();
}

// ---- print compact report ----
for (const [key, r] of Object.entries(report)) {
  console.log('\n=== ' + key + ' ===');
  console.log(`  viewport ${r.iw}px · scrollWidth ${r.scrollW}px · horizontalOverflow: ${r.overflow ? 'YES ⚠' : 'no'}`);
  if (r.offenders.length) r.offenders.forEach((o) => console.log(`    overflow: ${o.sel}  right=${o.right} w=${o.w}`));
  if (r.small.length) {
    console.log('  sub-44px touch targets:');
    r.small.forEach((s) => console.log(`    ${s.sel}  ${s.w}x${s.h}  "${s.label}"`));
  } else console.log('  touch targets: all >= 44px ✓');
  if (r.sticky && r.sticky.found) console.log(`  sticky tabs: before=${r.sticky.beforeTop} after=${r.sticky.afterTop} → ${r.sticky.stuck ? 'STICKS ✓' : 'does NOT stick ⚠'}`);
  if (r.callbar && r.callbar.found) console.log(`  callbar: ${r.callbar.position} top=${r.callbar.top} bottom=${r.callbar.bottom}/${r.callbar.viewportH} h=${r.callbar.height} overlapsFooter=${r.callbar.overlapsFooter}`);
  if (r.errs.length) console.log('  PAGE ERRORS: ' + r.errs.join(' | '));
}
console.log('\nscreenshots → ' + OUT);
