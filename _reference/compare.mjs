// Pixel-compares _reference/shots/baseline/*.png against shots/after/*.png
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const dirA = fileURLToPath(new URL('./shots/baseline/', import.meta.url));
const dirB = fileURLToPath(new URL('./shots/after/', import.meta.url));

const files = readdirSync(dirA).filter((f) => f.endsWith('.png'));
let worst = 0;
for (const f of files) {
  let b;
  try { b = PNG.sync.read(readFileSync(dirB + f)); } catch { console.log(`${f}: MISSING in after/`); continue; }
  const a = PNG.sync.read(readFileSync(dirA + f));
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`${f}: SIZE DIFF ${a.width}x${a.height} -> ${b.width}x${b.height}`);
    worst = Math.max(worst, 100);
    continue;
  }
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) > 2 ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > 2 ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > 2
    ) diff++;
  }
  const pct = (diff / (a.width * a.height)) * 100;
  worst = Math.max(worst, pct);
  console.log(`${f}: ${diff === 0 ? 'IDENTICAL' : diff + ' px differ (' + pct.toFixed(3) + '%)'}`);
}
console.log(`\nworst: ${worst.toFixed(3)}%`);
