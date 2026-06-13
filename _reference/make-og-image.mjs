// Renders public/assets/og-image.png (1200x630): the primary lockup on the
// cream stage with the brand tagline — used by og:image / twitter:image.
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const logo = readFileSync(ROOT + 'public/assets/logos/cheatmeals-primary.svg', 'utf8');

const html = `<!DOCTYPE html><html><head><style>
  body { margin: 0; width: 1200px; height: 630px; background: #FAF6EF;
         display: grid; place-items: center; font-family: sans-serif; }
  .wrap { display: grid; justify-items: center; gap: 8px; }
  svg { height: 480px; width: auto; color: #0A0A0A; }
</style></head><body>
  <div class="wrap">${logo.replace('<svg ', '<svg style="height:480px;width:auto" ')}</div>
</body></html>`;

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--force-device-scale-factor=1'],
});
const p = await browser.newPage();
await p.setViewport({ width: 1200, height: 630 });
await p.setContent(html, { waitUntil: 'networkidle0' });
await p.screenshot({ path: ROOT + 'public/assets/og-image.png' });
await browser.close();
console.log('og-image.png written (1200x630)');
