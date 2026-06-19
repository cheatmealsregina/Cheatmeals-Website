import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/frankies-regina');

export function FrankiesPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="A Frankie is not just a wrap."
    >
      <p>It is a full street-food situation rolled tight, sauced properly, and built to ruin boring lunches.</p>
      <p>At CheatMeals in Regina, our frankies bring paneer, aloo, chutneys, mayo, schezwan heat, cheese, crispy onions, jalapenos, Lays crunch, lemon squeeze, and that “one’s enough for most people” energy from the menu.</p>
      <p>Most people. Not all. We know some of you.</p>

      <ContentSection title="A Frankie Is Not Just a Wrap">
        <p>A regular wrap is often polite.</p>
        <p>A Frankie is not.</p>
        <p>A Frankie is warm, loaded, saucy, spicy, crunchy, and usually way more filling than it looks. It takes Indian street-food flavour and rolls it into something you can hold with both hands and a little bit of respect.</p>
        <p>At CheatMeals, frankies are made for serious cravings, not sad desk lunches.</p>
      </ContentSection>

      <ContentSection title="Paneer Frankies With Attitude">
        <p>Paneer frankies are where things get rich, saucy, and slightly dramatic.</p>
        <p>Menu options include <strong>Chilli Paneer Frankie</strong>, <strong>Schezwan Paneer</strong>, <strong>Paneer Lifafa</strong>, and <strong>OG Paneer Frankie</strong>.</p>
        <p>Depending on the item, you may find fillings and toppings like house veggie mix, ketchup x chutney, mint mayo, schezwan chutney, schezwan mayo, cheese x Lays, crispy onions, jalapenos, and a lemon squeeze.</p>
        <p>For Jain or Swaminarayan orders, mention your restriction clearly so eggless sauces can be used instead of regular mayo-based sauces.</p>
        <p>Paneer does not whisper in these wraps. It shows up ready.</p>
      </ContentSection>

      <ContentSection title="Aloo Frankies for Serious Cravings">
        <p>Aloo frankies bring that crispy, spicy, comfort-food feeling into wrap form.</p>
        <p>Look for options like <strong>OG Aloo Frankie</strong>, <strong>Schezwan Aloo Frankie</strong>, and <strong>Achari Aloo Frankie</strong>.</p>
        <p>You get the aloo base, the sauces, the chutneys, the crunch, the tang, and the kind of bite that makes you stop talking for a second. That is usually how you know the Frankie is working.</p>
      </ContentSection>

      <ContentSection title="One’s Enough. Usually.">
        <p>Our menu says: <strong>One’s enough for most people.</strong></p>
        <p>That is not a challenge, but some people will read it like one.</p>
        <p>Frankies are built to be filling. They are a full meal situation, especially when you pair them with fries, dips, or something from the rest of the menu because self-control left the chat.</p>
      </ContentSection>

      <ContentSection title="Order Frankies in Regina">
        <p>CheatMeals is located at <strong>4306 Dewdney Avenue in Regina</strong>.</p>
        <p>Roll up hungry. Leave with your wrap standards permanently ruined.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
