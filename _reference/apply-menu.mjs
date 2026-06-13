// Applies the full menu (from menu-data.mjs) to the live Supabase DB using
// the service-role key in .env.local (bypasses RLS). Idempotent: upserts on
// (category_id, name), removes the non-PDF placeholder items, re-reads to
// verify. Never bundled — service key has no VITE_ prefix and .env.local is
// gitignored.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { CATEGORIES, REMOVE, MENU } from './menu-data.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const env = readFileSync(ROOT + '.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const URL_ = get('VITE_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');
if (!URL_ || !KEY) { console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }

const db = createClient(URL_, KEY, { auth: { persistSession: false } });

// 1) upsert categories
{
  const rows = CATEGORIES.map((c) => ({ name: c.name, slug: c.slug, sort_order: c.sort, note: c.note, is_dietary: c.dietary }));
  const { error } = await db.from('categories').upsert(rows, { onConflict: 'slug' });
  if (error) { console.error('categories upsert failed:', error); process.exit(1); }
  console.log(`categories: upserted ${rows.length}`);
}

// map slug -> id
const { data: cats, error: catErr } = await db.from('categories').select('id,slug');
if (catErr) { console.error(catErr); process.exit(1); }
const idBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

// 2) upsert items (omit photo_url so existing uploaded photos survive)
let total = 0;
for (const [slug, items] of Object.entries(MENU)) {
  const category_id = idBySlug[slug];
  if (!category_id) { console.error('unknown slug', slug); process.exit(1); }
  const rows = items.map((it, i) => ({
    category_id,
    section: it.section ?? null,
    name: it.name,
    description: it.description ?? null,
    price: it.price === null || it.price === undefined ? null : it.price,
    badges: it.badges || [],
    sort_order: i + 1,
    is_available: true,
  }));
  const { error } = await db.from('items').upsert(rows, { onConflict: 'category_id,name' });
  if (error) { console.error(`items upsert failed for ${slug}:`, error); process.exit(1); }
  total += rows.length;
  console.log(`  ${slug}: upserted ${rows.length}`);
}
console.log(`items: upserted ${total} across ${Object.keys(MENU).length} categories`);

// 3) remove placeholders not on the printed menu
for (const r of REMOVE) {
  const category_id = idBySlug[r.slug];
  const { error, count } = await db.from('items').delete({ count: 'exact' }).eq('category_id', category_id).in('name', r.names);
  if (error) { console.error(`delete failed for ${r.slug}:`, error); process.exit(1); }
  console.log(`  ${r.slug}: removed ${count ?? '?'} placeholder(s)`);
}

// 4) verify
const { data: vCats } = await db.from('categories').select('id,slug,sort_order').order('sort_order');
const { data: vItems } = await db.from('items').select('category_id,name,price,is_available');
console.log('\n--- VERIFY (live DB) ---');
let vt = 0;
for (const c of vCats) {
  const n = vItems.filter((i) => i.category_id === c.id).length;
  vt += n;
  console.log(`  ${c.slug}: ${n}`);
}
console.log(`  TOTAL items: ${vt}`);
const avail = vItems.filter((i) => i.is_available).length;
console.log(`  available: ${avail}/${vItems.length}`);
