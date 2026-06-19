/* Canonical internal destinations for the site's primary actions/sections, so
 * every content page links to the SAME real place — no dead links, no invented
 * routes. Confirmed against the codebase:
 *   - Menu   → the section anchor on the one-page home (MenuScreen, id="menu").
 *   - Order  → there is NO online-ordering page on this site, so "Order Online"
 *              maps to the existing Call-to-Order action (the same tel: CTA the
 *              Nav, hero and CallBar use). Do not invent an order route.
 *   - Visit/ → the Visit section anchor (VisitScreen, id="visit": address,
 *     Contact   hours, map, directions, phone) — this is the location/contact.
 *
 * Menu/Visit are ANCHORS, not standalone routes: /menu or /visit as a PATH
 * would render the home page without scrolling, so the working destinations are
 * the hashes. The call action reads the live phone (window.CM_DATA.tel), the
 * same source the site CTA uses, with a seed fallback. */
const TEL = (typeof window !== 'undefined' && window.CM_DATA && window.CM_DATA.tel) || 'tel:+13065419198';

export const SITE_LINKS = {
  menu: { label: 'See the menu', href: '/#menu' },
  // "Order Online" has no destination on this site — it is the Call-to-Order action.
  orderOnline: { label: 'Call to order', href: TEL },
  call: { label: 'Call to order', href: TEL },
  // "Location / Contact" is the Visit section.
  location: { label: 'Visit & hours', href: '/#visit' },
  visit: { label: 'Visit & hours', href: '/#visit' },
};
