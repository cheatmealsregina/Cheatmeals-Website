import React from 'react';
import { Logo } from './Logo.jsx';
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
    <header className="pt-nav">
      <a href="/" className="pt-nav__home" aria-label="CheatMeals home">
        <Logo variant="horizontal" height={mobile ? 34 : 44} label="CheatMeals — Home of Indian Burgers" />
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
          <a className="pt-nav__pennant" href="/game"><Pennant>While you wait</Pennant></a>
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
        <ThemeToggle />
        {!mobile ? <Button variant="call" href={data.tel}>Call to Order</Button> : null}
      </div>
    </header>
  );
}
