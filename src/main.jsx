import React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { renderKey } from './lib/routeHead.js';
import { bumpDataVersion } from './lib/liveData.js';
import './styles/unify.css';
import './styles/v2.css';
import './styles/app.css';
import './styles/content.css';

/* The design-system bundle (public/_ds/.../_ds_bundle.js) references the
   global React — some components (Icon) at definition time. Expose the
   app's React instance first, then load the bundle, then import the app
   (dynamic import so component modules see the populated DS namespace). */
window.React = React;
window.ReactDOM = ReactDOM;

const DS_SRC = '/_ds/cheatmeals-design-system-e4e5642f-825c-4537-9486-cbc4230dd10b/_ds_bundle.js';

function loadDS() {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = DS_SRC;
    /* Watchdog: a stalled request (hung TCP connect, captive portal) may never
       fire onload/onerror, which would leave the boot Promise unsettled and
       strand the user. Reject after 8s so the boot catch can react. */
    const timer = setTimeout(
      () => reject(new Error('Design-system bundle load timed out: ' + DS_SRC)),
      8000
    );
    s.onload = () => { clearTimeout(timer); resolve(); };
    s.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Failed to load design-system bundle: ' + DS_SRC));
    };
    document.head.appendChild(s);
  });
}

/* Preload the chunk for the matched route so its component is available
   synchronously when we (hydrate-)render — no Suspense fallback over the
   prerendered content. The home route ('site') needs nothing extra: App
   imports the site screens statically. */
async function loadRouteComponent(key) {
  if (key === 'game') return (await import('./components/game/GameScreen.jsx')).GameScreen;
  if (key === 'jokes') return (await import('./components/site/JokesScreen.jsx')).JokesScreen;
  if (key === 'admin') return (await import('./components/admin/AdminScreens.jsx')).AdminApp;
  if (key === 'content') return (await import('./components/content/ContentRouter.jsx')).ContentRouter;
  return null;
}

/* Upgrade the bundled seed to live data AFTER the first (hydrating) render.
   Rendering from the seed first is what lets the client's first paint match the
   prerendered HTML; here we merge live data ONTO the same window.CM_DATA object
   every screen already holds, then bump the live-data store to re-render. On
   any failure (env missing, offline, timeout) the seed simply stays. */
async function upgradeToLive() {
  try {
    const { loadAll } = await import('./lib/data.js');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out')), 2500)
    );
    const live = await Promise.race([loadAll(), timeout]);
    if (live && typeof live === 'object') {
      Object.assign(window.CM_DATA, live); // mutate in place — screens hold this ref
      bumpDataVersion();
    }
  } catch (e) {
    console.warn('[data] live read failed — keeping bundled seed.', e);
  }
}

const root = document.getElementById('root');
const path = window.location.pathname;
const key = renderKey(path);

/* Hydrate only when the served HTML was prerendered for THIS layout. The
   prerender step stamps <html data-prerendered="site|game|jokes">; if it
   matches the current route and there's real content in #root, attach to it.
   Otherwise (admin, an un-prerendered path that fell back to the SPA shell, dev
   server, or a failed prerender) client-render from scratch. */
const prerenderedFor = document.documentElement.getAttribute('data-prerendered');
const canHydrate = !!prerenderedFor && prerenderedFor === key && !!root.firstElementChild;

const BOOT_DOTS =
  '<div class="pt-boot" role="status" aria-label="Loading">' +
  '<span class="pt-boot__dot"></span><span class="pt-boot__dot"></span><span class="pt-boot__dot"></span>' +
  '</div>';

/* When hydrating, leave the prerendered content on screen (it's already the
   right page). Otherwise show the boot loader until the first render. */
if (!canHydrate) root.innerHTML = BOOT_DOTS;

async function boot() {
  await loadDS();
  const RouteComponent = await loadRouteComponent(key);
  const { default: App } = await import('./App.jsx');

  const ds = window.CheatMealsDesignSystem_e4e564;
  if (ds && ds.__errors && ds.__errors.length) console.error('Design-system bundle errors:', ds.__errors);

  /* Analytics (page views) + Speed Insights (real-user Core Web Vitals) are
     Vercel-native: they post to /_vercel/* only on the production deployment
     and no-op on localhost/preview. */
  const tree = (
    <>
      <App routeComponent={RouteComponent} hydrating={canHydrate} />
      <Analytics />
      <SpeedInsights />
    </>
  );

  if (canHydrate) {
    hydrateRoot(root, tree);
  } else {
    root.innerHTML = '';
    createRoot(root).render(tree);
  }

  upgradeToLive();
}

boot().catch((err) => {
  /* DS bundle 404, App import failure, etc. If we have prerendered content on
     screen, keep it — a non-interactive but fully readable page beats an error
     card. Otherwise show the graceful error (tokens load via <link>, so this
     still renders without the app JS). */
  console.error('[boot] App failed to start:', err);
  if (canHydrate && root.firstElementChild) return;
  root.innerHTML =
    '<div class="pt-boot" role="alert" style="gap:10px;padding:24px;text-align:center;">' +
    '<p style="font-family:var(--font-body,sans-serif);color:var(--color-text,#0a0a0a);font-size:18px;font-weight:600;margin:0;">Something went wrong.</p>' +
    '<p style="font-family:var(--font-body,sans-serif);color:var(--color-text,#0a0a0a);opacity:.7;font-size:14px;margin:0;">Please refresh the page to try again.</p>' +
    '</div>';
});
