import React from 'react';
import { JainSwaminarayanPage } from './pages/JainSwaminarayanPage.jsx';
import { IndianBurgerPage } from './pages/IndianBurgerPage.jsx';
import { VegetarianBurgersPage } from './pages/VegetarianBurgersPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { FrankiesPage } from './pages/FrankiesPage.jsx';
import { IndianSandwichesPage } from './pages/IndianSandwichesPage.jsx';
import { LoadedFriesPage } from './pages/LoadedFriesPage.jsx';
import { PaneerBurgersPage } from './pages/PaneerBurgersPage.jsx';
import { AlooBurgersPage } from './pages/AlooBurgersPage.jsx';

/* Dispatcher for the content-page key. main.jsx preloads this one chunk for any
 * content route; it picks the page by pathname — matching how the prerender
 * navigated to that path, so hydration lines up. (renderKey already guaranteed
 * the path is a known content path before this renders.) */
const PAGES = {
  '/jain-swaminarayan-food-regina': JainSwaminarayanPage,
  '/what-is-an-indian-burger': IndianBurgerPage,
  '/vegetarian-burgers-regina': VegetarianBurgersPage,
  '/about': AboutPage,
  '/frankies-regina': FrankiesPage,
  '/indian-sandwiches-regina': IndianSandwichesPage,
  '/loaded-fries-regina': LoadedFriesPage,
  '/paneer-burgers-regina': PaneerBurgersPage,
  '/aloo-burgers-regina': AlooBurgersPage,
};

function norm(path) {
  return path && path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function ContentRouter({ mobile }) {
  const Page = PAGES[norm(window.location.pathname)] || null;
  return Page ? <Page mobile={mobile} /> : null;
}
