import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/jain-swaminarayan-food-regina');

export function JainSwaminarayanPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="Finding Jain, Swaminarayan, or eggless fast food in Regina should not feel like solving a mystery with a hungry stomach."
    >
      <p>At CheatMeals, our menu includes a <strong>Restricted Space</strong> section built for customers who want clear options without guessing what is hiding inside. Whether you are looking for no onion, no garlic, no egg, no emulsifier, or Jain-friendly choices without potato, we keep the definitions visible so you can order with confidence.</p>
      <p>We are located at <strong>4306 Dewdney Avenue, Regina</strong>, and you can call us at <strong>306-541-9198</strong> before ordering.</p>

      <ContentSection title="Restricted Space, But Not Restricted Flavour">
        <p>“Restricted” does not mean boring. Not here.</p>
        <p>The Restricted Space menu is for people who still want proper CheatMeals energy: Indian-style burgers, frankies, Sand-Witches, aloo and paneer-style options where available, sauces, crunch, and that full street-food mood.</p>
        <p>CheatMeals offers Jain, Swaminarayan, and eggless options through the Restricted Space section. Exact availability can still vary by item, so the best move is simple: tell us your restriction before you order, and we will guide you properly.</p>
      </ContentSection>

      <ContentSection title="What Jain Means on Our Menu">
        <p>On the CheatMeals menu, <strong>Jain</strong> means the product does not have:</p>
        <p className="cm-content__def">egg, emulsifier, onion, potato, or garlic.</p>
        <p>That means Jain items are made with stricter ingredient rules, especially around onion, garlic, and root vegetables like potato.</p>
        <p>For Jain orders, CheatMeals uses eggless sauces instead of regular mayo-based sauces. Regular mayo sauces contain egg, so please mention Jain clearly when ordering.</p>
      </ContentSection>

      <ContentSection title="What Swaminarayan Means on Our Menu">
        <p>On our menu, <strong>Swaminarayan</strong> means the product does not have:</p>
        <p className="cm-content__def">egg, emulsifier, onion, or garlic.</p>
        <p>So if you are looking for no onion and no garlic Indian fast food in Regina, this is the section to check first.</p>
        <p>For Swaminarayan orders, CheatMeals uses eggless sauces instead of regular mayo-based sauces. Say “Swaminarayan” before placing the order so the kitchen builds it correctly from the start.</p>
      </ContentSection>

      <ContentSection title="What Eggless Means at CheatMeals">
        <p>On the CheatMeals menu, <strong>eggless</strong> means the product does not contain egg or emulsifier.</p>
        <p>This is helpful for customers avoiding egg-based ingredients, but it does not automatically mean Jain or Swaminarayan. Eggless, Jain, and Swaminarayan are three different menu definitions.</p>
        <p>Tiny detail. Big difference. Your taste buds may not care, but your restrictions definitely do.</p>
      </ContentSection>

      <ContentSection title="How to Order Without Guessing">
        <p>The easiest way to order is simple: tell us your restriction clearly before placing the order.</p>
        <p>Say “Jain,” “Swaminarayan,” or “eggless” first, then ask which burgers, frankies, Sand-Witches, or other items are available that day.</p>
        <p>Regular sauces at CheatMeals are mayo-based and contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. So please mention your restriction before the order goes in, not after the burger is already halfway to glory.</p>
      </ContentSection>

      <ContentSection title="Visit CheatMeals on Dewdney Avenue">
        <p>CheatMeals is at <strong>4306 Dewdney Avenue in Regina</strong> — home of Indian burgers, loaded fries, frankies, Sand-Witches, and a Restricted Space that actually respects the assignment.</p>
        <p>Got restrictions? We’ve got a Restricted Space for that. Call before you roll in, then come hungry.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
