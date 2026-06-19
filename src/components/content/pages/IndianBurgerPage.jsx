import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/what-is-an-indian-burger');

export function IndianBurgerPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="An Indian burger is not a regular burger wearing a little masala and pretending to be interesting."
    >
      <p>It is a proper desi stack: crispy patties, chutneys, sauces, pickled onions, crispy onions, cilantro, jalapenos, shredded or marble cheese, and enough street-food attitude to make basic fast food nervous.</p>
      <p>At CheatMeals in Regina, Indian burgers are what we do. We make our own patties, build them with Indian-style flavours, and serve them like they were meant to cause a small craving problem.</p>

      <ContentSection title="Not a Regular Burger Wearing Masala">
        <p>A regular burger usually plays it safe.</p>
        <p>An Indian burger does not.</p>
        <p>It brings the flavour louder: chutney, spice, tang, crunch, heat, creamy sauce, pickled onion, cheese, and a patty that actually has a personality.</p>
        <p>At CheatMeals, you will find burgers like <strong>The Red Hulk</strong>, <strong>Aloo Anarkali</strong>, <strong>Aloo 420</strong>, <strong>Amdavadi Chaska 2.0</strong>, <strong>Masala Aloo Tikki</strong>, <strong>King Kong Paneer</strong>, <strong>Hong Kong Paneer</strong>, <strong>Flame Thrower Paneer</strong>, and <strong>Paneer Pataka</strong>.</p>
        <p>These are not background burgers. They enter the room first.</p>
      </ContentSection>

      <ContentSection title="The Aloo Tikki Situation">
        <p>Aloo tikki is one of the classic Indian burger foundations.</p>
        <p>Think crispy potato-style patty with Indian seasoning, layered into a bun with sauces, chutney, onions, cheese, and crunch. It is the kind of burger that feels familiar if you grew up around Indian street food, and dangerously interesting if you did not.</p>
        <p>The CheatMeals aloo burger family includes names like <strong>Aloo Anarkali</strong>, <strong>Aloo 420</strong>, <strong>Amdavadi Chaska 2.0</strong>, and <strong>Masala Aloo Tikki</strong>.</p>
        <p>Different moods. Same warning: one bite and regular burgers start looking underqualified.</p>
      </ContentSection>

      <ContentSection title="Paneer Enters the Chat">
        <p>Paneer burgers bring a heavier, richer bite.</p>
        <p>Paneer works beautifully in Indian fast food because it holds sauces, spice, and crunch like it was born for this job. At CheatMeals, paneer burgers can bring crispy patties, schezwan mayo, chilli sauce, jalapenos, pickled onions, crispy onions, cilantro, makhni-style flavours, and marble cheese depending on the item.</p>
        <p>Try names like <strong>King Kong Paneer</strong>, <strong>Hong Kong Paneer</strong>, <strong>Flame Thrower Paneer</strong>, or <strong>Paneer Pataka</strong> if you want your burger to show up with confidence.</p>
      </ContentSection>

      <ContentSection title="Chutney, Sauce, Crunch, Repeat">
        <p>The real magic of an Indian burger is the build.</p>
        <p>You get the bun, yes. But then comes the actual drama: chutneys, masala, house-style sauces, pickled onions, crispy onions, cilantro, jalapenos, shredded cheese, marble cheese, and patties that do more than just sit there.</p>
        <p>Regular mayo-based sauces contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering.</p>
        <p>A CheatMeals burger is built for people who want flavour from the first bite to the last corner of the wrapper.</p>
      </ContentSection>

      <ContentSection title="Try One in Regina">
        <p>CheatMeals is Regina’s home of Indian burgers, located at <strong>4306 Dewdney Avenue</strong>.</p>
        <p>Regular burgers had their chance. Time to meet the desi stack.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
