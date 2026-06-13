# Changelog

## Jokes — "While you wait" (June 13, 2026)

A companion to the game: a `/jokes` page that serves one-liners while an
order is on the grill, plus an owner editor for them. English and Hindi,
both themes, mobile-first.

### Database
- `20260613000000_jokes.sql` — `jokes` table (id, lang, text, category,
  is_active, sort_order, created_at). `lang` is checked against the full
  planned set (`en,hi,gu,pa,ml,kn,te`) though only en/hi are populated;
  `text` is constrained non-blank and ≤500 chars; index on
  `(lang, is_active)`. RLS mirrors the other tables: public reads active
  jokes only, authenticated staff manage all.
- `seed_jokes.sql` seeds the table (sort_order sequential per language),
  generated alongside the bundled fallback from one source
  (`_reference/jokes-source.json` → `_reference/gen-jokes.mjs`).

### Public `/jokes`
- "JOKES on the house" card with the brand treatment, category tag, and a
  rotating "Hit me again" button. Bag-shuffle picks never repeat until the
  active language's pool is exhausted, then reshuffle without a back-to-back
  repeat; the seen-set persists in localStorage (hardened against corrupt
  storage, empty pools, and a language whose jokes all go inactive).
- Language switcher shows only languages with ≥1 active joke, labelled in
  their own script, persists the choice, and hides itself when one language
  is active.
- `loadJokes()` in `data.js` reads active jokes in sort_order; the page
  seeds synchronously from `window.CM_JOKES` (bundled fallback) and overlays
  the live read on mount, so a Supabase blip never shows an empty card. Not
  part of `loadAll()` / the boot race — it can't gate the site shell.

### Devanagari fonts
- Self-hosted Noto Sans Devanagari (variable woff2, weights 400–600,
  `font-display: swap`) under the design-system assets path, exposed via a
  `--font-indic-devanagari` token and a `[data-indic="devanagari"]`
  mapping in `tokens/fonts-indic.css`. Adding the next script is one
  @font-face + one token + one mapping entry (documented in that file and
  in the lang→script tables).
- The face is in a route-scoped stylesheet kept out of the global load and
  injected on mount via `src/lib/indicFonts.js` (shared by the public page
  and the admin jokes tab), so the homepage never downloads it. Only joke
  text in an Indic language gets the face; English and all chrome stay in
  the brand fonts.

### Admin — jokes editor
- A Jokes tab alongside Menu / Site content, mirroring the menu editor:
  language sub-tabs, jokes grouped by language, add (language picker +
  optional category + text), inline text edit, an is_active toggle (red =
  in rotation, retire without deleting), delete behind a confirm modal, and
  pointer-drag reorder writing `sort_order`.
- The Hindi entry field and row list render Devanagari in the Noto face via
  the same `[data-indic]` mapping. Every write re-selects its rows so
  RLS-blocked writes surface as failures (revert + error toast); successes
  show the "Saved" toast.

### Testing
- `TESTING.md` gains Jokes sections (public + admin) and `/jokes` is added
  to the preview walk. New harnesses: `verify-jokes.mjs` (live render both
  themes/viewports, bag-shuffle no-repeat, switcher persistence, Devanagari
  + route-scoped font, homepage font budget unchanged, offline fallback)
  and `verify-jokes-admin.mjs` (mock-auth add/edit/toggle/delete/reorder at
  375px with write-body assertions + real RLS anon block).

## Phase 2 — backend wiring (June 12, 2026)

Took the static prototype implementation and made it a real product:
live data, real auth, an owner-editable menu, and a deployable backend.

### React migration
- Replaced the CDN React + shim setup with npm `react@18.3.1` /
  `react-dom@18.3.1` and the standard `@vitejs/plugin-react` (v4 for
  Vite 5). Deleted `src/lib/` shims and the `resolve.alias` config.
- The design-system bundle (untouched, in `public/_ds/`) needs the
  global React at evaluation time, so `src/main.jsx` assigns
  `window.React` from the npm package and then injects the bundle
  script before importing the app.
- Verified pixel-identical against a screenshot baseline (22/23 shots;
  the one diff is the game's animated arm). Production builds now ship
  production React instead of the CDN development build.

### Supabase foundation
- `@supabase/supabase-js` singleton client (`src/lib/supabase.js`) from
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; `.env.example`
  documents them, `.env*` gitignored. Anon key only — the service-role
  key never appears in client code (enforced by the release checklist's
  dist scan).
- Migrations (run via the dashboard SQL editor):
  - `20260612000000_init.sql` — categories, items, site_content,
    leaderboard; RLS: public reads, authenticated staff writes,
    anonymous leaderboard inserts. Seeded from the design-brief data.
  - `20260612180000_leaderboard_cap.sql` — score check tightened to
    0–9999.
  - `20260612200000_menu_photos_bucket.sql` — public `menu-photos`
    storage bucket, staff-only writes (idempotent).

### Live site data
- `src/lib/data.js`: `loadMenu()` / `loadSiteContent()` /
  `loadLeaderboard()`, reshaped to the exact structure the components
  already consumed, cached in module scope (tab switching never
  refetches). `is_available` filtering happens server-side.
- `main.jsx` swaps `window.CM_DATA` for the live object before the app
  modules evaluate; on failure or a 4s timeout it keeps the bundled
  seed data and warns — the site never renders empty. Boot shows three
  pulsing dots, then the app fades in.
- Menu cards render `photo_url` images with the halftone illustration
  as fallback.

### Patty Stacker leaderboard
- `api/leaderboard.js` (Vercel function): validates initials
  `^[A-Z]{1,3}$` and integer score 0–9999, per-IP rate limit (6/min →
  429), inserts with server-env credentials, returns the fresh top-5.
- Game submits saved scores through the API (direct Supabase insert in
  dev), refreshes the displayed top-5 from the response, and keeps the
  localStorage personal-best behavior. Failures keep the local board.
- `vercel.json` SPA rewrite (excluding `/api/*`).

### Admin
- Real Supabase Auth: working login (brand-voice error on bad
  credentials), session persistence, sign-out, and a route guard — any
  `/admin` URL without a session shows the login. Auth state has no
  effect on the public site.
- Menu editor wired end-to-end (mobile-first): inline edit of
  name/description/price (cleared price = null = "N/A"), badge picker
  writing the jsonb shape, optimistic availability toggle with rollback,
  add item per section, delete behind a confirm modal, pointer-drag
  reorder updating `sort_order`, category note editing, and a Site
  content tab (announcement, about story, hours, team).
- Photo uploads resize client-side to max 1200px WebP, land in the
  `menu-photos` bucket, and save the public URL to `photo_url`.
- Every write re-selects affected rows so RLS-blocked writes surface as
  failures (revert + error toast); successes show the "Saved" toast.

### Testing
- `TESTING.md` release checklist with automated harnesses in
  `_reference/`: full-suite screenshots + interactions (`verify.mjs`,
  `compare.mjs`), auth flows (`verify-auth.mjs`), admin CRUD at 375px
  with request-level assertions and real RLS blocks
  (`verify-admin.mjs`), offline fallback + availability
  (`verify-failures.mjs`), leaderboard API unit tests (`test-api.mjs`),
  and production preview + bundle hygiene (`verify-preview.mjs`).

## Phase 1 — prototype to production site (June 12, 2026)

- Implemented the Claude Design prototype as a Vite + React SPA: Home
  (exploded-burger hero with easter egg), Menu (tabs, search, Chef's
  Picks), About, Team, Visit/Footer, `/game` Patty Stacker, `/admin`
  visual spec. Dual theme (light/dark) with persistence and FOUC
  prevention; design system bundle and brand assets pulled from the
  CheatMeals Claude Design project.
