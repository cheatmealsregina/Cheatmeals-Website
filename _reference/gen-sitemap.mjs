// Build-time sitemap generator. Runs after `vite build`, before the prerender:
// writes dist/sitemap.xml from the canonical PUBLIC_ROUTES list so the sitemap
// always lists exactly the public, indexable routes — with absolute https URLs
// (the one canonical host form) and a fresh <lastmod> — and never goes stale.
//
// /admin is excluded automatically (it isn't in PUBLIC_ROUTES). Adding/removing
// a public route in _reference/routes.mjs is the only edit needed; this picks it
// up on the next build.
//
// lastmod is the build date (UTC, YYYY-MM-DD). On Vercel every deploy is a fresh
// build, so this reflects the last time the site was actually published.
//
// Non-fatal: if anything throws it logs and exits 0, leaving the static
// public/sitemap.xml that Vite already copied into dist as a fallback, so the
// build (and deploy) never break.
import { writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { ORIGIN, PUBLIC_ROUTES } from './routes.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

function buildSitemap(lastmod) {
  const urls = PUBLIC_ROUTES.map((r) => {
    // Absolute URL on the canonical host. '/' keeps its trailing slash; every
    // other route is ORIGIN + path with no trailing slash, matching the
    // self-canonical each page emits.
    const loc = ORIGIN + r.path;
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- Generated at build time by _reference/gen-sitemap.mjs from\n' +
    '     _reference/routes.mjs. Do not hand-edit; change the route list there. -->\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    '\n</urlset>\n'
  );
}

try {
  if (!existsSync(DIST)) {
    console.warn('[sitemap] dist/ not found — run vite build first. Skipping.');
    process.exit(0);
  }
  const lastmod = new Date().toISOString().slice(0, 10);
  const xml = buildSitemap(lastmod);
  writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
  console.log(`[sitemap] wrote dist/sitemap.xml — ${PUBLIC_ROUTES.length} URLs, lastmod ${lastmod} (admin excluded).`);
} catch (e) {
  console.warn('[sitemap] skipped due to error:', e && e.message);
  process.exit(0);
}
