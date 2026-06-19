import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';
import { CallBar } from '../shared/CallBar.jsx';
import { LearnMore } from './LearnMore.jsx';
import { SITE_LINKS } from '../../lib/siteLinks.js';
import { contentRouteFor } from '../../lib/contentRoutes.js';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

/* Reusable long-form content-page layout. Matches the site exactly: shared Nav,
 * the brand SectionHeader (display H1 + dotted rules), a readable prose column,
 * the mobile CallBar and the shared Footer. Theme-aware and mobile-correct via
 * the same tokens/components as every other page — scoped classes in
 * src/styles/content.css, no new global styles.
 *
 *   heading  — the exact H1 text (display font; rendered without stars so the
 *              long, sentence-case headings stay clean and match the copy file)
 *   lead     — the opening paragraph (string or JSX), larger + centred
 *   children — the prose (use <ContentSection>, <ContentCta>, <Faq>) */
export function ContentPage({ mobile, heading, lead, currentPath, children }) {
  const { SectionHeader, Footer } = DS;
  const route = contentRouteFor(currentPath);
  return (
    <Screen mobile={mobile} label={heading}>
      <Nav mobile={mobile} active="" />
      <main className="pt-section cm-content" id="content">
        <header className="cm-content__head">
          <SectionHeader as="h1" title={heading} stars={false} />
          {lead ? <p className="cm-content__lead">{lead}</p> : null}
        </header>

        <div className="cm-content__prose">{children}</div>

        <LearnMore tokens={route && route.links} currentPath={currentPath} showCall />
      </main>
      {mobile ? <CallBar /> : null}
      <Footer
        logoSrc="/assets/logos/cheatmeals-primary-inverse.svg"
        address={data.address + ', ' + data.city}
        phone={data.phone}
        socials={false}
      />
    </Screen>
  );
}

/* A prose subsection: a display-font subheading + its body copy. */
export function ContentSection({ title, children }) {
  return (
    <section className="cm-content__section">
      <h2 className="cm-content__h2 cm-display">{title}</h2>
      {children}
    </section>
  );
}

/* Closing call-to-action row — the two real actions (Call to Order + Menu). */
export function ContentCta() {
  const { Button } = DS;
  return (
    <div className="cm-content__cta">
      <Button variant="primary" size="lg" href={SITE_LINKS.call.href} icon="phone">Call to order</Button>
      <Button variant="secondary" size="lg" href={SITE_LINKS.menu.href}>See the menu</Button>
    </div>
  );
}

/* Styled FAQ block — native <details> disclosures (answers are in the HTML even
 * when collapsed, so they prerender and stay crawlable). `items` is
 * [{ q, a }] with string answers (the same array that feeds the FAQPage
 * JSON-LD in routeHead.js, so structured data matches the visible text). */
export function Faq({ title = 'FAQ', items }) {
  if (!items || !items.length) return null;
  return (
    <section className="cm-faq" aria-label={title}>
      <h2 className="cm-content__h2 cm-display">{title}</h2>
      <div className="cm-faq__list">
        {items.map((it, i) => (
          <details className="cm-faq__item" key={i}>
            <summary className="cm-faq__q">
              <span>{it.q}</span>
              <svg className="cm-faq__chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="cm-faq__a"><p>{it.a}</p></div>
          </details>
        ))}
      </div>
    </section>
  );
}
