// Single source of truth for the site's PUBLIC, indexable routes.
//
// Both the build-time sitemap generator (gen-sitemap.mjs) and the prerenderer
// (prerender.mjs) consume this list, so "what routes exist" is defined in one
// place and the two can never drift. Add a public route here and it flows into
// BOTH the prerendered static HTML and the sitemap automatically.
//
// /admin is intentionally ABSENT — it must never be prerendered, indexed, or
// listed in the sitemap (it's the owner editor; robots.txt disallows it and
// routeHead.js marks it noindex). Do not add it here.
//
// ORIGIN must stay identical to src/lib/routeHead.js's ORIGIN and the canonical
// host in index.html: https + apex (non-www), no trailing slash. This is the
// one canonical host form every canonical/OG/sitemap URL uses.
export const ORIGIN = 'https://cheatmealshoib.com';

export const PUBLIC_ROUTES = [
  // path     prerender: key/out/ready          sitemap: changefreq/priority
  { path: '/',      key: 'site',  out: 'index.html',       ready: '#visit',              changefreq: 'weekly',  priority: '1.0' },
  { path: '/game',  key: 'game',  out: 'game/index.html',  ready: '.stk-board',          changefreq: 'monthly', priority: '0.5' },
  { path: '/jokes', key: 'jokes', out: 'jokes/index.html', ready: '.cm-joke-card__text', changefreq: 'monthly', priority: '0.5' },
];
