// Minimal static server for dist/ with directory-index resolution — mirrors
// Vercel (/about -> dist/about/index.html). Used for Lighthouse runs.
import http from 'http';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.argv[2] || 5055);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };

function fileFor(p) {
  if (p.includes('..') || p === '/') return path.join(DIST, 'index.html');
  const direct = path.join(DIST, p);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const idx = path.join(DIST, p, 'index.html');
  if (existsSync(idx)) return idx;
  if (!path.extname(p)) return path.join(DIST, 'index.html');
  return direct;
}

http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = fileFor(p);
    if (!existsSync(file)) { res.statusCode = 404; res.end('nf'); return; }
    res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch (e) { res.statusCode = 500; res.end('err'); }
}).listen(PORT, () => console.log('[serve-dist] http://localhost:' + PORT));
