import React from 'react';
import { ContentPage, ContentSection, ContentCta, Faq } from '../ContentPage.jsx';
import { contentRouteFor } from '../../../lib/contentRoutes.js';

const route = contentRouteFor('/vegetarian-burgers-regina');

export function VegetarianBurgersPage({ mobile }) {
  return (
    <ContentPage
      mobile={mobile}
      currentPath={route.path}
      heading={route.heading}
      lead="Vegetarian burgers should not feel like the backup plan."
    >
      <p>At CheatMeals in Regina, they are the main event: crispy aloo patties, paneer burgers, chutneys, sauces, cheese, onions, jalapenos, and enough Indian street-food energy to make boring lunches nervous.</p>
      <p>We are a vegetarian-forward Indian fast-food spot in Regina, built around Indian-style burgers, frankies, Sand-Witches, pavs, loaded fries, dips, and proper desi cravings.</p>

      <ContentSection title="Vegetarian Burgers That Don’t Act Like Side Quests">
        <p>Some places treat vegetarian food like an apology.</p>
        <p>We do not.</p>
        <p>CheatMeals burgers are built to be loud, saucy, crunchy, and properly filling. The menu brings Indian-style burger families with aloo patties, paneer patties, house sauces, chutneys, shredded cheese, marble cheese, pickled onions, crispy onions, cilantro, jalapenos, and masala-heavy attitude.</p>
        <p>We make our own patties, because the patty is not decoration. It is the whole point.</p>
      </ContentSection>

      <ContentSection title="Aloo Patties: The Crispy Classic">
        <p>Aloo burgers are a street-food classic for a reason.</p>
        <p>They bring comfort, crunch, spice, and that familiar desi snack feeling inside a burger bun. At CheatMeals, aloo-style options include names like <strong>The Red Hulk</strong>, <strong>Aloo Anarkali</strong>, <strong>Aloo 420</strong>, <strong>Amdavadi Chaska 2.0</strong>, and <strong>Masala Aloo Tikki</strong>.</p>
        <p>These are the burgers for people who want something crispy, saucy, and full of flavour without needing a lecture from the menu.</p>
      </ContentSection>

      <ContentSection title="Paneer Patties: The Heavy Hitters">
        <p>Paneer burgers are for the serious craving crowd.</p>
        <p>They bring a richer bite and hold up beautifully with schezwan mayo, chilli sauce, makhni-style flavours, pickled onions, crispy onions, jalapenos, cilantro, and cheese.</p>
        <p>Regular mayo-based sauces contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces. Mention the restriction clearly when ordering.</p>
        <p>Look for options like <strong>King Kong Paneer</strong>, <strong>Hong Kong Paneer</strong>, <strong>Flame Thrower Paneer</strong>, <strong>Paneer Pataka</strong>, <strong>Paneer Chaska</strong>, and <strong>Paneer Makhni</strong>.</p>
        <p>Paneer people know. Everyone else finds out quickly.</p>
      </ContentSection>

      <ContentSection title="Sides Come Along for the Ride">
        <p>CheatMeals burgers come with a side, because a burger walking alone is suspicious.</p>
        <p>Depending on the option, burgers may be served with fries, chips, Doritos, or Cheetos. That means your burger gets a crunchy sidekick instead of a sad empty plate.</p>
        <p>And once you are in the menu, the craving can easily wander into frankies, pavs, loaded fries, dips, and Sand-Witches.</p>
        <p>We warned you. The menu has range.</p>
      </ContentSection>

      <ContentSection title="Find Us on Dewdney Avenue">
        <p>CheatMeals is located at <strong>4306 Dewdney Avenue in Regina</strong>.</p>
        <p>Bring the craving. We’ll bring the crunch.</p>
      </ContentSection>

      <ContentCta />
      <Faq title="FAQ" items={route.faq} />
    </ContentPage>
  );
}
