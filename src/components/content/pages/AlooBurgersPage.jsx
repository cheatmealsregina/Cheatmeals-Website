import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/aloo-burgers-regina');

export function AlooBurgersPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="Aloo tikki burgers are not new to desi cravings."
    >
      <p>They are classics for a reason: crispy potato-style patties, chutneys, sauces, onions, cheese, spice, and that Indian street-food crunch that makes one bite turn into “actually, I’ll finish this.”</p>
      <p>At CheatMeals in Regina, aloo burgers are one of the main ways we bring Indian burger energy to Dewdney Avenue.</p>

      <ContentSection title="The Crispy Classic">
        <p>An aloo tikki burger starts with the patty.</p>
        <p>At CheatMeals, we make our own patties, because the centre of the burger should not taste like it gave up halfway.</p>
        <p>The aloo patty brings that crispy outside, soft inside, seasoned bite that works perfectly with chutney, sauces, onions, cheese, and spice. It is familiar, comforting, and still loud enough to keep things interesting.</p>
      </ContentSection>

      <ContentSection title="The Aloo Burger Lineup">
        <p>The CheatMeals aloo burger family has range.</p>
        <p>Look for names like <strong>The Red Hulk</strong>, <strong>Aloo Anarkali</strong>, <strong>Aloo 420</strong>, <strong>Amdavadi Chaska 2.0</strong>, <strong>Masala Aloo Tikki</strong>, <strong>Achari Aloo</strong>, <strong>Red Devil</strong>, <strong>Aloo Makhni</strong>, <strong>Peri-Peri</strong>, and <strong>Aloo Tikki</strong>.</p>
        <p>Some are spicy. Some are tangy. Some are creamy. Some sound like they should come with a warning label.</p>
        <p>That is part of the fun.</p>
      </ContentSection>

      <ContentSection title="Chutney, Sauce, Cheese, Crunch">
        <p>Aloo burgers work because every layer has a job.</p>
        <p>The patty gives the bite. The chutney brings the desi kick. The sauces bring creaminess, heat, or tang. Onions add sharpness. Cheese brings comfort. Crunch keeps the whole thing from becoming too polite.</p>
        <p>Regular mayo-based sauces contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering.</p>
        <p>This is why an aloo tikki burger does not feel like a compromise. It feels like street food found a bun and got ambitious.</p>
      </ContentSection>

      <ContentSection title="Served With a Side">
        <p>CheatMeals burgers come with a side such as fries, chips, Doritos, or Cheetos depending on the item.</p>
        <p>So yes, the burger is already doing plenty. The side still shows up anyway.</p>
        <p>Respect.</p>
      </ContentSection>

      <ContentSection title="Aloo Tikki Burgers on Dewdney Avenue">
        <p>CheatMeals is located at <strong>4306 Dewdney Avenue in Regina</strong>.</p>
        <p>If you are craving an aloo tikki burger, a desi burger, or Indian-style fast food with actual personality, this is where the stack lives.</p>
        <p>Aloo people, pull up. The patty is ready.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
