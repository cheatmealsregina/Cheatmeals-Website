# CheatMeals — release testing checklist

Run before every deploy. Automated harnesses live in `_reference/` and need
the dev server running (`npm run dev`) unless noted; they drive headless
Edge via puppeteer-core. Each section lists the manual check and, where one
exists, the harness that covers it.

## 1. Public site — full render, both themes, live data

- [ ] `/` renders Home, Menu, About, Team, Visit end-to-end with data from
      Supabase (13 Aloo cards, category notes, hours, team bios)
- [ ] Dark theme renders with no stranded light-theme colors anywhere
- [ ] All 11 menu tabs render (populated, dietary, and voice-line empty states)
- [ ] Search ("aloo" → results, gibberish → brand-voice empty state) and
      Chef's Picks toggle work
- Harness: `node _reference/verify.mjs <tag>` (full-page screenshots both
  themes + all tabs; pixel-compare a tag against `shots/baseline/` with
  `node _reference/compare.mjs`)

## 2. Theme toggle persistence

- [ ] Toggle flips `data-theme` on `<html>` with the cross-fade
- [ ] Choice survives reload (localStorage `cm-theme`)
- Harness: covered in `verify.mjs`

## 3. Hero interactions

- [ ] Hover explodes the burger; captions fade in (desktop)
- [ ] Click smashes; five fast clicks trigger the easter-egg spin + pennant
- [ ] Announcement bar dismisses
- Harness: covered in `verify.mjs`

## 4. Game — full play-through

- [ ] `/game` shows the how-to veil on first visit, then TAP TO STACK
- [ ] Drops stack, slices tumble, perfect drops star, streak shows chilis
- [ ] Game over → initials entry (when top-5) → Save submits to the shared
      leaderboard (`/api/leaderboard` in prod, direct insert in dev) and the
      top-5 list refreshes from the server
- [ ] Personal best persists in localStorage
- Harness: covered in `verify.mjs`; API logic in `node _reference/test-api.mjs`
  (validation 400s, 405, 6/min rate limit, insert + top5)

## 5. Admin — phone viewport (375px)

- [ ] Logged out, every `/admin` URL shows the login; wrong password shows
      "Not the secret recipe. Try again."
- [ ] Sign-in lands on the menu editor; reload keeps the session
- [ ] Edit name/description/price (clear price → "N/A"), badges via picker,
      availability toggle (optimistic, rolls back on failure), add item,
      delete behind the confirm modal, drag-reorder within a section
- [ ] Category note + Site content tab (announcement, story, hours, team)
- [ ] Photo upload → resized WebP in `menu-photos`, public card shows it,
      halftone fallback intact elsewhere
- [ ] Sign out returns to login; signed-out writes fail (RLS) and revert
- Harness: `node _reference/verify-admin.mjs` (mock-auth CRUD assertions +
  real RLS anon blocks) and `node _reference/verify-auth.mjs` (auth flows)

## 6. Supabase-down fallback

- [ ] With Supabase unreachable, the site renders the bundled seed data and
      logs the `[data] Supabase unreachable` warning — never an empty page
- [ ] An item marked unavailable disappears from the public menu on reload
- Harness: `node _reference/verify-failures.mjs`

## 7. Production build + preview

- [ ] `npm run build` succeeds
- [ ] `npm run preview` serves `/`, `/game`, `/jokes`, `/admin` with zero
      console errors/warnings and live data renders
- Harness: `node _reference/verify-preview.mjs` (start `npm run preview`
  first)

## 8. Bundle hygiene

- [ ] The dist output contains only the expected env values: the project URL
      and the anon key (both are public by design — RLS is the boundary)
- [ ] No `service_role` anywhere in dist; every JWT-shaped string in the
      bundle decodes to `"role":"anon"`
- [ ] `api/` (server code) is not part of dist
- Harness: covered in `verify-preview.mjs` (dist scan section)

## 9. Jokes — public `/jokes`

- [ ] Renders from live data (Supabase `jokes`, active only) in both themes
      and at 375px + 1280px, with zero console errors
- [ ] "Hit me again" never repeats a joke until the active language's pool is
      exhausted, then reshuffles (no back-to-back repeat across the reset)
- [ ] Language switcher shows only languages with ≥1 active joke, labelled in
      their own script; the choice persists across reload (localStorage
      `cm-jokes-lang`) and is hidden when only one language is active
- [ ] Hindi renders in Devanagari — correct conjuncts/matras, no tofu — and
      the Noto face + `tokens/fonts-indic.css` load **only** on this route
- [ ] Homepage initial load is unchanged (Lighthouse font budget): `/` makes
      zero requests for `fonts-indic.css` or the Devanagari woff2
- [ ] Supabase unreachable → the page still shows a joke from the bundled
      `window.CM_JOKES` fallback, never the empty state
- Harness: `node _reference/verify-jokes.mjs` (dev server on :5173;
  screenshots land in `_reference/shots/jokes/`)

## 10. Jokes — admin editor (375px)

- [ ] A Jokes tab sits alongside Menu / Site content; language sub-tabs
      (English / Hindi) filter the list, jokes grouped by language
- [ ] Add an English **and** a Hindi joke (POST with lang / text / category /
      is_active / sort_order); the Hindi entry field accepts and shows
      Devanagari in the Noto face (same `--font-indic-devanagari` mapping as
      the public page)
- [ ] Edit text inline (PATCH text); category optional; 500-char guard
- [ ] is_active toggle (red = in rotation) is optimistic with rollback +
      error toast on failure; retiring a joke pulls it from the public page on
      reload, and its language pill disappears if it was the last active one
- [ ] Delete behind the confirm modal (DELETE)
- [ ] Drag-reorder within a language writes `sort_order`
- [ ] Each success fires the "Saved" toast; failures revert with an error toast
- [ ] Signed-out writes fail (RLS) — anon PATCH / POST / DELETE on `jokes`
      change nothing
- Harness: `node _reference/verify-jokes-admin.mjs` (dev server on :5173;
  mock-auth write assertions + real RLS anon block, mirrors
  `verify-admin.mjs`)

## After the walk

- [ ] Clear test rows from `leaderboard` (dashboard) if harnesses ran the
      game (`CMX`/`ZZZ` low scores). The jokes harnesses never write to the
      live DB (admin writes are intercepted; anon writes are RLS-blocked), so
      no jokes cleanup is needed.
- [ ] Update CHANGELOG.md
