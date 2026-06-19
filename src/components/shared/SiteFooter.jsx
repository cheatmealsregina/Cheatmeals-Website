import React from 'react';
import { FooterLinks } from './FooterLinks.jsx';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

/* The site's persistent footer: the sitewide "Learn More" links block (so all
 * nine content pages are reachable from any page) directly above the shared DS
 * Footer. Used on the home page, /game, /jokes and every content page, so the
 * footer — and its crawlable internal links — is identical everywhere.
 *
 *   note — optional extra line passed through to the DS Footer (e.g. the home
 *          page's "Follow on Insta" link). */
export function SiteFooter({ note }) {
  const { Footer } = DS;
  return (
    <React.Fragment>
      <FooterLinks />
      <Footer
        logoSrc="/assets/logos/cheatmeals-primary-inverse.svg"
        address={data.address + ', ' + data.city}
        phone={data.phone}
        note={note}
        socials={false}
      />
    </React.Fragment>
  );
}
