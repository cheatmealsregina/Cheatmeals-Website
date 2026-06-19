import React from 'react';
import { CONTENT_ROUTES, contentRouteFor } from '../../lib/contentRoutes.js';
import { SITE_LINKS } from '../../lib/siteLinks.js';

/* Resolve an internal-link token to a real {label, href}. 'menu' -> /#menu,
 * 'call' -> the Call-to-Order tel action, a content path -> that page. */
function resolveToken(token) {
  if (token === 'menu') return { label: 'Menu', href: SITE_LINKS.menu.href };
  if (token === 'call') return { label: SITE_LINKS.call.label, href: SITE_LINKS.call.href };
  const r = contentRouteFor(token);
  return r ? { label: r.navLabel, href: r.path } : null;
}

/* Crawlable internal-links block. Content pages pass `tokens` (the curated list
 * from the content file); the home page passes none and gets the auto list of
 * every content page. Every destination is real — no dead links. */
export function LearnMore({ tokens, currentPath = '', showMenu = true, showCall = false, heading = 'Learn more' }) {
  let items;
  if (tokens && tokens.length) {
    items = tokens.map(resolveToken).filter(Boolean).filter((it) => it.href !== currentPath);
  } else {
    items = CONTENT_ROUTES.filter((r) => r.path !== currentPath).map((r) => ({ label: r.navLabel, href: r.path }));
    if (showMenu) items.push({ label: 'Menu', href: SITE_LINKS.menu.href });
    if (showCall) items.push({ label: SITE_LINKS.call.label, href: SITE_LINKS.call.href });
  }
  if (!items.length) return null;
  return (
    <nav className="cm-learnmore" aria-label="Learn more about CheatMeals">
      <h2 className="cm-learnmore__title cm-label">{heading}</h2>
      <ul className="cm-learnmore__list">
        {items.map((it) => (
          <li key={it.href + it.label}>
            <a className="cm-learnmore__item" href={it.href}>{it.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
