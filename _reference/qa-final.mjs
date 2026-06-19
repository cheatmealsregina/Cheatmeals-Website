// Final QA pass — mechanical checks on the prerendered dist HTML for the nine
// content pages: word count (>=300), the egg/eggless dietary statements
// (regular mayo sauces contain egg; Jain/Swaminarayan use eggless sauces), and
// title/description presence. Reads dist directly — run after `npm run build`.
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { CONTENT_ROUTES } from '../src/lib/contentRoutes.js';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ');

// visible article text = the <main class="... cm-content ...">…</main> region,
// tags stripped. Excludes nav/footer/scripts, so it's the real page copy.
function articleText(html) {
  const m = html.match(/<main[^>]*class="[^"]*cm-content[^"]*"[^>]*>([\s\S]*?)<\/main>/i);
  const region = m ? m[1] : html;
  return dec(region.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
const words = (t) => (t.match(/[A-Za-z0-9’'-]+/g) || []).length;

const read = (p) => readFile(path.join(DIST, p.replace(/^\//, ''), 'index.html'), 'utf8');

let fails = 0;
const bad = (m) => { console.log('  ✗ ' + m); fails++; };
const good = (m) => console.log('  ✓ ' + m);

// Pages where regular mayo sauces are described in an egg context must say they
// contain egg (owner-confirmed). Pages that only reference "eggless instead of
// regular mayo-based sauces" are noted separately.
const MAYO_EGG = /(mayo[- ]based sauces contain egg|mayo sauces contain egg|sauces (?:at CheatMeals )?are mayo-based and contain egg|dips and sauces are mayo-based and contain egg)/i;
const EGGLESS_INSTEAD = /eggless sauces (?:can be used )?instead of regular mayo-based sauces|uses eggless sauces/i;

console.log('=== Item 10: word count per page (>= 300) ===\n');
for (const r of CONTENT_ROUTES) {
  const html = await read(r.path);
  const w = words(articleText(html));
  if (w >= 300) good(`${r.path.padEnd(34)} ${w} words`);
  else bad(`${r.path.padEnd(34)} ${w} words (< 300)`);
}

console.log('\n=== Item 12: regular mayo sauces described as containing egg ===\n');
for (const r of CONTENT_ROUTES) {
  const html = await read(r.path);
  const txt = articleText(html);
  const mentionsMayo = /mayo|mayonnaise/i.test(txt);
  if (!mentionsMayo) { good(`${r.path.padEnd(34)} (no mayo claim on page — n/a)`); continue; }
  if (MAYO_EGG.test(txt)) good(`${r.path.padEnd(34)} states mayo sauces contain egg`);
  else if (EGGLESS_INSTEAD.test(txt)) good(`${r.path.padEnd(34)} frames mayo as needing eggless substitute`);
  else bad(`${r.path.padEnd(34)} mentions mayo but never says it contains egg`);
}

console.log('\n=== Item 13: Jain/Swaminarayan eggless-sauce statement ===\n');
const jain = articleText(await read('/jain-swaminarayan-food-regina'));
for (const [who, re] of [
  ['Jain', /For Jain orders, CheatMeals uses eggless sauces instead of regular mayo-based sauces/i],
  ['Swaminarayan', /For Swaminarayan orders, CheatMeals uses eggless sauces instead of regular mayo-based sauces/i],
  ['Jain & Swaminarayan (combined)', /For Jain and Swaminarayan food, CheatMeals uses eggless sauces/i],
]) {
  if (re.test(jain)) good(`/jain-swaminarayan-food-regina clearly states: ${who} → eggless sauces`);
  else bad(`/jain-swaminarayan-food-regina MISSING ${who} eggless-sauce statement`);
}

console.log('\n=== Item 9: title + meta description present per page ===\n');
for (const r of CONTENT_ROUTES) {
  const html = await read(r.path);
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1];
  const desc = ((html.match(/<meta[^>]*name="description"[^>]*>/i) || [])[0] || '').match(/content="([^"]*)"/i);
  const okT = title && title.length > 10;
  const okD = desc && desc[1] && desc[1].length > 30;
  if (okT && okD) good(`${r.path.padEnd(34)} title(${title.length}) + desc(${desc[1].length})`);
  else bad(`${r.path.padEnd(34)} title/desc problem (t=${!!okT} d=${!!okD})`);
}

console.log('\n' + (fails === 0 ? 'ALL PASS ✓' : fails + ' CHECK(S) FAILED ✗'));
process.exit(fails === 0 ? 0 : 1);
