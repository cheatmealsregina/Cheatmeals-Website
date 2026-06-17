import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

export function VisitScreen({ mobile, showNav = true }) {
  const { SectionHeader, Button, Icon, HoursTable, SocialButtons, Footer } = DS;
  const mapsUrl =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(data.address + ', ' + data.city);
  return (
    <Screen mobile={mobile} label="Visit">
      {showNav && !mobile ? <Nav mobile={false} active="Visit" /> : null}
      <div className="pt-section" id="visit">
        <SectionHeader title="VISIT US" accent="VISIT" script="come" kicker="Find us" />
        <div className="pt-visit">
          <div className="pt-visit__info">
            <p className="pt-visit__addr">
              <Icon name="mapPin" size={20} />
              <span>{data.address}<br />{data.city}</span>
            </p>
            <Button
              variant="secondary"
              icon="mapPin"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Get directions
            </Button>
            <Button variant="call" size="lg" href={data.tel}>{'Call · ' + data.phone}</Button>
            <HoursTable hours={data.hours} today={data.today} />
            <SocialButtons
              instagram={data.instagramUrl}
              phone={data.phone}
            />
          </div>
          <a
            className="pt-visit__map cm-halftone"
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            role="img"
            aria-label={'Open map — ' + data.address + ', ' + data.city}
          >
            <span className="pt-visit__pin">
              <Icon name="mapPin" size={32} />
              <span className="cm-label">{data.address}</span>
            </span>
          </a>
        </div>
      </div>
      <Footer
        logoSrc="/assets/logos/cheatmeals-primary-inverse.svg"
        address={data.address + ', ' + data.city}
        phone={data.phone}
        note={
          <a href={data.instagramUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            Fell in love with us? Follow on Insta →
          </a>
        }
        socials={false}
      />
    </Screen>
  );
}
