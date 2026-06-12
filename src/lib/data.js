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
         items' section field in first-appearance order; accent/script come
         from the bundled presentation data when the title matches. */
      const byTitle = new Map();
      for (const i of rows) {
        const title = i.section || '';
        if (!byTitle.has(title)) byTitle.set(title, []);
        byTitle.get(title).push(mapItem(i));
      }
      const bundledSections = bundledMenu.sections || [];
      const sections = [...byTitle.entries()].map(([title, its]) => {
        const b = bundledSections.find((s) => s.title === title) || {};
        return {
          title,
          accent: b.accent || title.split(' ').pop(),
          script: b.script || 'Patty',
          items: its,
        };
      });
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

export function loadMenu() {
  return (menuCache ??= (async () => {
    const [cats, items] = await Promise.all([
      supabase
        .from('categories')
        .select('id,name,note,is_dietary')
        .order('sort_order'),
      supabase
        .from('items')
        .select('category_id,section,name,description,price,badges,photo_url')
        .eq('is_available', true)
        .order('sort_order'),
    ]);
    if (cats.error) throw cats.error;
    if (items.error) throw items.error;
    return reshapeMenu(cats.data, items.data);
  })().catch((e) => {
    menuCache = null;
    throw e;
  }));
}

export function loadSiteContent() {
  return (siteCache ??= (async () => {
    const { data, error } = await supabase.from('site_content').select('key,value');
    if (error) throw error;
    const kv = Object.fromEntries(data.map((r) => [r.key, r.value]));
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
    if (kv.about) out.about = kv.about;
    if (kv.hours) out.hours = kv.hours;
    if (kv.team) out.team = kv.team;
    return out;
  })().catch((e) => {
    siteCache = null;
    throw e;
  }));
}

export function loadLeaderboard() {
  return (boardCache ??= (async () => {
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
