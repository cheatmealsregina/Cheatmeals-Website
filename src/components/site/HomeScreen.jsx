import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';
import { CallBar } from '../shared/CallBar.jsx';
import { ExplodedBurger, PokeArrow } from '../shared/BurgerArt.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

export function HomeScreen({ mobile }) {
  const { AnnouncementBar, Button } = DS;
  return (
    <Screen mobile={mobile} label="Home">
      <AnnouncementBar>{data.announcement}</AnnouncementBar>
      <Nav mobile={mobile} active="" />
      <main className="pt-hero" id="home">
        <div className="pt-hero__copy">
          <h1 className="pt-hero__h cm-display">
            <span>HOME OF <span className="cm-script pt-hero__script">the</span></span>
            <span><span style={{ color: 'var(--cm-red)' }}>INDIAN</span> BURGERS<span className="pt-hero__star">★</span></span>
          </h1>
          <p className="pt-hero__sub">Desi street flavour. House-made patties. Zero apologies.</p>
          <div className="pt-hero__ctas">
            <Button variant="primary" size="lg" href="/#menu">See the Menu</Button>
            <Button variant="secondary" size="lg" href={data.tel} icon="phone">Call to Order</Button>
          </div>
          <span className="pt-trust cm-label">
            We make our own patties <b>·</b> Every burger comes with a side.
          </span>
        </div>
        <div className="pt-hero__art">
          <ExplodedBurger size={mobile ? 300 : 420} />
          <PokeArrow />
        </div>
      </main>
      {mobile ? <CallBar /> : null}
    </Screen>
  );
}
