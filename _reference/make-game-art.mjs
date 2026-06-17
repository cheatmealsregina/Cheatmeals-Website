// Turn the three supplied line-art PNGs (black + red on white) into the game's
// themed art slots: transparent light (black/red ink) + dark (cream/red ink)
// variants, each as WebP + PNG. White background -> transparent via min-channel
// keying; the dark variant recolours low-saturation (black/grey) ink to cream
// and keeps the red. Illustrations are cropped to content; the backdrop keeps
// its full frame so it tiles to the playfield edges under object-fit: cover.
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DL = 'C:\\Users\\aayus\\Downloads\\';
const OUT = fileURLToPath(new URL('../public/assets/game/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const JOBS = [
  { name: 'highscore', file: 'ChatGPT Image Jun 16, 2026, 08_05_42 PM.png', crop: true },
  { name: 'gameover', file: 'ChatGPT Image Jun 16, 2026, 08_02_55 PM.png', crop: true },
  { name: 'backdrop', file: 'ChatGPT Image Jun 16, 2026, 07_59_58 PM.png', crop: false },
];

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  const page = await browser.newPage();
  for (const job of JOBS) {
    const dataUrl = 'data:image/png;base64,' + readFileSync(DL + job.file).toString('base64');
    const out = await page.evaluate(async (src, doCrop) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const w = img.naturalWidth, h = img.naturalHeight;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, w, h).data;

      const CREAM = [245, 240, 228];
      const WHITE_CUT = 236;  // min-channel >= this => white background -> transparent
      const SAT_INK = 55;     // saturation below this => grey/black ink (recolour for dark)
      const light = new Uint8ClampedArray(d.length);
      const dark = new Uint8ClampedArray(d.length);
      let minX = w, minY = h, maxX = 0, maxY = 0;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
        const sat = mx - mn;
        const a = mn >= WHITE_CUT ? 0 : Math.min(255, Math.round((255 - mn) * 1.18));
        light[i] = r; light[i + 1] = g; light[i + 2] = b; light[i + 3] = a;
        if (sat < SAT_INK) { dark[i] = CREAM[0]; dark[i + 1] = CREAM[1]; dark[i + 2] = CREAM[2]; }
        else { dark[i] = r; dark[i + 1] = g; dark[i + 2] = b; }
        dark[i + 3] = a;
        if (a > 24) {
          const p = i / 4, px = p % w, py = (p / w) | 0;
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py < minY) minY = py; if (py > maxY) maxY = py;
        }
      }

      let cx = 0, cy = 0, cw = w, chh = h;
      if (doCrop) {
        const pad = 12;
        cx = Math.max(0, minX - pad); cy = Math.max(0, minY - pad);
        cw = Math.min(w - 1, maxX + pad) - cx + 1; chh = Math.min(h - 1, maxY + pad) - cy + 1;
      }
      const render = (arr) => {
        const full = document.createElement('canvas');
        full.width = w; full.height = h;
        full.getContext('2d').putImageData(new ImageData(arr, w, h), 0, 0);
        const o = document.createElement('canvas');
        o.width = cw; o.height = chh;
        o.getContext('2d').drawImage(full, cx, cy, cw, chh, 0, 0, cw, chh);
        return { webp: o.toDataURL('image/webp', 0.92), png: o.toDataURL('image/png') };
      };
      return { w, h, cw, chh, light: render(light), dark: render(dark) };
    }, dataUrl, job.crop);

    const strip = (u) => Buffer.from(u.split(',')[1], 'base64');
    for (const theme of ['light', 'dark']) {
      writeFileSync(OUT + `${job.name}-${theme}.webp`, strip(out[theme].webp));
      writeFileSync(OUT + `${job.name}-${theme}.png`, strip(out[theme].png));
    }
    const kb = (u) => (strip(u).length / 1024).toFixed(0);
    console.log(`${job.name}: ${out.w}x${out.h} -> ${out.cw}x${out.chh}  (light ${kb(out.light.webp)}KB webp / ${kb(out.light.png)}KB png)`);
  }
} finally {
  await browser.close();
}
console.log('wrote 12 files to', OUT);
