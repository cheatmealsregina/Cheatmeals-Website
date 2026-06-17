// One-off live-DB migration using the service-role key in .env.local (bypasses
// RLS). (1) renames item sub-sections to their full display names, (2) fixes the
// About story address (87 Hanbidge Crescent -> 4306 Dewdney Avenue) surgically.
// Reads before + after so the change is auditable. Never bundled (no VITE_).
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const env = readFileSync(ROOT + '.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const db = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

const RENAMES = [
  ['DOUBLE', 'Double Patty'],
  ['SPICY ALOO', 'Spicy Aloo'],
  ['ALOO', 'Aloo'],
  ['PANEER', 'Paneer'],
];

async function sectionCounts() {
  const { data, error } = await db.from('items').select('section');
  if (error) throw error;
  const c = {};
  for (const r of data) { const k = r.section || '(none)'; c[k] = (c[k] || 0) + 1; }
  return c;
}

console.log('sections BEFORE:', await sectionCounts());

for (const [oldS, newS] of RENAMES) {
  const { data, error } = await db.from('items').update({ section: newS }).eq('section', oldS).select('id');
  if (error) { console.error(`rename ${oldS} failed:`, error.message); process.exit(1); }
  console.log(`  ${oldS} -> ${newS}: ${data.length} item(s)`);
}

console.log('sections AFTER:', await sectionCounts());

// --- About story address fix (surgical string replace, preserves any edits) ---
{
  const { data, error } = await db.from('site_content').select('value').eq('key', 'about').single();
  if (error) { console.error('read about failed:', error.message); process.exit(1); }
  const about = data.value;
  const copy = (about && about.copy) || '';
  if (copy.includes('87 Hanbidge Crescent')) {
    const next = { ...about, copy: copy.replace(/87 Hanbidge Crescent/g, '4306 Dewdney Avenue') };
    const { error: uErr } = await db.from('site_content').update({ value: next }).eq('key', 'about');
    if (uErr) { console.error('about update failed:', uErr.message); process.exit(1); }
    console.log('about: address updated -> "…4306 Dewdney Avenue."');
  } else if (copy.includes('4306 Dewdney Avenue')) {
    console.log('about: already says 4306 Dewdney Avenue (no change)');
  } else {
    console.log('about: no known address string found — left untouched. Current copy:\n  ' + copy);
  }
}

console.log('done.');
