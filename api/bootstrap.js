/* GET /api/bootstrap — the public site's read data (menu + site content) in
   one cached response.

   Why this exists: the browser used to query Supabase directly on every page
   load, so N concurrent visitors meant N x (categories + items + site_content)
   hitting the database, each paying a full round-trip to the Supabase region.
   This endpoint fetches the same rows and lets Vercel's CDN serve them:

   - Edge cache (s-maxage=60): each edge PoP touches the origin ~once per 60s no
     matter how many visitors it serves; stale-while-revalidate keeps responses
     instant while a fresh copy is fetched in the background.
   - In-instance coalescing (TTL_MS): on a cold-cache burst (e.g. a launch spike
     before the edge has cached anything), concurrent invocations that land on
     the same warm function instance share ONE upstream read instead of each
     firing their own. A genuinely cold start still fans out a small, bounded,
     one-time burst that self-heals the instant the first response is cached.

   Reads only, anon key — RLS still applies (it only returns what the public anon
   role may read). Uses the SERVER env vars (SUPABASE_URL / SUPABASE_ANON_KEY,
   already set in Vercel for the leaderboard function); the service-role key is
   never used. */

/* In-instance micro-cache + in-flight coalescing. Lives for the life of a warm
   serverless instance; the CDN's s-maxage governs real freshness, this only
   collapses concurrent same-instance reads during a cache-miss burst. */
const TTL_MS = 10_000;
let cache = null; // { at: epoch-ms, payload }
let inflight = null; // shared promise while one read is in progress

async function readUpstream(url, key) {
  const auth = { apikey: key, authorization: `Bearer ${key}` };
  const [cats, items, site] = await Promise.all([
    fetch(`${url}/rest/v1/categories?select=id,name,note,is_dietary&order=sort_order`, { headers: auth }),
    fetch(`${url}/rest/v1/items?select=category_id,section,name,description,price,badges,photo_url&is_available=eq.true&order=sort_order`, { headers: auth }),
    fetch(`${url}/rest/v1/site_content?select=key,value`, { headers: auth }),
  ]);
  if (!cats.ok || !items.ok || !site.ok) throw new Error('upstream status');
  const categories = await cats.json();
  const itemsData = await items.json();
  const siteData = await site.json();
  /* An empty categories list is never a legitimate state for a live menu — it
     means an RLS/grant change or an emptied table returned 200 with []. Treat it
     as a failure so we NEVER cache an empty menu (no Cache-Control is set on the
     502 below) and the client falls through to its bundled seed. Without this
     guard an empty-but-200 read would be cached at the edge AND defeat the
     client fallback (empty arrays are truthy), pinning a blank menu for minutes. */
  if (!Array.isArray(categories) || categories.length === 0) throw new Error('empty categories');
  return { categories, items: itemsData, site: siteData };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  try {
    if (!cache || Date.now() - cache.at > TTL_MS) {
      inflight =
        inflight ||
        readUpstream(url, key)
          .then((payload) => {
            cache = { at: Date.now(), payload };
            inflight = null;
            return payload;
          })
          .catch((e) => {
            inflight = null;
            throw e;
          });
      await inflight;
    }
    /* CDN caches for 60s, then serves stale instantly for up to 2 more minutes
       while it revalidates in the background. Browsers don't cache it
       (max-age=0). Worst case for an owner edit to surface publicly is therefore
       s-maxage + stale-while-revalidate = ~3 minutes. */
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(cache.payload);
  } catch (e) {
    /* No Cache-Control on failure — never let the CDN cache an error or empty
       state. The client then falls through to a direct Supabase query and, if
       that also fails, to the bundled seed. */
    return res.status(502).json({ error: 'Upstream read failed' });
  }
}
