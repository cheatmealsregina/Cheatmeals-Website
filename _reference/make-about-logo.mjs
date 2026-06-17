// Turns the supplied CHEATMEALS lockup (black + red on white JPEG) into two
// trimmed, transparent PNGs for the About hero:
//   cheatmeals-about-light.png  — black + red ink (for light theme)
//   cheatmeals-about-dark.png   — cream + red ink (for dark theme)
// Decoding + pixel work happen in a headless-browser canvas (handles JPEG, no
// ImageMagick needed). White background -> transparent via min-channel keying
// (keeps red fully opaque, preserves anti-aliased edges); the dark variant
// recolours low-saturation (black/grey) ink to cream and keeps the red bun.
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SRC = 'C:\\Users\\aayus\\Downloads\\WhatsApp Image 2026-06-16 at 7.06.12 PM.jpeg';
const OUT_DIR = fileURLToPath(new URL('../public/assets/logos/', import.meta.url));

const b64 = readFileSync(SRC).toString('base64');
const dataUrl = 'data:image/jpeg;base64,' + b64;

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async (src) => {
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
    const WHITE_CUT = 232;   // min-channel >= this => background
    const SAT_INK = 55;      // saturation below this => grey/black ink (recolour for dark)
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

    const pad = 10;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1, chh = maxY - minY + 1;

    function crop(arr) {
      const out = document.createElement('canvas');
      out.width = cw; out.height = chh;
      const octx = out.getContext('2d');
      const full = document.createElement('canvas');
      full.width = w; full.height = h;
      full.getContext('2d').putImageData(new ImageData(arr, w, h), 0, 0);
      octx.drawImage(full, minX, minY, cw, chh, 0, 0, cw, chh);
      return out.toDataURL('image/png');
    }
    return { w, h, cw, chh, light: crop(light), dark: crop(dark) };
  }, dataUrl);

  const strip = (u) => Buffer.from(u.split(',')[1], 'base64');
  writeFileSync(OUT_DIR + 'cheatmeals-about-light.png', strip(result.light));
  writeFileSync(OUT_DIR + 'cheatmeals-about-dark.png', strip(result.dark));
  console.log(`source ${result.w}x${result.h} -> cropped ${result.cw}x${result.chh}`);
  console.log('wrote cheatmeals-about-light.png + cheatmeals-about-dark.png');
} finally {
  await browser.close();
}
