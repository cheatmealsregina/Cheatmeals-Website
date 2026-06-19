/* Per-route <head> metadata for the SPA.
 *
 * This is the single source of truth for each real route's title, description,
 * canonical and social-card tags (plus the home page's Restaurant JSON-LD).
 * There are only three indexable routes — Menu/About/Team/Visit are sections of
 * the home page (anchors like /#menu), so they share "/"'s metadata; the home
 * page already carries their content and keywords.
 *
 * The prerender step runs the app in a real browser and snapshots the DOM after
 * this has run, so these values are BAKED INTO the prerendered HTML (not just
 * set client-side). index.html ships matching home defaults for the no-JS
 * baseline; on every other route this overwrites them. Each route is a full
 * page load (the nav uses real <a href> links, no client router), so this runs
 * once per load. /admin is marked noindex (robots.txt disallows it too). */

const ORIGIN = 'https://cheatmealshoib.com';
const OG_IMAGE = ORIGIN + '/assets/og-image.png';
const OG_IMAGE_ALT = 'CheatMeals — Indian burgers and Desi street food in Regina';
/* Storefront coordinates for 4306 Dewdney Avenue, Regina, SK (owner-supplied). */
const GEO = { latitude: 50.455278, longitude: -104.642571 };

const META = {
  site: {
    url: ORIGIN + '/',
    title: 'CheatMeals — Home of Indian Burgers | Regina',
    description:
      'Indian burgers (aloo and paneer), frankies, sand-witches and pavs with house-made patties — Indian street food in Regina. Dine in or call to order.',
  },
  game: {
    url: ORIGIN + '/game',
    title: 'Patty Stacker — Burger Stacking Game | CheatMeals Regina',
    description:
      "Stack the perfect burger while you wait for your order — play Patty Stacker, CheatMeals' free arcade game, and climb the leaderboard.",
  },
  jokes: {
    url: ORIGIN + '/jokes',
    title: 'Jokes On The House | CheatMeals Regina',
    description:
      'One-liners to chew on while your order hits the grill — jokes on the house from CheatMeals in Regina.',
  },
};

/* Maps a pathname to the top-level layout it renders. Used by both the router
   (App.jsx) and the boot logic (main.jsx) so prerender/hydration agree on what
   "this page" is: every non-game/jokes/admin path is the one-page site. */
export function renderKey(path) {
  if (path.startsWith('/game')) return 'game';
  if (path.startsWith('/jokes')) return 'jokes';
  if (path.startsWith('/admin')) return 'admin';
  return 'site';
}

function setMeta(key, content, attr = 'name') {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setRobots(content) {
  let el = document.head.querySelector('meta[name="robots"]');
  if (content == null) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'robots');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/* Restaurant (LocalBusiness) structured data for the home page — built from the
   live/seed data so it always matches the visible NAP + hours. geo coordinates
   are intentionally omitted (none in the data); the owner can add exact
   lat/long later rather than ship a placeholder. */
function parse12h(s) {
  const m = String(s).match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] || '00';
  const pm = /p/i.test(m[3]);
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + min;
}

function openingHours(hours) {
  const byRange = new Map(); // group days that share the same open/close
  for (const h of hours || []) {
    if (!h || !h.time || /closed/i.test(h.time)) continue;
    const parts = String(h.time).split(/\s*(?:–|—|-|to)\s*/i);
    if (parts.length < 2) continue;
    const opens = parse12h(parts[0]);
    const closes = parse12h(parts[1]);
    if (!opens || !closes) continue;
    const key = opens + '-' + closes;
    if (!byRange.has(key)) byRange.set(key, { opens, closes, days: [] });
    byRange.get(key).days.push(h.day);
  }
  return [...byRange.values()].map((r) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: r.days,
    opens: r.opens,
    closes: r.closes,
  }));
}

function buildRestaurantSchema() {
  const d = (typeof window !== 'undefined' && window.CM_DATA) || {};
  if (!d.address) return null;
  const [locality, region] = String(d.city || '').split(',').map((s) => s.trim());
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'CheatMeals',
    description: META.site.description,
    url: ORIGIN + '/',
    image: OG_IMAGE,
    servesCuisine: ['Indian', 'Burgers', 'Street Food'],
    priceRange: '$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: d.address,
      addressLocality: locality || 'Regina',
      addressRegion: region || 'SK',
      postalCode: 'S4T 1A8',
      addressCountry: 'CA',
    },
    geo: { '@type': 'GeoCoordinates', latitude: GEO.latitude, longitude: GEO.longitude },
    hasMenu: ORIGIN + '/#menu',
  };
  if (d.tel) schema.telephone = String(d.tel).replace(/^tel:/, '');
  const oh = openingHours(d.hours);
  if (oh.length) schema.openingHoursSpecification = oh;
  if (d.instagramUrl) schema.sameAs = [d.instagramUrl];
  return schema;
}

function setJsonLd(obj) {
  let el = document.head.querySelector('script#cm-jsonld');
  if (!obj) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'cm-jsonld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj);
}

/* Set the full head for a route: title, description, self-canonical and the
   complete OpenGraph + Twitter card set (image/type/locale are the same brand
   card on every route; title/description/url are per-route). */
function applyPage({ title, description, url }) {
  document.title = title;
  setMeta('description', description);
  setCanonical(url);
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:type', 'website', 'property');
  setMeta('og:image', OG_IMAGE, 'property');
  setMeta('og:image:alt', OG_IMAGE_ALT, 'property');
  setMeta('og:site_name', 'CheatMeals', 'property');
  setMeta('og:locale', 'en_CA', 'property');
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', OG_IMAGE);
  setMeta('twitter:image:alt', OG_IMAGE_ALT);
}

export function applyRouteHead(path) {
  const key = renderKey(path);
  if (key === 'admin') {
    /* Owner editor — keep it out of search. robots.txt disallows it too; this
       covers JS-rendering crawlers that fetch it anyway. No canonical (Google
       ignores canonical on noindex pages). */
    document.title = 'Admin — CheatMeals';
    setRobots('noindex, nofollow');
    setJsonLd(null);
    return;
  }
  applyPage(META[key]);
  setRobots(null); // ensure indexable (no stale noindex from a prior route)
  /* Restaurant structured data belongs on the business's main page only. */
  setJsonLd(key === 'site' ? buildRestaurantSchema() : null);
}
