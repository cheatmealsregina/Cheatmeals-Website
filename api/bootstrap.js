/* GET /api/bootstrap — the public site's read data (menu + site content) in
   one cached response.

   Why this exists: the browser used to query Supabase directly on every page
   load, so N concurrent visitors meant N x (categories + items + site_content)
   hitting the database, each paying a full round-trip to the Supabase region.
   This endpoint fetches the same rows once and lets Vercel's CDN serve them:
   with s-maxage=60 the database is touched at most ~once a minute no matter how
   many people are on the site, and stale-while-revalidate keeps responses
   instant while a fresh copy is fetched in the background. Reads only, anon key
   — RLS still applies (it only returns what the public anon role may read).

   Uses the SERVER env vars (SUPABASE_URL / SUPABASE_ANON_KEY, already set in
   Vercel for the leaderboard function); the service-role key is never used. */

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
  const auth = { apikey: key, authorization: `Bearer ${key}` };

  try {
    const [cats, items, site] = await Promise.all([
      fetch(`${url}/rest/v1/categories?select=id,name,note,is_dietary&order=sort_order`, { headers: auth }),
      fetch(`${url}/rest/v1/items?select=category_id,section,name,description,price,badges,photo_url&is_available=eq.true&order=sort_order`, { headers: auth }),
      fetch(`${url}/rest/v1/site_content?select=key,value`, { headers: auth }),
    ]);
    if (!cats.ok || !items.ok || !site.ok) {
      return res.status(502).json({ error: 'Upstream read failed' });
    }
    const payload = {
      categories: await cats.json(),
      items: await items.json(),
      site: await site.json(),
    };
    /* CDN caches for 60s, then serves stale instantly for up to 5 min while it
       revalidates in the background. Browsers don't cache it (max-age=0) so an
       owner edit shows within the 60s window on the next CDN refresh. */
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream read failed' });
  }
}
