// Run a .sql migration against the live project via the Supabase Management API
// (the only path that executes DDL — the service-role key over PostgREST cannot).
// The access token is read from the SUPABASE_ACCESS_TOKEN env var ONLY, never a
// file, so no secret is committed. Project ref comes from .env.local's URL.
//   SUPABASE_ACCESS_TOKEN=sbp_... node _reference/run-migration.mjs <path.sql>
//   echo "select 1" | SUPABASE_ACCESS_TOKEN=sbp_... node _reference/run-migration.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const env = readFileSync(ROOT + '.env.local', 'utf8');
const ref = (env.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref) { console.error('Could not find project ref in .env.local'); process.exit(1); }
if (!token) { console.error('Set SUPABASE_ACCESS_TOKEN (not stored in any file)'); process.exit(1); }

const arg = process.argv[2];
const sql = arg ? readFileSync(ROOT + arg, 'utf8') : readFileSync(0, 'utf8');

const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
const text = await r.text();
console.log('HTTP', r.status);
console.log(text.slice(0, 3000));
process.exit(r.ok ? 0 : 1);
