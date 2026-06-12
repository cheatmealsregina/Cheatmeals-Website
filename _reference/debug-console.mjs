import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
});
const page = await browser.newPage();
page.on('console', (m) => console.log(`[${m.type()}]`, m.text().slice(0, 500)));
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 800)));
page.on('requestfailed', (r) => console.log('[reqfail]', r.url(), r.failure()?.errorText));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML.slice(0, 200));
console.log('ROOT:', rootHtml || '(empty)');
await browser.close();
