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

  // Search-targeted content pages. They share the 'content' render key (the SPA
  // dispatches the right page by path); the per-path SEO metadata lives in
  // src/lib/contentRoutes.js, which MUST list these same paths. `ready` is the
  // common content-page selector. Keep paths in sync with contentRoutes.js.
  { path: '/jain-swaminarayan-food-regina', key: 'content', out: 'jain-swaminarayan-food-regina/index.html', ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/what-is-an-indian-burger',      key: 'content', out: 'what-is-an-indian-burger/index.html',      ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/vegetarian-burgers-regina',     key: 'content', out: 'vegetarian-burgers-regina/index.html',     ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/about',                         key: 'content', out: 'about/index.html',                         ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/frankies-regina',               key: 'content', out: 'frankies-regina/index.html',               ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/indian-sandwiches-regina',      key: 'content', out: 'indian-sandwiches-regina/index.html',      ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/loaded-fries-regina',           key: 'content', out: 'loaded-fries-regina/index.html',           ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/paneer-burgers-regina',         key: 'content', out: 'paneer-burgers-regina/index.html',         ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
  { path: '/aloo-burgers-regina',           key: 'content', out: 'aloo-burgers-regina/index.html',           ready: '.cm-content', changefreq: 'monthly', priority: '0.7' },
];
