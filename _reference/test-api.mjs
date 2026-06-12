// Unit tests for api/leaderboard.js — imports the handler directly with
// mock req/res (the same shape Vercel's node runtime provides).
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// server env from .env.local (Vercel will have these set in project settings)
const env = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);
process.env.SUPABASE_URL = env.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

const { default: handler } = await import('../api/leaderboard.js');

function call({ method = 'POST', body, ip = '203.0.113.1' }) {
  return new Promise((resolve) => {
    const req = { method, body, headers: { 'x-forwarded-for': ip }, socket: { remoteAddress: ip } };
    const res = {
      _status: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this._status = c; return this; },
      json(payload) { resolve({ status: this._status, payload }); },
    };
    handler(req, res);
  });
}

const results = [];
const fail = [];

// 1. valid submission (unique IP) -> 201 + top5
{
  const r = await call({ body: { initials: 'ZZZ', score: 1 }, ip: '203.0.113.10' });
  results.push(`valid ZZZ/1 -> ${r.status} top5=${JSON.stringify(r.payload.top5)}`);
  if (r.status !== 201 || !Array.isArray(r.payload.top5)) fail.push('valid submit did not return 201+top5');
}

// 2. score 999999 -> 400
{
  const r = await call({ body: { initials: 'ZZZ', score: 999999 }, ip: '203.0.113.11' });
  results.push(`score 999999 -> ${r.status} (${r.payload.error})`);
  if (r.status !== 400) fail.push('oversized score not rejected with 400');
}

// 3. bogus payloads -> 400
for (const [label, body] of [
  ['lowercase initials', { initials: 'abc', score: 10 }],
  ['4 letters', { initials: 'ABCD', score: 10 }],
  ['float score', { initials: 'AB', score: 10.5 }],
  ['negative score', { initials: 'AB', score: -5 }],
  ['string score', { initials: 'AB', score: '100' }],
  ['no body', undefined],
]) {
  const r = await call({ body, ip: '203.0.113.12' });
  results.push(`${label} -> ${r.status}`);
  if (r.status !== 400) fail.push(`${label}: expected 400, got ${r.status}`);
}

// 4. GET -> 405
{
  const r = await call({ method: 'GET', ip: '203.0.113.13' });
  results.push(`GET -> ${r.status}`);
  if (r.status !== 405) fail.push('GET not rejected with 405');
}

// 5. rate limit: 10 rapid calls from one IP (invalid bodies — no inserts);
//    expect 6 processed (400) then 429s
{
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const r = await call({ body: { initials: 'ZZ', score: 999999 }, ip: '203.0.113.99' });
    codes.push(r.status);
  }
  results.push(`10 rapid -> [${codes.join(',')}]`);
  if (JSON.stringify(codes) !== JSON.stringify([400, 400, 400, 400, 400, 400, 429, 429, 429, 429]))
    fail.push('rate limiting pattern wrong: ' + codes.join(','));
}

// 6. confirm the valid row actually landed in the table
{
  const r = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/leaderboard?select=initials,score&initials=eq.ZZZ&order=created_at.desc&limit=1`,
    { headers: { apikey: process.env.SUPABASE_ANON_KEY, authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` } }
  );
  const rows = await r.json();
  results.push(`table check -> ${JSON.stringify(rows)}`);
  if (!rows.length || rows[0].score !== 1) fail.push('inserted row not found in table');
}

console.log('--- RESULTS ---');
results.forEach((l) => console.log('  ' + l));
console.log('--- FAILURES ---');
console.log(fail.length ? fail.join('\n') : '(none)');
process.exit(fail.length ? 1 : 0);
