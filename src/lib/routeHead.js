/* Per-route <head> metadata for the SPA.
 *
 * index.html ships the home page's title/description/canonical/OG tags. Because
 * this is a client-rendered SPA with no SSR, every route initially serves that
 * same head — so /game and /jokes would otherwise canonicalise to "/" (telling
 * Google they're duplicates of home), and /admin would be indexable.
 *
 * Each route here is a full page load (the nav uses real <a href> links, no
 * client router), so this runs once per load. JS-rendering crawlers (Googlebot)
 * pick up the updates; the static robots.txt + sitemap.xml are the non-JS
 * baseline. We only touch the non-home routes — "/" keeps index.html's values
 * verbatim, so there's no second copy of the home metadata to drift. */

const ORIGIN = 'https://cheatmealshoib.com';

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

/* Update title, description, canonical and the social-card tags so they match
   the page actually being viewed. */
function applyPage({ title, description, url }) {
  document.title = title;
  setMeta('description', description);
  setCanonical(url);
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:url', url, 'property');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
}

export function applyRouteHead(path) {
  if (path.startsWith('/game')) {
    applyPage({
      title: 'Patty Stacker — CheatMeals',
      description:
        "Stack the perfect burger while you wait — play Patty Stacker, CheatMeals' free arcade game, and climb the leaderboard.",
      url: ORIGIN + '/game',
    });
    setRobots(null);
  } else if (path.startsWith('/jokes')) {
    applyPage({
      title: 'Jokes On The House — CheatMeals',
      description:
        'One-liners to chew on while your order hits the grill. Jokes on the house from CheatMeals in Regina.',
      url: ORIGIN + '/jokes',
    });
    setRobots(null);
  } else if (path.startsWith('/admin')) {
    /* Owner editor — keep it out of search. robots.txt disallows it too; this
       covers JS-rendering crawlers that fetch it anyway. No canonical (Google
       ignores canonical on noindex pages). */
    document.title = 'Admin — CheatMeals';
    setRobots('noindex, nofollow');
  }
  /* else: home / any site path — index.html's static head is authoritative. */
}
