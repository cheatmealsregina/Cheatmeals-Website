/* POST /api/leaderboard — Patty Stacker score submission.
   Validates and rate-limits before inserting via the Supabase REST API
   with the anon key from SERVER env vars (SUPABASE_URL,
   SUPABASE_ANON_KEY — set these in Vercel project settings; never the
   service-role key). Returns the refreshed top-5 so the client can
   update its board in one round trip.

   Rate limiting is in-memory per warm function instance: good enough to
   blunt casual spam, not a hard guarantee (instances scale out and
   reset on cold start). The database's own constraints (score 0-9999,
   initials format) are the real backstop. */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map(); // ip -> [timestamps]

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // keep the map from growing unbounded on long-lived instances
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

export default async function handler(req, res) {
  /* GET — return the cached top-5 so the game board read is served from the
     CDN instead of every player hitting Supabase directly. */
  if (req.method === 'GET') {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return res.status(500).json({ error: 'Server is not configured' });
    const auth = { apikey: key, authorization: `Bearer ${key}` };
    try {
      const top = await fetch(
        `${url}/rest/v1/leaderboard?select=initials,score&order=score.desc,created_at.asc&limit=5`,
        { headers: auth }
      );
      if (!top.ok) return res.status(502).json({ error: 'Could not read the board' });
      const top5 = (await top.json()).map((r) => ({ ini: r.initials.trim(), score: r.score }));
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
      return res.status(200).json({ top5 });
    } catch (e) {
      return res.status(502).json({ error: 'Could not read the board' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip =
    (String(req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many submissions — take a breath between stacks.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Expected a JSON body { initials, score }' });
  }

  const { initials, score } = body;
  if (typeof initials !== 'string' || !/^[A-Z]{1,3}$/.test(initials)) {
    return res.status(400).json({ error: 'initials must be 1-3 uppercase letters' });
  }
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 9999) {
    return res.status(400).json({ error: 'score must be an integer between 0 and 9999' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured' });
  }
  const auth = { apikey: key, authorization: `Bearer ${key}` };

  /* Upsert via the SECURITY DEFINER submit_score() function: one row per
     initials, keeping the highest score. This is the only write path that can
     UPDATE (anon's RLS policy is INSERT-only), so the "no duplicates, keep best"
     rule can't be bypassed from the client. The function re-validates too. */
  const upsert = await fetch(`${url}/rest/v1/rpc/submit_score`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ p_initials: initials, p_score: score }),
  });
  if (!upsert.ok) {
    return res.status(502).json({ error: 'Could not save the score' });
  }

  /* Read back the fresh top-5 to hand to the client in the same round trip. The
     upsert already succeeded, so retry the read once on a transient failure
     rather than returning { top5: null } and making the client refetch. */
  let top5 = null;
  for (let attempt = 0; attempt < 2 && top5 === null; attempt++) {
    const top = await fetch(
      `${url}/rest/v1/leaderboard?select=initials,score&order=score.desc,created_at.asc&limit=5`,
      { headers: auth }
    );
    if (top.ok) top5 = (await top.json()).map((r) => ({ ini: r.initials.trim(), score: r.score }));
  }

  return res.status(201).json({ ok: true, top5 });
}
