// CheatMeals — joke generator.
// Single source of truth: _reference/jokes-source.json (the jokes JSON).
// Emits BOTH outputs so they can never drift:
//   - supabase/seed_jokes.sql        (DB seed, real UTF-8)
//   - public/scripts/jokes-data.js   (window.CM_JOKES fallback, ASCII-escaped)
// sort_order is 0-based per language, following source order.
// Run:  node _reference/gen-jokes.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(fs.readFileSync(path.join(root, '_reference', 'jokes-source.json'), 'utf8'));

// Normalise + assign per-language sort_order in source order.
const counters = {};
const rows = src.map((j) => {
  const lang = j.lang;
  const sort_order = counters[lang] ?? 0;
  counters[lang] = sort_order + 1;
  return { lang, category: j.category ?? null, text: j.text, sort_order };
});

// ---- supabase/seed_jokes.sql ----
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const values = rows
  .map((r) => `  (${sqlStr(r.lang)}, ${r.category == null ? 'null' : sqlStr(r.category)}, ${sqlStr(r.text)}, ${r.sort_order})`)
  .join(',\n');

const sql = `-- CheatMeals — jokes seed ("while you wait" one-liners).
-- Generated from _reference/jokes-source.json by _reference/gen-jokes.mjs
-- (run that to regenerate after editing the source). Do not edit by hand.
-- Idempotent: clears the table then re-inserts the full set, so re-running
-- (or \`supabase db reset\`) always yields exactly the source rows.
-- sort_order is 0-based per language, following source order.
begin;

delete from public.jokes;

insert into public.jokes (lang, category, text, sort_order) values
${values};

commit;
`;
fs.writeFileSync(path.join(root, 'supabase', 'seed_jokes.sql'), sql);

// ---- public/scripts/jokes-data.js ----
// Mirror the source shape exactly (array order == sort_order). ASCII-escape
// non-ASCII text so the bundled file is charset-proof however it's served.
const fallback = rows.map((r) => ({ lang: r.lang, category: r.category, text: r.text }));
const asciiJson = JSON.stringify(fallback, null, 2).replace(
  /[^\x00-\x7F]/g,
  (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')
);
const js = `// CheatMeals — bundled joke fallback. Mirrors supabase/seed_jokes.sql so the
// "while you wait" jokes still render if Supabase is briefly unreachable
// (same philosophy as CM_DATA / the menu fallback). Generated from
// _reference/jokes-source.json by _reference/gen-jokes.mjs — do not edit by hand.
window.CM_JOKES = ${asciiJson};
`;
fs.writeFileSync(path.join(root, 'public', 'scripts', 'jokes-data.js'), js);

// ---- summary ----
const per = {};
for (const r of rows) per[r.lang] = (per[r.lang] || 0) + 1;
console.log('jokes:', rows.length, 'per-lang:', JSON.stringify(per));
console.log('wrote supabase/seed_jokes.sql and public/scripts/jokes-data.js');
