import React from 'react';

/* Theme plumbing — data-theme on <html>, persisted to localStorage,
   initialized from prefers-color-scheme (the FOUC script in index.html
   has already applied it before React mounts). A ~250ms cross-fade is
   applied via a temporary [data-xfade] attribute while flipping. */

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(t) {
  const html = document.documentElement;
  html.setAttribute('data-xfade', '');
  html.setAttribute('data-theme', t);
  try { localStorage.setItem('cm-theme', t); } catch (e) {}
  window.dispatchEvent(new CustomEvent('cm-theme', { detail: t }));
  setTimeout(() => html.removeAttribute('data-xfade'), 300);
}

export function useTheme() {
  /* First render assumes 'light' — the theme the routes are prerendered in — so
     hydration matches the static HTML for everyone (a dark-mode visitor reading
     the real data-theme on the first render would otherwise mismatch a
     light-prerendered page). The real theme is applied on mount. There's no
     visible flash: the page is already painted in the correct theme by the
     [data-theme] CSS (the FOUC script set the attribute before React), so this
     only syncs the JS-driven bits (the toggle glyph, the game's themed art). */
  const [theme, set] = React.useState('light');
  React.useEffect(() => {
    set(getTheme()); // correct to the real (FOUC-applied) theme after hydration
    const onFlip = (e) => set(e.detail || getTheme());
    window.addEventListener('cm-theme', onFlip);
    return () => window.removeEventListener('cm-theme', onFlip);
  }, []);
  return [theme, (t) => setTheme(t || (theme === 'dark' ? 'light' : 'dark'))];
}
