// Single source of truth for the full CheatMeals menu, transcribed from the
// 7th June 2026 menu PDF. Feeds both apply-menu.mjs (pushes to Supabase via
// the service-role key) and gen-seed.mjs (regenerates supabase/seed.sql).
//
// Badge legend (matches the PDF icons): chef-hat -> Chef's Pick;
// one chilli -> Spicy (level 1); two chillis -> Extra Spicy (level 2).
// Dietary categories carry a diet badge naming the diet.

export const pick = { kind: 'pick', label: "Chef's Pick" };
export const spicy1 = { kind: 'spicy', level: 1, label: 'Spicy' };
export const spicy2 = { kind: 'spicy', level: 2, label: 'Extra Spicy' };
export const eggless = { kind: 'diet', label: 'Eggless' };
export const jain = { kind: 'diet', label: 'Jain' };
export const swami = { kind: 'diet', label: 'Swaminarayan' };

const PATTIES_NOTE =
  'We make our own patties. All burgers are served with a side of fries, chips, Doritos, or Cheetos.';

// Categories — slugs already exist in the live DB; notes/sort upserted too.
export const CATEGORIES = [
  { name: 'Aloo Burgers',   slug: 'aloo-burgers',   sort: 1, note: PATTIES_NOTE, dietary: false },
  { name: 'Paneer Burgers', slug: 'paneer-burgers', sort: 2, note: PATTIES_NOTE, dietary: false },
  { name: 'Frankies',       slug: 'frankies',       sort: 3, note: "Honest advice: one's enough for most people", dietary: false },
  { name: 'Sand-Witches',   slug: 'sand-witches',   sort: 4, note: "It's not actual witchcraft, but it will possess you", dietary: false },
  { name: 'Pavs',           slug: 'pavs',           sort: 5, note: null, dietary: false },
  { name: 'Loaded Fries',   slug: 'loaded-fries',   sort: 6, note: 'Matches your taste better than your ex', dietary: false },
  { name: 'Seasoned Fries', slug: 'seasoned-fries', sort: 7, note: null, dietary: false },
  { name: 'Add-Ons & Dips', slug: 'add-ons-dips',   sort: 8, note: null, dietary: false },
  { name: 'Eggless',        slug: 'eggless',        sort: 9, note: 'For softhearted foodies', dietary: true },
  { name: 'Jain',           slug: 'jain',          sort: 10, note: 'No root vegetables, no onion, no garlic', dietary: true },
  { name: 'Swaminarayan',   slug: 'swaminarayan',  sort: 11, note: 'No onion, no garlic — Swaminarayan friendly', dietary: true },
];

// Placeholder items from the original seed that are NOT on the printed menu.
// Removed so each category matches the PDF exactly.
export const REMOVE = [
  { slug: 'frankies', names: ['Paneer Frankie', 'Aloo Frankie', 'Schezwan Paneer Frankie'] },
  { slug: 'jain', names: ['Jain Paneer Burger', 'Jain Pav', 'Jain Cheese Frankie'] },
];

// Items per category slug. `section` is the full sub-section display name for
// the sectioned burger categories (rendered verbatim, first word in brand red);
// every other category is a flat list (section null).
export const MENU = {
  'aloo-burgers': [
    { section: 'Double Patty', name: 'The Red Hulk', price: 14.99, badges: [pick, spicy1], description: 'Double aloo patty, double cheese, schezwan chutney and mayo, cilantro, onions and jalapenos' },
    { section: 'Spicy Aloo', name: 'Aloo Anarkali', price: 12.99, badges: [pick, spicy1], description: 'Spicy potato patty, cilantro, crispy onions, sriracha drizzle, roasted garlic, mayo, jalapenos, pickled onions and marble cheese' },
    { section: 'Spicy Aloo', name: 'Aloo 420', price: 11.99, badges: [], description: 'Saucy affair of schezwan and garlic mayo, cilantro, minty and spicy aloo patty, onions, jalapenos, marble cheese' },
    { section: 'Spicy Aloo', name: 'Amdavadi Chaska 2.0', price: 11.99, badges: [], description: 'Spicy aloo patty, caramalised onion masala, hint of pickled onions, signature burger sauce, marble cheese' },
    { section: 'Spicy Aloo', name: 'Masala Aloo Tikki', price: 10.99, badges: [spicy1], description: 'Spicy aloo patty, signature burger sauce, pickled onions, cilantro, marble cheese' },
    { section: 'Spicy Aloo', name: 'Achari Aloo', price: 9.99, badges: [], description: 'Spicy aloo patty, cilantro, pickled onions, crispy chips, mint mayo, marble cheese' },
    { section: 'Aloo', name: 'Red Devil', price: 12.99, badges: [spicy2], description: 'Aloo patty, schezwan chutney with sriracha, schezwan mayo, jalapenos, onions, cilantro, crispy onions, marble cheese' },
    { section: 'Aloo', name: 'Veggie Delight', price: 11.99, badges: [], description: 'Aloo patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce and marble cheese' },
    { section: 'Aloo', name: 'Schezwan Aloo Tikki', price: 10.99, badges: [pick, spicy1], description: 'Aloo patty, pickled onions, jalapenos, marble cheese, schezwan mayo' },
    { section: 'Aloo', name: 'Aloo Makhni', price: 10.99, badges: [], description: 'Aloo patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese' },
    { section: 'Aloo', name: 'Amdavadi Chaska', price: 10.99, badges: [pick], description: 'Aloo patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese' },
    { section: 'Aloo', name: 'Peri-Peri', price: 10.99, badges: [], description: 'Aloo patty, cilantro, jalapenos, pickled onions, olives, peri peri masala, peri peri mayo, marble cheese' },
    { section: 'Aloo', name: 'Aloo Tikki', price: 9.99, badges: [], description: 'Aloo patty, signature burger sauce, pickled onions, cilantro, marble cheese' },
  ],
  'paneer-burgers': [
    { section: 'Double Patty', name: 'King Kong Paneer', price: 14.99, badges: [pick], description: 'Double paneer patties tossed in chilli sauce, crispy onions and cilantro, marble cheese, schezwan mayo, jalapenos, pickled onions' },
    { section: 'Paneer', name: 'Hong Kong Paneer', price: 12.99, badges: [], description: 'Paneer patty tossed in chilli sauce, crispy onions and cilantro, marble cheese, schezwan mayo, jalapenos, pickled onions' },
    { section: 'Paneer', name: 'Flame Thrower Paneer', price: 12.99, badges: [pick, spicy1], description: 'Crispy paneer patty, schezwan chutney with sriracha, schezwan mayo, jalapenos, onions, cilantro, crispy onions, marble cheese' },
    { section: 'Paneer', name: 'Paneer Pataka', price: 12.99, badges: [pick], description: 'Crispy paneer patty, cilantro, crispy onions, sriracha drizzle, roasted garlic mayo, jalapenos, pickled onions, marble cheese' },
    { section: 'Paneer', name: 'Paneer Chaska', price: 12.99, badges: [], description: 'Crispy paneer patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese' },
    { section: 'Paneer', name: 'Veggie Paneer Delight', price: 12.99, badges: [], description: 'Crispy paneer patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce, marble cheese' },
    { section: 'Paneer', name: 'Paneer Makhni', price: 11.99, badges: [], description: 'Crispy paneer patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese' },
    { section: 'Paneer', name: 'Crispy Schezwan', price: 11.99, badges: [spicy1], description: 'Crispy paneer patty, pickled onions, jalapenos, marble cheese, schezwan mayo' },
  ],
  frankies: [
    { name: 'Chilli Paneer Frankie', price: 12.99, badges: [pick], description: 'Classic indo-chinese paneer chilli in a wrap' },
    { name: 'Schezwan Paneer', price: 12.99, badges: [], description: 'Pahadi paneer masala, house veggie mix, schezwan sauce, cheese X lays' },
    { name: 'Paneer Lifafa', price: 12.99, badges: [pick, spicy1], description: 'Paneer patty, house veggie mix, garlic sauce, sriracha drizzle, cheese X lays, crispy onions, hint of jalapenos' },
    { name: 'OG Paneer Frankie', price: 12.99, badges: [spicy1], description: 'Paneer patty, house veggie mix, schezwan chutney, schezwan mayo, cheese X lays' },
    { name: 'OG Aloo Frankie', price: 11.99, badges: [pick], description: 'Aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays' },
    { name: 'Schezwan Aloo Frankie', price: 11.99, badges: [], description: 'Aloo patty, house veggie mix, schezwan chutney, schezwan mayo, cheese X lays' },
    { name: 'Achari Aloo Frankie', price: 11.99, badges: [], description: 'Spicy aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays, squeeze of lemon' },
  ],
  'sand-witches': [
    { name: 'Junglee Paneer', price: 12.99, badges: [], description: 'Paneer smothered with tandoori and schezwan sauce along with pickled onion and green pepper and marble cheese' },
    { name: 'Cheese Chilli Garlic', price: 12.99, badges: [pick, spicy1], description: 'Our twist to ghughra sandwich' },
    { name: 'Cheese Chilli Onion', price: 11.99, badges: [], description: 'Tribute to the famous Hughes sandwich' },
    { name: 'Classic Grill Cheese', price: 9.99, badges: [], description: 'With a twist: garlic butter, marble cheese and chat masala' },
    { name: 'Cheese-Chutney', price: 9.99, badges: [pick], description: 'Our in-house spicy chutney with marble cheese!' },
  ],
  pavs: [
    { name: 'Pahadi Paneer', price: 12.99, badges: [pick], description: 'Marinated paneer in our secret sauce with marble cheese, schezwan and tandoori sauce' },
    { name: 'CMS2', price: 10.99, badges: [], description: 'Pav stuffed with our secret onion masala, with marble cheese and sweet-chilly mayo' },
    { name: 'Peri-Peri', price: 10.99, badges: [], description: 'Stuffed with peri-peri sauce, pickled onions, jalapenos, marble cheese and herbs' },
    { name: 'CMS', price: 9.99, badges: [pick], description: "Trust your taste buds — they won't fail you!" },
    { name: 'Garlic Pav', price: 8.99, badges: [], description: 'Pav roasted with garlic butter stuffed with marble cheese, mayonnaise and herbs' },
  ],
  'loaded-fries': [
    { name: 'Malai Makhni', price: 12.99, badges: [], description: "Let's keep that a secret" },
    { name: 'Chilli Paneer', price: 12.99, badges: [], description: 'Fries mixed in marinated chilli paneer, cilantro, mayo and cheese' },
    { name: 'Peri-Peri', price: 10.99, badges: [], description: 'Peri-peri sauce, cheese, olives, jalapenos, onions' },
    { name: 'Indian Masala', price: 10.99, badges: [pick, spicy1], description: 'Caramalised onion masala, Indian seasoning, cheese, mint sauce' },
    { name: 'Chilli Garlic', price: 10.99, badges: [pick], description: 'Fries mixed in chilli garlic butter, cilantro, mayo and cheese' },
  ],
  'seasoned-fries': [
    { name: 'Peri-Peri', price: 5.99, badges: [pick], description: "Please don't ask, it is what the name says" },
    { name: 'Indian Chaska', price: 5.99, badges: [pick, spicy1], description: 'We take our fries seriously, try it before asking.' },
    { name: 'Salt and Pepper', price: 4.99, badges: [], description: 'Name says it all, no catch' },
  ],
  'add-ons-dips': [
    { name: 'Extra Sauce', price: 0.99, badges: [], description: null },
    { name: 'Extra Cheese', price: 0.99, badges: [], description: null },
    { name: 'Extra Fries', price: null, badges: [], description: "Not an option — won't fit in the box" },
    { name: 'Peri-Peri Fries Upgrade', price: 1.5, badges: [], description: 'Upgrade your side to peri-peri fries — also includes a dip of your choice' },
    { name: 'Indian Chaska Upgrade', price: 1.5, badges: [], description: 'Upgrade your side to Indian Chaska fries — also includes a dip of your choice' },
    { name: 'Roasted Garlic Dip', price: 1.49, badges: [pick], description: null },
    { name: 'Peri-Peri Dip', price: 0.99, badges: [], description: null },
    { name: 'Mint-Mayo Dip', price: 0.99, badges: [pick], description: null },
    { name: 'Schezwan Dip', price: 0.99, badges: [], description: null },
    { name: 'CMS Classic Dip', price: 0.99, badges: [], description: null },
  ],
  // ---- dietary menus (pages 7-8) — flat curated lists, diet-badged ----
  eggless: [
    { name: 'Paneer Chaska', price: 12.99, badges: [eggless], description: 'Crispy paneer patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese' },
    { name: 'Veggie Paneer Delight', price: 12.99, badges: [eggless], description: 'Crispy paneer patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce, marble cheese' },
    { name: 'Paneer Makhani', price: 11.99, badges: [eggless], description: 'Crispy paneer patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese' },
    { name: 'Amdavadi Chaska', price: 11.99, badges: [eggless], description: 'Aloo patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese' },
    { name: 'Veggie Delight', price: 11.99, badges: [eggless], description: 'Aloo patty, cilantro, jalapenos, pickled onions, olives, available veggies, signature burger sauce and marble cheese' },
    { name: 'Aloo Tikki', price: 11.99, badges: [eggless], description: 'Aloo patty, caramalised onion masala, hint of pickled onions, mint mayo, marble cheese' },
    { name: 'Aloo Makhani', price: 10.99, badges: [eggless], description: 'Aloo patty, onions, cilantro, cream, makhni gravy, crispy onions, green peppers, marble cheese' },
    { name: 'Amdavadi Chaska 2.0', price: 11.99, badges: [eggless], description: 'Spicy aloo patty, caramalised onion masala, hint of pickled onions, signature burger sauce, marble cheese' },
    { name: 'Achari Aloo', price: 11.99, badges: [eggless], description: 'Spicy aloo patty, cilantro, pickled onions, crispy chips, mint mayo, marble cheese' },
    { name: 'Cheese Chilli Garlic', price: 12.99, badges: [pick, spicy1, eggless], description: 'Our twist to ghughra sandwich' },
    { name: 'Cheese Chilli Onion', price: 11.99, badges: [eggless], description: 'Tribute to the famous Hughes sandwich' },
    { name: 'Classic Grill Cheese', price: 9.99, badges: [eggless], description: 'With a twist: garlic butter, marble cheese and chat masala' },
    { name: 'Cheese-Chutney', price: 9.99, badges: [eggless], description: 'Our in-house spicy chutney with marble cheese!' },
    { name: 'OG Aloo Frankie', price: 12.99, badges: [eggless], description: 'Aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays' },
    { name: 'Achari Aloo Frankie', price: 12.99, badges: [eggless], description: 'Spicy aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays, squeeze of lemon' },
    { name: 'Malai Makhni', price: 12.99, badges: [eggless], description: "Let's keep that a secret" },
    { name: 'Indian Masala', price: 11.99, badges: [pick, spicy1, eggless], description: 'Caramalised onion masala, Indian seasoning, cheese, mint sauce' },
    { name: 'Indian Chaska', price: 5.99, badges: [pick, spicy1, eggless], description: 'We take our fries seriously, try it before asking.' },
    { name: 'Salt and Pepper', price: 4.99, badges: [eggless], description: 'Name says it all, no catch' },
  ],
  jain: [
    { name: 'Classic Grill Cheese', price: 12.99, badges: [jain], description: 'With a twist: butter, marble cheese and chat masala' },
    { name: 'Cheese Chutney', price: 12.99, badges: [jain], description: 'Our in-house spicy chutney with marble cheese!' },
    { name: 'Paneer Chaska', price: 12.99, badges: [jain], description: 'Crispy paneer patty, mint mayo, marble cheese' },
    { name: 'Veggie Paneer Delight', price: 12.99, badges: [jain], description: 'Crispy paneer patty, cilantro, jalapenos, olives, available veggies, signature burger sauce, marble cheese' },
    { name: 'Paneer Makhani', price: 11.99, badges: [jain], description: 'Crispy paneer patty, cilantro, cream, makhni gravy, green peppers, marble cheese' },
    { name: 'SP. Jain Frankie', price: 12.99, badges: [jain], description: "You won't know the difference. Same taste — unique ingredients" },
  ],
  swaminarayan: [
    { name: 'Classic Grill Cheese', price: 12.99, badges: [swami], description: 'With a twist: butter, marble cheese and chat masala' },
    { name: 'Cheese Chutney', price: 12.99, badges: [swami], description: 'Our in-house spicy chutney with marble cheese!' },
    { name: 'Paneer Chaska', price: 12.99, badges: [swami], description: 'Crispy paneer patty, onions, mint mayo, marble cheese' },
    { name: 'Veggie Paneer Delight', price: 12.99, badges: [swami], description: 'Crispy paneer patty, cilantro, jalapenos, olives, available veggies, marble cheese' },
    { name: 'Paneer Makhani', price: 11.99, badges: [swami], description: 'Crispy paneer patty, onions, cilantro, cream, makhni gravy, green peppers, marble cheese' },
    { name: 'Amdavadi Chaska', price: 11.99, badges: [swami], description: 'Aloo patty, mint mayo, marble cheese' },
    { name: 'Veggie Delight', price: 11.99, badges: [swami], description: 'Aloo patty, cilantro, jalapenos, olives, available veggies, signature burger sauce and marble cheese' },
    { name: 'Aloo Tikki', price: 11.99, badges: [swami], description: 'Aloo patty, mint mayo, marble cheese' },
    { name: 'Aloo Makhani', price: 10.99, badges: [swami], description: 'Aloo patty, cilantro, cream, makhni gravy, green peppers, marble cheese' },
    { name: 'OG Aloo Frankie', price: 12.99, badges: [swami], description: 'Aloo patty, house veggie mix, ketchup X chutney, mint mayo, cheese X lays' },
    { name: 'SP. Paneer Frankie', price: 12.99, badges: [swami], description: "Trust the name, it's actually special" },
  ],
};
