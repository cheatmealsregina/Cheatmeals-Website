/* Route-scoped Indic font loader.

   The Noto Indic faces live in a stylesheet kept OUT of the global initial
   load (so the homepage never pays for ~120KB of Devanagari it won't render).
   Inject it only on routes that actually show Indic script — the public
   /jokes page and the admin jokes editor — by calling ensureIndicFonts()
   when those mount. font-display:swap and the [data-indic] → font-family
   mapping both live in the stylesheet itself.

   Idempotent: keyed off the element id, so calling it from several places
   (or twice) only ever adds one <link>. */
export const INDIC_FONTS_HREF =
  '/_ds/cheatmeals-design-system-e4e5642f-825c-4537-9486-cbc4230dd10b/tokens/fonts-indic.css';

export function ensureIndicFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cm-indic-fonts')) return;
  const link = document.createElement('link');
  link.id = 'cm-indic-fonts';
  link.rel = 'stylesheet';
  link.href = INDIC_FONTS_HREF;
  document.head.appendChild(link);
}
