import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

export function TeamScreen({ mobile, showNav = true }) {
  const { SectionHeader, TeamCard } = DS;
  return (
    <Screen mobile={mobile} label="Team">
      {showNav && !mobile ? <Nav mobile={false} active="Team" /> : null}
      <div className="pt-section" id="team">
        <SectionHeader
          title="THE PEOPLE BEHIND THE PATTIES"
          accent="PATTIES"
          script="meet"
          kicker="Team"
        />
        <div className="pt-team">
          {data.team.map((m) => (
            <TeamCard key={m.name} name={m.name} bio={m.bio} />
          ))}
        </div>
      </div>
    </Screen>
  );
}
