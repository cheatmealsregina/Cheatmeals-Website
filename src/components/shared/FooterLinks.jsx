import React from 'react';

/* The sitewide "Learn More" internal-links block from docs/seo_pages.md.
 * Rendered inside the persistent footer (SiteFooter) on every page, so all nine
 * SEO content pages are reachable — and crawlable — from anywhere on the site.
 *
 * The anchor text, paths and order are reproduced VERBATIM from the content
 * file's "Sitewide Footer / Learn More Block". These labels intentionally differ
 * from the per-page navLabel/heading in contentRoutes.js — the file specifies
 * its own footer wording, so it's hardcoded here rather than derived. */
const LINKS = [
  { href: '/jain-swaminarayan-food-regina', label: 'Jain & Swaminarayan Food in Regina' },
  { href: '/what-is-an-indian-burger', label: 'What Is an Indian Burger?' },
  { href: '/vegetarian-burgers-regina', label: 'Vegetarian Burgers in Regina' },
  { href: '/aloo-burgers-regina', label: 'Aloo Tikki Burgers in Regina' },
  { href: '/paneer-burgers-regina', label: 'Paneer Burgers in Regina' },
  { href: '/frankies-regina', label: 'Indian Frankies in Regina' },
  { href: '/indian-sandwiches-regina', label: 'Indian Sand-Witches in Regina' },
  { href: '/loaded-fries-regina', label: 'Loaded Fries in Regina' },
  { href: '/about', label: 'About CheatMeals' },
];

export function FooterLinks() {
  return (
    <nav className="cm-footer-links" aria-label="Learn more about CheatMeals">
      <h2 className="cm-footer-links__title cm-display">Learn More</h2>
      <p className="cm-footer-links__intro">Craving homework, but the tasty kind? Explore more from CheatMeals:</p>
      <ul className="cm-footer-links__list">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a className="cm-footer-links__item" href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
