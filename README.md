# CheatMeals

Marketing + ordering-info site for CheatMeals (Indian burgers & Desi street food, 4306 Dewdney Avenue, Regina SK). Vite + React SPA, build-time prerendered for SEO, deployed on Vercel — live at https://cheatmealshoib.com.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # vite build → generate sitemap → prerender static HTML into dist/
npm run preview  # serve the built dist/
```

## SEO: routes, sitemap & robots

The site's public, indexable routes are defined once in [`_reference/routes.mjs`](_reference/routes.mjs) (`PUBLIC_ROUTES`). Both the prerenderer and the sitemap generator read that list, so they can't drift. `/admin` is intentionally excluded everywhere (not prerendered, `noindex`, disallowed in `robots.txt`).

**Regenerating the sitemap when routes change:** add or remove the route in `_reference/routes.mjs`, then `npm run build`. The build step `_reference/gen-sitemap.mjs` rewrites `dist/sitemap.xml` from that list with absolute `https://cheatmealshoib.com` URLs and a fresh `<lastmod>` (the build date) — no manual XML editing. `public/sitemap.xml` is a static fallback only. `public/robots.txt` is static and points at `https://cheatmealshoib.com/sitemap.xml`.

> Canonical host form is `https://cheatmealshoib.com` (https, apex/non-www, no trailing slash). Keep `ORIGIN` identical in `_reference/routes.mjs`, `src/lib/routeHead.js`, and the canonical/OG tags in `index.html`.
