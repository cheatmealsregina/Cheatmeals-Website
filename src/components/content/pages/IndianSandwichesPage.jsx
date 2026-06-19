import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/indian-sandwiches-regina');

export function IndianSandwichesPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead={<>At CheatMeals, we call them <strong>Sand-Witches</strong>.</>}
    >
      <p>It is not actual witchcraft, but it will possess you.</p>
      <p>These are Indian-style sandwiches built with cheese, chutney, garlic, sauces, spice, grilled edges, pickled onions, green peppers, marble cheese, chaat masala, and the kind of flavour that makes regular sandwiches look like they forgot to try.</p>

      <ContentSection title="Not Your Regular Sandwich">
        <p>A regular sandwich is fine.</p>
        <p>Fine is not why you came to CheatMeals.</p>
        <p>Our Sand-Witches are made for people who want something grilled, saucy, cheesy, spicy, and properly satisfying. They are the kind of sandwiches that understand chutney, respect garlic butter, and know that marble cheese has a job to do.</p>
      </ContentSection>

      <ContentSection title="Why We Call Them Sand-Witches">
        <p>Because “sandwich” sounded too normal.</p>
        <p>The CheatMeals Sand-Witch menu brings a little drama to the bread game. You get Indian-style ingredients, bold sauces, and combinations that feel closer to street food than cafeteria food.</p>
        <p>Menu examples include <strong>Junglee Paneer</strong>, <strong>Cheese Chilli Garlic</strong>, <strong>Cheese Chilli Onion</strong>, <strong>Classic Grill Cheese</strong>, and <strong>Cheese-Chutney</strong>.</p>
        <p>No broomsticks. Just cravings.</p>
      </ContentSection>

      <ContentSection title="Cheese, Chutney, Garlic, Trouble">
        <p>Depending on the Sand-Witch, you may find tandoori sauce, schezwan sauce, pickled onion, green pepper, marble cheese, garlic butter, chaat masala, and in-house spicy chutney.</p>
        <p>That means every bite brings something different: creamy, spicy, tangy, crunchy, buttery, and slightly addictive in the way good street food should be.</p>
        <p>The <strong>Cheese-Chutney</strong> keeps it classic with that spicy chutney punch. The <strong>Cheese Chilli Garlic</strong> brings the garlic butter energy. The <strong>Junglee Paneer</strong> is for people who like their sandwich with a little chaos.</p>
        <p>For Jain or Swaminarayan orders, mention the restriction clearly before ordering so eggless sauces can be used instead of regular mayo-based sauces.</p>
      </ContentSection>

      <ContentSection title="For Softhearted Foodies and Brave Ones Too">
        <p>Not every Sand-Witch has to burn your eyebrows off.</p>
        <p>Some are cheesy and comforting. Some are spicy and loud. Some are built for people who say, “I can handle it,” and then immediately need a drink.</p>
        <p>Ask us what fits your spice mood before ordering.</p>
      </ContentSection>

      <ContentSection title="Find Sand-Witches in Regina">
        <p>CheatMeals is located at <strong>4306 Dewdney Avenue in Regina</strong>.</p>
        <p>Normal sandwiches are fine. Sand-Witches are what happens when fine gets boring.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
