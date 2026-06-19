import React from 'react';
import { ContentPage, ContentSection, ContentCta } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/about');

export function AboutPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead={<>CheatMeals is Regina’s <strong>Home of Indian Burgers</strong>.</>}
    >
      <p>Not the quiet kind. Not the “add sauce and call it fusion” kind. We are talking desi-style burgers built with house-made patties, bold sauces, chutneys, cheese, spice, crunch, and the kind of menu names that sound like they already know they are dangerous.</p>
      <p>We are located at <strong>4306 Dewdney Avenue in Regina</strong>, serving Indian street-food-inspired fast food with a local Regina heartbeat.</p>

      <ContentSection title="Born From a Craving">
        <p>CheatMeals started with a simple thought: Regina deserved the kind of desi burgers we grew up craving.</p>
        <p>The kind that do not politely sit on a plate. The kind that come stacked, sauced, spiced, and wrapped like they have somewhere important to be.</p>
        <p>Inspired by Ahmedabad-style street-food energy and built for Regina’s hungry crowd, CheatMeals brings Indian burger culture into a fast-food format without sanding off the personality.</p>
      </ContentSection>

      <ContentSection title="Indian Burgers, Regina Energy">
        <p>This is not faceless fast food.</p>
        <p>CheatMeals is local, bold, and built for the community that understands cravings properly. Students, families, late lunch people, spice lovers, sauce people, paneer loyalists, aloo tikki fans, and the “I’ll just try one bite” crowd are all welcome.</p>
        <p>That last group usually loses.</p>
      </ContentSection>

      <ContentSection title="House-Made Patties, No Boring Bites">
        <p>We make our own patties because a burger is only as strong as what is inside it.</p>
        <p>Our menu brings together aloo burgers, paneer burgers, frankies, Sand-Witches, loaded fries, pavs, dips, and Restricted Space options for Jain, Swaminarayan, and eggless needs.</p>
        <p>The goal is simple: every bite should have a reason to exist.</p>
      </ContentSection>

      <ContentSection title="Built for the Community That Gets Hungry Properly">
        <p>CheatMeals is playful, but the craving is serious.</p>
        <p>From the menu names to the sauces to the loaded fries that refuse to act like a side dish, everything is built with personality. No corporate speech. No bland “fresh and delicious” wallpaper words. Just Indian fast food with attitude.</p>
        <p>Come for the burger. Stay because your regular order just got replaced.</p>
      </ContentSection>

      <ContentCta />
    </ContentPage>
  );
}
