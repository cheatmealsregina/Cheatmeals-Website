import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

export function AboutScreen({ mobile, showNav = true }) {
  const { SectionHeader } = DS;
  return (
    <Screen mobile={mobile} label="About">
      {showNav && !mobile ? <Nav mobile={false} active="About" /> : null}
      <div className="pt-band">
        <div className="pt-section" id="about">
          <div className="pt-about__logo">
            {/* Raster brand lockup, theme-swapped: black/red ink on light, cream/red
               on dark. Both carry the same alt — only one is ever displayed
               (the other is display:none per [data-theme], so SRs skip it). */}
            <img
              className="pt-logo-img pt-logo-img--light pt-about__logoimg"
              src="/assets/logos/cheatmeals-about-light.png"
              alt="CheatMeals — Home of Indian Burgers"
            />
            <img
              className="pt-logo-img pt-logo-img--dark pt-about__logoimg"
              src="/assets/logos/cheatmeals-about-dark.png"
              alt="CheatMeals — Home of Indian Burgers"
            />
          </div>
          <SectionHeader title="OUR STORY" accent="STORY" script="this is" kicker="About" />
          <p className="pt-about__copy">{data.about.copy}</p>
        </div>
      </div>
    </Screen>
  );
}
