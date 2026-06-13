import React from 'react';
import { ThemeToggle } from './ThemeToggle.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

const LINKS = [
  { label: 'Menu', href: '/#menu' },
  { label: 'About', href: '/#about' },
  { label: 'Team', href: '/#team' },
  { label: 'Visit', href: '/#visit' },
];

/* Site nav — theme-aware horizontal lockup · links · Instagram ·
   theme toggle · red-outline Call button · "While you wait" pennant. */
export function Nav({ mobile, active = '' }) {
  const { Button, Icon, Pennant } = DS;
  return (
    <React.Fragment>
    <header className="pt-nav">
      <a href="/" className="pt-nav__home" aria-label="CheatMeals — Home of Indian Burgers, home">
        {/* Brand lockup — light/dark raster pair, swapped by [data-theme] in CSS */}
        <img
          className="pt-logo-img pt-logo-img--light"
          src="/assets/logos/cheatmeals-lockup-light.png"
          alt=""
          aria-hidden="true"
          style={{ height: mobile ? 34 : 44 }}
        />
        <img
          className="pt-logo-img pt-logo-img--dark"
          src="/assets/logos/cheatmeals-lockup-dark.png"
          alt=""
          aria-hidden="true"
          style={{ height: mobile ? 34 : 44 }}
        />
      </a>
      {!mobile ? (
        <nav className="pt-nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.label}
              className={'cm-nav__link' + (l.label === active ? ' cm-nav__link--active' : '')}
              aria-current={l.label === active ? 'page' : undefined}
              href={l.href}
            >
              {l.label}
            </a>
          ))}
          <a className="pt-nav__pennant" href="/jokes"><Pennant>While you wait</Pennant></a>
        </nav>
      ) : null}
      <div className="pt-nav__actions">
        <a
          className="pt-iconbtn"
          href={data.instagramUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={'Instagram ' + data.instagram}
        >
          <Icon name="instagram" size={20} />
        </a>
        {mobile ? (
          <a className="pt-nav__game" href="/game" aria-label="Play the burger stacker while you wait">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="4" />
              <path d="M7 10v4 M5 12h4 M15 11h.01 M18.5 13.5h.01" />
            </svg>
          </a>
        ) : null}
        <ThemeToggle />
        {!mobile ? <Button variant="call" href={data.tel}>Call to Order</Button> : null}
      </div>
    </header>
    {mobile ? (
      <nav className="pt-nav__scroll" aria-label="Sections">
        {LINKS.map((l) => (
          <a
            key={l.label}
            className={'cm-nav__link' + (l.label === active ? ' cm-nav__link--active' : '')}
            aria-current={l.label === active ? 'page' : undefined}
            href={l.href}
          >
            {l.label}
          </a>
        ))}
      </nav>
    ) : null}
    </React.Fragment>
  );
}
