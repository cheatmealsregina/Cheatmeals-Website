import { supabase } from './supabase.js';

/* Live data loaders — each returns data reshaped into the exact
   structure components already consume from window.CM_DATA, so the
   rendering layer needs no changes. Results are cached in module
   scope: switching menu tabs never refetches. On failure the cache
   resets so a later call could retry; main.jsx falls back to the
   bundled public/scripts/data.js data. */

const bundled = window.CM_DATA || {};

let menuCache = null;
let siteCache = null;
let boardCache = null;
let jokesCache = null;

function mapItem(row) {
  return {
    name: row.name,
    description: row.description || undefined,
    /* numeric comes back as a string from PostgREST; null price renders "N/A" */
    price: row.price === null ? 'N/A' : Number(row.price),
    badges: row.badges || [],
    image: row.photo_url || undefined,
  };
}

function reshapeMenu(cats, items) {
  const categories = cats.map((c) => c.name);
  const menus = {};
  const asides = {};

  for (const c of cats) {
    const rows = items.filter((i) => i.category_id === c.id);
    if (!rows.length) {
      /* unpopulated category — its note is the voice-line aside */
      if (c.note) asides[c.name] = c.note;
      continue;
    }
    const bundledMenu = (bundled.menus && bundled.menus[c.name]) || {};

    if (rows.some((i) => i.section)) {
      /* sectioned category (e.g. Aloo Burgers) — sections derive from the
         items' section field in first-appearance order. The section name is the
         full sub-header text (e.g. "Double Patty"); its first word renders in
         the brand red (CSS uppercases the title). No hardcoded suffix or script
         lead-in, so the owner can name sub-sections anything from the admin. */
      const byTitle = new Map();
      for (const i of rows) {
        /* trim so stray whitespace from any data source can't split a group or
           blank the first-word accent */
        const title = (i.section || '').trim();
        if (!byTitle.has(title)) byTitle.set(title, []);
        byTitle.get(title).push(mapItem(i));
      }
      const sections = [...byTitle.entries()].map(([title, its]) => ({
        title,
        accent: title.split(' ')[0],
        items: its,
      }));
      menus[c.name] = { note: c.note || undefined, sections };
    } else if (c.is_dietary) {
      /* dietary tab — note is the tagline ("No root vegetables…") */
      menus[c.name] = {
        tagline: c.note || undefined,
        kicker: bundledMenu.kicker || 'A separate curated menu',
        items: rows.map(mapItem),
      };
    } else {
      menus[c.name] = { note: c.note || undefined, items: rows.map(mapItem) };
    }
  }

  return { categories, menus, asides };
}

/* In production the public reads come through the CDN-cached /api/bootstrap
   endpoint, so Supabase is touched ~once a minute no matter how many people are
   on the site. A single in-flight request is shared by loadMenu +
   loadSiteContent. On any failure we fall through to querying Supabase directly,
   and the caller still falls back to the bundled seed — three layers, so a cold
   cache or a missing endpoint can never blank the site. Dev (vite, no /api)
   always uses the direct path. */
let bootstrapPromise = null;
function fetchBootstrap() {
  return (bootstrapPromise ??= fetch('/api/bootstrap', { headers: { accept: 'application/json' } })
    .then((r) => {
      if (!r.ok) throw new Error('bootstrap ' + r.status);
      return r.json();
    })
    .catch((e) => {
      bootstrapPromise = null; // allow a later retry
      throw e;
    }));
}

export function loadMenu() {
  return (menuCache ??= (async () => {
    let catsData, itemsData;
    if (import.meta.env.PROD) {
      try {
        const b = await fetchBootstrap();
        catsData = b.categories;
        itemsData = b.items;
      } catch (e) { /* fall through to a direct query */ }
    }
    if (!catsData || !catsData.length || !itemsData) {
      const [cats, items] = await Promise.all([
        supabase
          .from('categories')
          .select('id,name,note,is_dietary')
          .order('sort_order')
          .order('id'),
        supabase
          .from('items')
          .select('category_id,section,name,description,price,badges,photo_url')
          .eq('is_available', true)
          .order('sort_order')
          .order('id'),
      ]);
      if (cats.error) throw cats.error;
      if (items.error) throw items.error;
      catsData = cats.data;
      itemsData = items.data;
    }
    /* An empty category list is never legitimate for a live menu — it means the
       read silently returned nothing (an RLS/grant change or an emptied table
       returning 200 with []). Throw so loadAll() rejects and main.jsx keeps the
       bundled seed, rather than overwriting a good menu with an empty one. */
    if (!catsData || !catsData.length) throw new Error('no menu categories returned');
    return reshapeMenu(catsData, itemsData);
  })().catch((e) => {
    menuCache = null;
    throw e;
  }));
}

export function loadSiteContent() {
  return (siteCache ??= (async () => {
    let rows;
    if (import.meta.env.PROD) {
      try { rows = (await fetchBootstrap()).site; } catch (e) { /* fall through */ }
    }
    if (!rows) {
      const { data, error } = await supabase.from('site_content').select('key,value');
      if (error) throw error;
      rows = data;
    }
    const kv = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const out = {};
    if (kv.announcement) out.announcement = kv.announcement;
    if (kv.phone) out.phone = kv.phone;
    if (kv.tel) out.tel = kv.tel;
    if (kv.address) out.address = kv.address;
    if (kv.city) out.city = kv.city;
    if (kv.instagram) {
      out.instagram = kv.instagram.handle;
      out.instagramUrl = kv.instagram.url;
    }
    /* Type-guard so a malformed live value can't override the safe bundled
       default and crash a screen (TeamScreen/HoursTable map over these). */
    if (kv.about && typeof kv.about === 'object' && !Array.isArray(kv.about)) out.about = kv.about;
    if (Array.isArray(kv.hours)) out.hours = kv.hours;
    if (Array.isArray(kv.team)) out.team = kv.team;
    return out;
  })().catch((e) => {
    siteCache = null;
    throw e;
  }));
}

export function loadLeaderboard() {
  return (boardCache ??= (async () => {
    /* prod: CDN-cached GET /api/leaderboard so every player doesn't hit the DB */
    if (import.meta.env.PROD) {
      try {
        const r = await fetch('/api/leaderboard', { headers: { accept: 'application/json' } });
        if (r.ok) {
          const { top5 } = await r.json();
          if (Array.isArray(top5)) return top5.map((e) => ({ ini: String(e.ini).trim(), score: e.score }));
        }
      } catch (e) { /* fall through to a direct query */ }
    }
    const { data, error } = await supabase
      .from('leaderboard')
      .select('initials,score')
      .order('score', { ascending: false })
      .order('created_at')
      .limit(5);
    if (error) throw error;
    return data.map((r) => ({ ini: r.initials.trim(), score: r.score }));
  })().catch((e) => {
    boardCache = null;
    throw e;
  }));
}

/* "While you wait" jokes for the /jokes page. Page-specific on purpose:
   NOT part of loadAll()/the boot race, so it can never gate the site shell.
   Returns active jokes ({ lang, text, category }) in sort_order; the page
   seeds synchronously from window.CM_JOKES and overlays this on mount, so a
   fetch failure silently leaves the bundled jokes in place. All languages are
   returned (the page renders en + hi); the brand fonts handle Latin and a
   route-scoped Noto face handles Devanagari (see tokens/fonts-indic.css). */
export function loadJokes() {
  return (jokesCache ??= (async () => {
    const { data, error } = await supabase
      .from('jokes')
      .select('lang,text,category')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data.map((r) => ({ lang: r.lang, text: r.text, category: r.category || undefined }));
  })().catch((e) => {
    jokesCache = null;
    throw e;
  }));
}

/* Loads everything the site shell needs and merges it over the bundled
   data (bundled fields without a DB counterpart — e.g. `today` — survive). */
export async function loadAll() {
  const [menu, site] = await Promise.all([loadMenu(), loadSiteContent()]);
  return {
    ...bundled,
    ...site,
    categories: menu.categories,
    menus: menu.menus,
    asides: { ...bundled.asides, ...menu.asides },
  };
}
