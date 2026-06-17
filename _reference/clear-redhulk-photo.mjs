// One-off live-DB fix using the service-role key in .env.local (bypasses RLS).
// "The Red Hulk" (the only item with a photo) had a screenshot — including the
// phone status bar + the empty-card placeholder — uploaded as its product photo.
// Null its photo_url so the card falls back to the clean halftone placeholder
// every other item uses. Reversible: re-upload anytime from the admin editor.
// The orphaned storage object is left in place (harmless). Never bundled.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const env = readFileSync(ROOT + '.env.local', 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const db = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

const NAME = 'The Red Hulk';

const before = await db.from('items').select('id,name,photo_url').eq('name', NAME);
if (before.error) { console.error('read failed:', before.error.message); process.exit(1); }
console.log('BEFORE:', before.data.map((r) => `${r.name} (id ${r.id}) photo=${r.photo_url ? r.photo_url.slice(-40) : null}`).join(' | ') || '(no match)');

const upd = await db.from('items').update({ photo_url: null }).eq('name', NAME).select('id');
if (upd.error) { console.error('update failed:', upd.error.message); process.exit(1); }
console.log(`cleared photo_url on ${upd.data.length} item(s)`);

const after = await db.from('items').select('name,photo_url').eq('name', NAME);
console.log('AFTER:', after.data.map((r) => `${r.name} photo=${r.photo_url}`).join(' | '));

// Sanity: confirm no item anywhere still carries a photo_url
const remaining = await db.from('items').select('name').not('photo_url', 'is', null);
console.log('items still carrying a photo_url:', remaining.data.length, remaining.data.map((r) => r.name).join(', ') || '(none)');
console.log('done.');
