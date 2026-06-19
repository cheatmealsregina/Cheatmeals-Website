import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/loaded-fries-regina');

export function LoadedFriesPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="At CheatMeals, fries are not an afterthought."
    >
      <p>They are not just there to fill the tray and behave quietly. Our fries come seasoned, loaded, sauced, dipped, mixed, and fully prepared to steal attention from the burger.</p>
      <p>The menu says it clearly: <strong>We take our fries seriously, try it before asking.</strong></p>
      <p>Fair warning.</p>

      <ContentSection title="Fries That Refuse to Stay Basic">
        <p>Basic fries have their place.</p>
        <p>That place is not always here.</p>
        <p>CheatMeals fries come in seasoned and loaded styles, with Indian-inspired flavours, sauce energy, and dips that make dry fries feel like a personal mistake.</p>
        <p>Whether you want something simple like Salt and Pepper or something fully loaded with paneer, makhni-style sauce, or chilli garlic flavour, there is a fry mood waiting.</p>
      </ContentSection>

      <ContentSection title="Loaded Fries: Mix Well Before Digging In">
        <p>The menu gives expert advice: <strong>mix well before digging in.</strong></p>
        <p>Listen to the menu.</p>
        <p>Loaded fries need the proper scoop. You want fries, sauce, toppings, and seasoning all in the same bite. That is where the situation becomes serious.</p>
        <p>Loaded fry options include <strong>Malai Makhni</strong>, <strong>Chilli Paneer</strong>, <strong>Peri-Peri</strong>, <strong>Indian Masala</strong>, and <strong>Chilli Garlic</strong>.</p>
        <p>Creamy, spicy, saucy, crunchy, messy in the right way. This is not background food.</p>
      </ContentSection>

      <ContentSection title="Seasoned Fries for the Side-Quest Crowd">
        <p>Not every fry order needs to be fully loaded.</p>
        <p>Sometimes you just want seasoned fries that know what they are doing. CheatMeals seasoned fries include <strong>Peri-Peri</strong>, <strong>Indian Chaska</strong>, and <strong>Salt and Pepper</strong>.</p>
        <p>Indian Chaska fries bring that desi snack-style seasoning mood. Peri-Peri fries bring the heat. Salt and Pepper keeps it simple without becoming boring.</p>
      </ContentSection>

      <ContentSection title="Dips, Because Dry Fries Are a Crime">
        <p>A good dip can change the whole order.</p>
        <p>CheatMeals dip options include <strong>Roasted Garlic</strong>, <strong>Peri-Peri</strong>, <strong>Mint-Mayo</strong>, <strong>Schezwan</strong>, and <strong>CMS Classic</strong>.</p>
        <p>Regular dips and sauces are mayo-based and contain egg. For Jain and Swaminarayan orders, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering so the sauce situation behaves itself.</p>
        <p>Choose carefully. Or do what the sauce people do and over-order with confidence.</p>
      </ContentSection>

      <ContentSection title="Loaded Fries in Regina">
        <p>CheatMeals is serving loaded fries, Indian Chaska fries, Peri-Peri fries, and serious dip energy in Regina.</p>
        <p>Come for the burger. Accidentally fall in love with the fries. It happens.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
