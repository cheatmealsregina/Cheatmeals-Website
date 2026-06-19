# Changelog

## Build-time sitemap, route source-of-truth & structured-data finish (June 18, 2026)

A follow-up SEO pass that makes the crawl config self-maintaining and completes
the Restaurant structured data. Verified end-to-end by an adversarial multi-agent
audit (robots/sitemap/noindex/canonical) plus the prerender + hydration harness.

- **Sitemap is now generated at build time** — `_reference/gen-sitemap.mjs` runs
  between `vite build` and the prerender (`vite build && node …/gen-sitemap.mjs &&
  node …/prerender.mjs`) and writes `dist/sitemap.xml` from the canonical route
  list with absolute `https://cheatmealshoib.com` URLs and a fresh `<lastmod>`
  (the build date), so it can never go stale. `public/sitemap.xml` stays as a
  static fallback (served only if generation is skipped; the step is non-fatal).
- **Single source of truth for public routes** — `_reference/routes.mjs`
  (`PUBLIC_ROUTES`) is consumed by BOTH the prerenderer and the sitemap
  generator, so "what routes exist" is defined once and the two can't drift.
  `/admin` is deliberately absent, so it can never be prerendered, listed in the
  sitemap, or indexed.
- **Canonical host reaffirmed** as `https://cheatmealshoib.com` (https, apex
  non-www, no trailing slash except the bare homepage) across `routes.mjs`,
  `routeHead.js`, `index.html`, the sitemap, and the robots `Sitemap:` line —
  audited consistent, with each prerendered route self-canonicalising to a
  distinct URL.
- **`README.md`** added, documenting how to regenerate the sitemap when routes
  change (edit `routes.mjs`, then `npm run build` — no hand-edited XML).
- **Restaurant JSON-LD completed:** added `geo` coordinates (50.455278,
  −104.642571 for 4306 Dewdney Ave), the owner-verified `postalCode` **S4T 1A8**,
  set `priceRange` to `$`, and added `Street Food` to `servesCuisine`
  (`["Indian","Burgers","Street Food"]`).
- `public/robots.txt` was already correct (`Allow: /`, `Disallow: /admin`,
  `Sitemap:` pointer) and is unchanged.

## Per-route titles, descriptions, canonicals & social cards (June 17, 2026)

Each indexable route now has its own descriptive metadata, baked into the
prerendered HTML (not just set client-side) — `src/lib/routeHead.js` is the
single source of truth, applied during the prerender snapshot.

- **Distinct `<title>` / description / self-canonical per route** (home, /game,
  /jokes — Menu/About/Team/Visit are sections of home, so they share its
  metadata, which already carries their content + keywords):
  - Home — "CheatMeals — Home of Indian Burgers | Regina"
  - /game — "Patty Stacker — Burger Stacking Game | CheatMeals Regina"
  - /jokes — "Jokes On The House | CheatMeals — Indian Burgers, Regina"
  No two routes share a canonical; each title naturally carries the brand, the
  food, and Regina where it fits.
- **Complete OpenGraph + Twitter cards on every route** — per-route
  title/description/url plus the shared `og:image` (`/assets/og-image.png`,
  1200×630), `og:type`, `og:site_name`, and `twitter:card=summary_large_image`.
  `index.html` ships the matching home defaults as the no-JS baseline.
- **Homepage `<h1>` now real text including the brand** — a visible "CheatMeals"
  eyebrow above "HOME OF INDIAN BURGERS", so the H1 reads
  "CheatMeals — Home of Indian Burgers" in the HTML. The body already carries
  the searched terms ("Indian burgers", "Regina", "Dewdney").
- **Restaurant (LocalBusiness) JSON-LD on the home page**, built from the live
  data so it always matches the visible NAP + hours: `@type` Restaurant, address
  (4306 Dewdney Avenue, Regina, SK, CA), telephone, `openingHoursSpecification`
  (Mon–Sun 11:00–21:00), `servesCuisine` (Indian, Burgers), `priceRange`,
  `hasMenu`, and `sameAs` the Instagram. (`geo`, exact `postalCode`, the `$`
  price band and the "Street Food" cuisine were completed in the June 18 pass.)
- **Refinements from an adversarial SEO audit:** removed forced "Regina" from
  the /game leaderboard copy (geo-forcing); gave /jokes a real `<h1>` (it was
  shipping only an `<h2>`); lightened the /jokes title to drop the off-topic
  "Indian Burgers"; reworked the home description to add "paneer" + an "Indian
  street food" category signal and drop the in-snippet street address; and
  completed the social set with `og:image:alt`, `twitter:image:alt`, and
  `og:locale=en_CA`.

## Build-time prerendering — crawlable HTML (June 17, 2026)

The site was a client-rendered SPA: `curl` (and a JS-less crawler) saw an empty
`<div id="root">`. Each public route now ships fully-rendered static HTML with
the real brand/menu/address text, then hydrates into the same SPA on load.

- **`_reference/prerender.mjs`** runs after `vite build` (the `build` script is
  now `vite build && node _reference/prerender.mjs`). It serves the freshly
  built `dist` over a tiny static server, drives a headless browser to each
  public route at a **mobile viewport** with live data blocked (so the snapshot
  renders from the bundled seed — content-rich, never coupled to Supabase), and
  writes the serialized DOM back: `/` → `dist/index.html`, `/game` →
  `dist/game/index.html`, `/jokes` → `dist/jokes/index.html`. Menu/About/Team/
  Visit are sections of `/`, so the home HTML already contains all of them.
  `/admin` is deliberately not prerendered. The browser is local Edge in dev and
  `@sparticuz/chromium` on Linux/Vercel; the step is **non-fatal** — if no
  browser is available it logs and the build still succeeds (degrading to the
  former client-only SPA) so a deploy can never break on it.
- **Hydration** (`src/main.jsx`): the prerender stamps
  `<html data-prerendered="site|game|jokes">`; boot `hydrateRoot`s when that
  matches the route and `#root` has content, else `createRoot`s (admin, dev,
  un-prerendered paths, or a failed prerender). It renders from the seed first
  so the first client paint matches the static HTML, then merges live data onto
  the same `window.CM_DATA` object every screen holds and bumps a small store
  (`src/lib/liveData.js`) to re-render — no per-component data plumbing.
- **Routing** (`src/App.jsx`): dropped `React.lazy` for the route screens (a
  lazy chunk would suspend on hydration and flash a fallback over the
  prerendered content). `main.jsx` preloads the matched route's chunk via
  dynamic import and passes the resolved component in — code-splitting intact,
  component present synchronously at hydrate.
- **Clean hydration across themes & viewports**, fixed at the source so there
  are zero hydration mismatches on first paint:
  - `useTheme` renders `light` first (the prerender theme) and corrects to the
    real theme on mount — no flash, since `[data-theme]` CSS already painted the
    right colours before React.
  - `useIsMobile` renders mobile first (the prerender viewport) and corrects on
    mount; desktop reflows to its layout via a normal post-mount render, not a
    hydration error.
  - `JokesScreen`'s first joke is now deterministic (first joke of the default
    language, no `Math.random`/localStorage on the first render); the saved
    language + bag-shuffle history are restored just after mount.
- Verified by `_reference/verify-prerender.mjs`: raw HTML of every route carries
  real content + the correct per-route canonical; all routes hydrate with **no
  React hydration errors** at 375px in light and dark; `/admin` is excluded and
  resolves `noindex`.

## SEO & crawlability (June 17, 2026)

- **`public/robots.txt`** — crawling open, `Disallow: /admin`, and a
  `Sitemap:` pointer. (Previously absent: nothing was blocked, but there was no
  sitemap reference.)
- **`public/sitemap.xml`** — the three real indexable URLs only (`/`, `/game`,
  `/jokes`) with absolute `https://cheatmealshoib.com` locs. Menu/About/Team/Visit
  are anchor sections on `/` (`/#menu`, …), not separate URLs, so they are
  intentionally not listed (a `/menu` path would 200 with a duplicate of home).
- **Per-route `<head>` (`src/lib/routeHead.js`, wired in `App.jsx`)** — index.html
  ships home-only metadata, so this gives `/game` and `/jokes` their own title,
  description and **self-referencing canonical** (they previously canonicalised to
  `/`, i.e. declared themselves duplicates of home), and marks `/admin`
  `noindex, nofollow`. Updates the matching OG/Twitter tags too. Verified headless
  via `_reference/verify-seo.mjs`.

## Game polish, leaderboard fairness & a performance pass (June 16, 2026)

### Performance
- **Route code-splitting** — `/game`, `/jokes`, and `/admin` now load as their
  own lazy chunks (`React.lazy` + `Suspense`). The home page ships none of that
  code.
- **`@supabase/supabase-js` (~211 KB) is imported lazily** — the production
  happy path (public reads via the CDN `/api/*` endpoints) never pulls it onto
  the home page; it loads only on a read fallback, `/jokes`, `/game`, or
  `/admin`.
- **Home-page initial JS: ~435 KB → ~171 KB raw (~125 KB → ~55 KB gzip, ≈56%
  smaller).** Largest chunks: supabase 211 KB (lazy) and the React core 151 KB;
  all content-hashed for immutable CDN caching, no production sourcemaps.
- Brand logos (nav lockup + About) converted to **WebP with a PNG fallback**;
  the below-the-fold About logos are lazy-loaded (~509 KB PNG → ~208 KB WebP).
- The Patty Stacker loop fully cancels its `requestAnimationFrame` when the tab
  is hidden (`visibilitychange`) and on route unmount — no background CPU.
- Confirmed: fonts are self-hosted subset woff2 with `font-display: swap`
  (Devanagari only on `/jokes`); menu/jokes/leaderboard reads stay module-cached
  and column-scoped; the game reads only the top 5.

### Game — Patty Stacker
- **Perfect-streak combo multiplier** — perfect drops build a multiplier
  (×2 → ×5, capped) instead of a flat bonus: a perfect is worth
  `base × multiplier` (20/30/40/50), any non-perfect resets it to ×1, and a live
  `×N` indicator shows beside the score. Max ~100 pts/drop keeps an honest run
  well under the 9999 cap.
- **Themed art slots** wired in (a backdrop behind the playfield, plus game-over
  and high-score illustrations) via a `ThemeAsset` component with a
  WebP→PNG→hide fallback; the slots hide gracefully until the art is added under
  `public/assets/game/`.

### Leaderboard — one row per player
- `20260616000000_leaderboard_unique_initials.sql` de-dupes existing rows
  (keeping each initials' max), adds a unique constraint on `initials`, and adds
  a `SECURITY DEFINER` `submit_score()` upsert that only ever raises a score —
  so "no duplicates, keep the best" can't be bypassed (anon has INSERT-only
  RLS). The API and the dev fallback both call it. Run it in the SQL editor.
- The game-over entry card notes "Same initials? You'll share the throne." since
  3-letter initials can collide between real people.

### Site
- Hero headline trimmed: "HOME OF *the* INDIAN BURGERS" → "HOME OF INDIAN BURGERS".

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
