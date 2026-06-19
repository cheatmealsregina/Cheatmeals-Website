/* Registry of the standalone long-form content pages (search-targeted).
 *
 * Single CLIENT-side source of truth for: which paths are content pages
 * (renderKey in routeHead.js), each page's <head> metadata + display H1, the
 * curated internal-link tokens, and the FAQ data. The FAQ array feeds BOTH the
 * visible <Faq> block and the FAQPage JSON-LD (buildFaqSchema in routeHead.js),
 * so the structured data always matches the rendered answers.
 *
 * `links` are tokens resolved by LearnMore: 'menu' -> /#menu, 'call' -> the
 * Call-to-Order tel action (the Prompt-1 "Order Online" mapping), and a content
 * path -> that page (label from its navLabel). Every token resolves to a real,
 * built destination — no dead links.
 *
 * Metadata/headings/FAQ text are VERBATIM from docs/seo_pages.md (owner-
 * confirmed). The component for each path is wired in ContentRouter.jsx; the
 * build-time prerender + sitemap list lives in _reference/routes.mjs and must
 * carry the same paths. */
export const CONTENT_ROUTES = [
  {
    path: '/jain-swaminarayan-food-regina',
    navLabel: 'Jain & Swaminarayan Food in Regina',
    title: 'Jain & Swaminarayan Food in Regina | CheatMeals',
    description:
      'Find Jain, Swaminarayan and eggless Indian fast-food options at CheatMeals in Regina. Desi-style burgers, frankies and more.',
    heading: 'Jain & Swaminarayan Food in Regina',
    links: ['menu', 'call', '/vegetarian-burgers-regina', '/frankies-regina', '/about'],
    faq: [
      { q: 'Is CheatMeals Jain-friendly?', a: 'Yes. CheatMeals has a Restricted Space section with Jain options. On our menu, Jain means no egg, emulsifier, onion, potato, or garlic.' },
      { q: 'Do you make Swaminarayan food without onion and garlic?', a: 'Yes. The menu defines Swaminarayan items as having no egg, emulsifier, onion, or garlic.' },
      { q: 'Where can I get Jain fast food in Regina?', a: 'You can find Jain fast-food options at CheatMeals, located at 4306 Dewdney Avenue in Regina. Call 306-541-9198 before ordering if you want to confirm the best available options that day.' },
      { q: 'Do you avoid root vegetables in Jain items?', a: 'Yes. Jain items are defined as not containing egg, emulsifier, onion, potato, or garlic.' },
      { q: 'Are your sauces Jain or Swaminarayan-friendly?', a: 'Regular sauces are mayo-based and contain egg. For Jain and Swaminarayan food, CheatMeals uses eggless sauces.' },
      { q: 'Should I call before ordering Jain or Swaminarayan items?', a: 'Calling ahead is a smart move, especially for strict restrictions. Call CheatMeals at 306-541-9198.' },
    ],
  },
  {
    path: '/what-is-an-indian-burger',
    navLabel: 'What Is an Indian Burger?',
    title: 'What Is an Indian Burger? Aloo Tikki, Paneer & Desi Flavours | CheatMeals',
    description:
      'An Indian burger brings aloo tikki, paneer, chutneys, masala, sauces and street-food energy into a burger bun. Meet it at CheatMeals.',
    heading: 'What Is an Indian Burger?',
    links: ['menu', 'call', '/vegetarian-burgers-regina', '/paneer-burgers-regina', '/aloo-burgers-regina'],
    faq: [
      { q: 'What is an Indian burger?', a: 'An Indian burger is a burger built with Indian street-food-inspired flavours like aloo tikki, paneer, chutneys, masala, sauces, onions, cheese, and crunch.' },
      { q: 'What is an aloo tikki burger?', a: 'An aloo tikki burger uses a crispy potato-style patty seasoned with Indian flavours, usually layered with sauces, chutney, onions, cheese, and other toppings.' },
      { q: 'Are Indian burgers vegetarian?', a: 'Many Indian burgers are vegetarian, especially aloo tikki and paneer burgers. CheatMeals is vegetarian-forward and serves Indian-style vegetarian burger options.' },
      { q: 'What makes CheatMeals burgers different?', a: 'CheatMeals makes its own patties and builds burgers with Indian-style sauces, chutneys, spice, crunch, and bold menu combinations.' },
    ],
  },
  {
    path: '/vegetarian-burgers-regina',
    navLabel: 'Vegetarian Burgers in Regina',
    title: 'Vegetarian Burgers & Indian Fast Food in Regina | CheatMeals',
    description:
      'CheatMeals serves Indian-style vegetarian burgers, aloo patties, paneer burgers, frankies and loaded fries in Regina.',
    heading: 'Vegetarian Burgers & Indian Fast Food in Regina',
    links: ['menu', 'call', '/what-is-an-indian-burger', '/paneer-burgers-regina', '/frankies-regina', '/loaded-fries-regina'],
    faq: [
      { q: 'Where can I get vegetarian burgers in Regina?', a: 'You can get Indian-style vegetarian burgers at CheatMeals, located at 4306 Dewdney Avenue in Regina.' },
      { q: 'Does CheatMeals make Indian-style vegetarian burgers?', a: 'Yes. CheatMeals serves Indian-style vegetarian burger options with aloo patties, paneer patties, chutneys, sauces, cheese, onions, jalapenos, and masala flavours.' },
      { q: 'What is an aloo burger?', a: 'An aloo burger is an Indian-style burger built around a crispy potato-style patty, usually paired with chutneys, sauces, cheese, onions, and spice.' },
      { q: 'What is a paneer burger?', a: 'A paneer burger uses paneer as the main patty or filling, often paired with Indian-style sauces, chutneys, onions, cheese, and crunchy toppings.' },
      { q: 'Do burgers come with a side?', a: 'Yes. CheatMeals burgers are served with sides such as fries, chips, Doritos, or Cheetos depending on the menu item.' },
    ],
  },
  {
    path: '/about',
    navLabel: 'About CheatMeals',
    title: 'About CheatMeals — Home of Indian Burgers in Regina',
    description:
      'CheatMeals is Regina’s Home of Indian Burgers — built on desi flavours, house-made patties, street-food energy and serious cravings.',
    heading: 'About CheatMeals',
    links: ['menu', 'call', '/jain-swaminarayan-food-regina', '/what-is-an-indian-burger', '/vegetarian-burgers-regina'],
    faq: null,
  },
  {
    path: '/frankies-regina',
    navLabel: 'Indian Frankies in Regina',
    title: 'Indian Frankies in Regina | CheatMeals',
    description:
      'Craving Indian frankies in Regina? CheatMeals rolls paneer, aloo, sauces, chutneys, cheese and crunch into serious street-food wraps.',
    heading: 'Indian Frankies in Regina',
    links: ['menu', 'call', '/vegetarian-burgers-regina', '/indian-sandwiches-regina', '/loaded-fries-regina'],
    faq: [
      { q: 'Where can I get Indian frankies in Regina?', a: 'You can get Indian frankies at CheatMeals, located at 4306 Dewdney Avenue in Regina.' },
      { q: 'What is a Frankie?', a: 'A Frankie is an Indian street-food-style wrap, usually filled with saucy, spicy, crunchy ingredients and rolled into a filling handheld meal.' },
      { q: 'Does CheatMeals have paneer frankies?', a: 'Yes. CheatMeals has paneer frankie options such as Chilli Paneer Frankie, Schezwan Paneer, Paneer Lifafa, and OG Paneer Frankie.' },
      { q: 'Does CheatMeals have aloo frankies?', a: 'Yes. CheatMeals has aloo frankie options such as OG Aloo Frankie, Schezwan Aloo Frankie, and Achari Aloo Frankie.' },
      { q: 'Are frankies spicy?', a: 'Some frankies are spicier than others, especially schezwan or chilli-style options. Ask before ordering if you want to keep the heat controlled.' },
    ],
  },
  {
    path: '/indian-sandwiches-regina',
    navLabel: 'Indian Sand-Witches in Regina',
    title: 'Indian Sandwiches & Sand-Witches in Regina | CheatMeals',
    description:
      'CheatMeals serves Indian-style Sand-Witches in Regina — cheesy, spicy, saucy, grilled and slightly dangerous to boring sandwiches.',
    heading: 'Indian Sand-Witches in Regina',
    links: ['menu', 'call', '/frankies-regina', '/vegetarian-burgers-regina', '/jain-swaminarayan-food-regina'],
    faq: [
      { q: 'Where can I get Indian sandwiches in Regina?', a: 'You can get Indian-style sandwiches, called Sand-Witches, at CheatMeals on Dewdney Avenue in Regina.' },
      { q: 'What are CheatMeals Sand-Witches?', a: 'Sand-Witches are CheatMeals’ Indian-style sandwiches made with ingredients like cheese, chutney, garlic butter, sauces, pickled onions, green peppers, and chaat masala.' },
      { q: 'Are the sandwiches vegetarian?', a: 'Yes. The listed CheatMeals Sand-Witches are vegetarian options.' },
      { q: 'What is Cheese-Chutney?', a: 'Cheese-Chutney is an Indian-style sandwich combination built around cheese and spicy chutney.' },
      { q: 'Do you have grilled cheese?', a: 'Yes. CheatMeals has a Classic Grill Cheese Sand-Witch along with other cheesy Indian-style sandwich options.' },
    ],
  },
  {
    path: '/loaded-fries-regina',
    navLabel: 'Loaded Fries in Regina',
    title: 'Loaded Fries & Indian Chaska Fries in Regina | CheatMeals',
    description:
      'Loaded fries in Regina with Indian Chaska, Peri-Peri, Malai Makhni, Chilli Paneer and serious sauce energy at CheatMeals.',
    heading: 'Loaded Fries & Indian Chaska Fries in Regina',
    links: ['menu', 'call', '/vegetarian-burgers-regina', '/frankies-regina', '/paneer-burgers-regina'],
    faq: [
      { q: 'Where can I get loaded fries in Regina?', a: 'You can get loaded fries at CheatMeals in Regina, with options like Malai Makhni, Chilli Paneer, Peri-Peri, Indian Masala, and Chilli Garlic.' },
      { q: 'What are Indian Chaska fries?', a: 'Indian Chaska fries are seasoned fries with Indian-style snack flavour and spice energy.' },
      { q: 'Does CheatMeals have peri-peri fries?', a: 'Yes. CheatMeals has Peri-Peri fries and Peri-Peri dip options.' },
      { q: 'What dips does CheatMeals offer?', a: 'CheatMeals dip options include Roasted Garlic, Peri-Peri, Mint-Mayo, Schezwan, and CMS Classic.' },
      { q: 'Are loaded fries vegetarian?', a: 'Yes. The listed loaded fries are vegetarian options.' },
    ],
  },
  {
    path: '/paneer-burgers-regina',
    navLabel: 'Paneer Burgers in Regina',
    title: 'Paneer Burgers in Regina | CheatMeals',
    description:
      'Crispy paneer burgers in Regina with schezwan mayo, chilli sauce, pickled onions, cilantro and CheatMeals-level attitude.',
    heading: 'Paneer Burgers in Regina',
    links: ['menu', 'call', '/vegetarian-burgers-regina', '/what-is-an-indian-burger', '/loaded-fries-regina'],
    faq: [
      { q: 'Where can I get paneer burgers in Regina?', a: 'You can get paneer burgers at CheatMeals, located at 4306 Dewdney Avenue in Regina.' },
      { q: 'What is a paneer burger?', a: 'A paneer burger is an Indian-style burger built with paneer as the main patty or filling, usually paired with sauces, chutneys, onions, cheese, and spice.' },
      { q: 'Are paneer burgers spicy?', a: 'Some paneer burgers are spicy, especially options with schezwan, chilli sauce, jalapenos, or Flame Thrower-style flavours. Ask before ordering if you want a milder choice.' },
      { q: 'Do paneer burgers come with sides?', a: 'Yes. CheatMeals burgers come with sides such as fries, chips, Doritos, or Cheetos depending on the item.' },
      { q: 'Which paneer burger should I try first?', a: 'For bold flavour, try King Kong Paneer or Paneer Pataka. For heat, look at Flame Thrower Paneer or Crispy Schezwan. For creamy comfort, Paneer Makhni is a strong move.' },
    ],
  },
  {
    path: '/aloo-burgers-regina',
    navLabel: 'Aloo Tikki Burgers in Regina',
    title: 'Aloo Tikki Burgers in Regina | CheatMeals',
    description:
      'Aloo tikki burgers in Regina with spicy patties, chutneys, onions, sauces, cheese and Indian street-food crunch at CheatMeals.',
    heading: 'Aloo Tikki Burgers in Regina',
    links: ['menu', 'call', '/what-is-an-indian-burger', '/vegetarian-burgers-regina', '/paneer-burgers-regina', '/loaded-fries-regina'],
    faq: [
      { q: 'Where can I get aloo tikki burgers in Regina?', a: 'You can get aloo tikki burgers at CheatMeals, located at 4306 Dewdney Avenue in Regina.' },
      { q: 'What is an aloo tikki burger?', a: 'An aloo tikki burger is an Indian-style burger built around a crispy potato-style patty with sauces, chutneys, onions, cheese, and spice.' },
      { q: 'Does CheatMeals make its own patties?', a: 'Yes. CheatMeals makes its own patties.' },
      { q: 'Are aloo burgers spicy?', a: 'Some aloo burgers are spicy, especially options like Red Devil, Peri-Peri, or masala-heavy builds. Ask before ordering if you want a milder choice.' },
      { q: 'Do aloo burgers come with sides?', a: 'Yes. CheatMeals burgers come with sides such as fries, chips, Doritos, or Cheetos depending on the item.' },
    ],
  },
];

/* Trailing-slash-tolerant lookups (Vercel may serve /about or /about/). */
function norm(path) {
  return path && path.length > 1 ? path.replace(/\/+$/, '') : path;
}
export const CONTENT_PATHS = CONTENT_ROUTES.map((r) => r.path);
export function contentRouteFor(path) {
  const p = norm(path);
  return CONTENT_ROUTES.find((r) => r.path === p) || null;
}
export function isContentPath(path) {
  return CONTENT_PATHS.includes(norm(path));
}
