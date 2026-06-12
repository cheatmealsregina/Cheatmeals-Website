import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';
import { Logo } from '../shared/Logo.jsx';

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
            <Logo variant="primary" height={mobile ? 120 : 170} label="CheatMeals" />
          </div>
          <SectionHeader title="OUR STORY" accent="STORY" script="this is" kicker="About" />
          <p className="pt-about__copy">{data.about.copy}</p>
          <div className="pt-photos">
            <image-slot name="about-1" label="The counter" />
            <image-slot name="about-2" label="On the tawa" />
            <image-slot name="about-3" label="The crew" />
          </div>
        </div>
      </div>
    </Screen>
  );
}
