// Regenerates supabase/seed.sql from menu-data.mjs so the repo's canonical
// seed matches what apply-menu.mjs pushed to the live DB. Idempotent SQL
// (ON CONFLICT upserts + placeholder deletes); safe to re-run on a populated
// DB or a fresh `supabase db reset`.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { CATEGORIES, REMOVE, MENU } from './menu-data.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const q = (s) => (s === null || s === undefined ? 'null' : "'" + String(s).replace(/'/g, "''") + "'");
const num = (n) => (n === null || n === undefined ? 'null' : Number(n).toFixed(2));
const jb = (b) => "'" + JSON.stringify(b || []).replace(/'/g, "''") + "'";

let out = `-- CheatMeals — seed data (full menu)
-- Generated from _reference/_menu-data.mjs (transcribed from the 7th June 2026
-- menu PDF). Idempotent: ON CONFLICT upserts + placeholder deletes, so this is
-- safe to run against the live DB or a fresh \`supabase db reset\`.
-- Run _reference/_gen-seed.mjs to regenerate after editing the menu data.

-- ============================================================
-- categories
-- ============================================================
insert into public.categories (name, slug, sort_order, note, is_dietary) values
`;
out += CATEGORIES.map((c) => `  (${q(c.name)}, ${q(c.slug)}, ${c.sort}, ${q(c.note)}, ${c.dietary})`).join(',\n');
out += `
on conflict (slug) do update set
  name = excluded.name, sort_order = excluded.sort_order,
  note = excluded.note, is_dietary = excluded.is_dietary;

`;

for (const [slug, items] of Object.entries(MENU)) {
  out += `-- ============================================================\n-- items — ${slug}\n-- ============================================================\n`;
  out += `insert into public.items (category_id, section, name, description, price, badges, sort_order)\n`;
  out += `select c.id, v.section, v.name, v.description, v.price, v.badges::jsonb, v.sort_order\n`;
  out += `from public.categories c\njoin (values\n`;
  out += items
    .map((it, i) => `  (${q(it.section ?? null)}, ${q(it.name)}, ${q(it.description ?? null)}, ${num(it.price)}, ${jb(it.badges)}, ${i + 1})`)
    .join(',\n');
  out += `\n) as v(section, name, description, price, badges, sort_order) on true\nwhere c.slug = ${q(slug)}\n`;
  out += `on conflict (category_id, name) do update set\n  section = excluded.section, description = excluded.description,\n  price = excluded.price, badges = excluded.badges,\n  sort_order = excluded.sort_order, is_available = true;\n\n`;
}

out += `-- ============================================================\n-- remove placeholder items not on the printed menu\n-- ============================================================\n`;
for (const r of REMOVE) {
  out += `delete from public.items where category_id = (select id from public.categories where slug = ${q(r.slug)})\n  and name in (${r.names.map(q).join(', ')});\n`;
}

out += `
-- ============================================================
-- site_content — editable copy (unchanged from launch)
-- ============================================================
insert into public.site_content (key, value) values
  ('announcement', '"Now slinging in Regina — 4306 Dewdney Avenue"'),
  ('phone',        '"(306) 541-9198"'),
  ('tel',          '"tel:+13065419198"'),
  ('address',      '"4306 Dewdney Avenue"'),
  ('city',         '"Regina, SK"'),
  ('instagram',    '{"handle": "@cheatmeals_yqr", "url": "https://instagram.com/cheatmeals_yqr"}'),
  ('about', '{
    "headline": ["OUR", "STORY"],
    "copy": "CheatMeals started with one belief: Regina deserved the burgers we grew up craving. Hand-smashed aloo tikkis, real paneer, sauces we won''t explain — now at 4306 Dewdney Avenue."
  }'),
  ('hours', '[
    {"day": "Monday",    "time": "11:00 AM – 9:00 PM"},
    {"day": "Tuesday",   "time": "11:00 AM – 9:00 PM"},
    {"day": "Wednesday", "time": "11:00 AM – 9:00 PM"},
    {"day": "Thursday",  "time": "11:00 AM – 9:00 PM"},
    {"day": "Friday",    "time": "11:00 AM – 9:00 PM"},
    {"day": "Saturday",  "time": "11:00 AM – 9:00 PM"},
    {"day": "Sunday",    "time": "11:00 AM – 9:00 PM"}
  ]'),
  ('team', '[
    {"name": "The Founder",       "bio": "Started this because Regina needed it."},
    {"name": "Head of Patties",   "bio": "Hand-smashes every tikki."},
    {"name": "Sauce Department",  "bio": "Knows the Malai Makhni secret. Won''t tell."}
  ]')
on conflict (key) do update set value = excluded.value;
`;

writeFileSync(ROOT + 'supabase/seed.sql', out);
console.log('supabase/seed.sql regenerated:', out.length, 'bytes');
