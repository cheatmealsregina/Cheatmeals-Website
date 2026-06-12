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
  const [theme, set] = React.useState(getTheme);
  React.useEffect(() => {
    const onFlip = (e) => set(e.detail || getTheme());
    window.addEventListener('cm-theme', onFlip);
    return () => window.removeEventListener('cm-theme', onFlip);
  }, []);
  return [theme, (t) => setTheme(t || (theme === 'dark' ? 'light' : 'dark'))];
}
