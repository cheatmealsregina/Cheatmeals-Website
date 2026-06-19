import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/paneer-burgers-regina');

export function PaneerBurgersPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="Paneer people, this is your sign."
    >
      <p>At CheatMeals in Regina, paneer burgers are one of the main burger families. They are crispy, saucy, spicy, cheesy, and built with enough confidence to make plain burgers look underdressed.</p>
      <p>We are talking crispy paneer patties, schezwan mayo, chilli sauce, pickled onions, crispy onions, jalapenos, cilantro, makhni-style gravy, marble cheese, and proper CheatMeals attitude.</p>

      <ContentSection title="Paneer, But Make It a Burger">
        <p>Paneer already knows how to handle flavour.</p>
        <p>Put it in a burger with Indian-style sauces, spice, onions, crunch, and cheese, and suddenly it becomes a full craving situation.</p>
        <p>At CheatMeals, paneer burgers are for people who want something richer than the usual fast-food bite. They are filling, bold, and built to hold sauce without disappearing.</p>
      </ContentSection>

      <ContentSection title="Crispy, Saucy, Spicy, Repeat">
        <p>A good paneer burger needs balance.</p>
        <p>The patty brings the bite. The sauces bring the drama. The onions and jalapenos bring sharpness. The cheese brings the comfort. The cilantro and masala-style toppings keep the whole thing moving.</p>
        <p>Depending on the burger, you may find schezwan mayo, chilli sauce, pickled onions, crispy onions, jalapenos, cilantro, makhni gravy, and marble cheese.</p>
        <p>Regular mayo-based sauces contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering.</p>
        <p>Basically, paneer came ready for the spotlight.</p>
      </ContentSection>

      <ContentSection title="From King Kong to Flame Thrower">
        <p>The CheatMeals paneer burger lineup includes names that do not exactly whisper.</p>
        <p>Look for <strong>King Kong Paneer</strong>, <strong>Hong Kong Paneer</strong>, <strong>Flame Thrower Paneer</strong>, <strong>Paneer Pataka</strong>, <strong>Paneer Chaska</strong>, <strong>Veggie Paneer Delight</strong>, <strong>Paneer Makhni</strong>, and <strong>Crispy Schezwan</strong>.</p>
        <p>Want something bold and spicy? Start around Flame Thrower or Schezwan-style options.</p>
        <p>Want something rich and creamy? Makhni-style flavours are waiting.</p>
        <p>Want the full “I came hungry” experience? The name King Kong is not there by accident.</p>
      </ContentSection>

      <ContentSection title="Paneer Burgers on Dewdney Avenue">
        <p>CheatMeals is located at <strong>4306 Dewdney Avenue in Regina</strong>.</p>
        <p>Burgers come with sides such as fries, chips, Doritos, or Cheetos depending on the menu item, so the paneer does not have to travel alone.</p>
        <p>Paneer people, this is your sign. Come get your burger.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
