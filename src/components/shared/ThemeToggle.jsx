import React from 'react';
import { useTheme } from './useTheme.js';

/* Sun / moon line-art toggle — 24px grid, 2px round caps, no emoji. */
function SunGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5 v2.4 M12 19.1 v2.4 M2.5 12 h2.4 M19.1 12 h2.4 M5.2 5.2 l1.7 1.7 M17.1 17.1 l1.7 1.7 M18.8 5.2 l-1.7 1.7 M6.9 17.1 l-1.7 1.7" />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5 A8.5 8.5 0 1 1 9.5 4 A7 7 0 0 0 20 14.5 Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, flip] = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="pt-toggle"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => flip()}
    >
      {dark ? <SunGlyph /> : <MoonGlyph />}
    </button>
  );
}

/* Floating pill version — used on screens without a nav. */
export function ThemeBar() {
  return (
    <div className="pt-themebar">
      <ThemeToggle />
    </div>
  );
}
