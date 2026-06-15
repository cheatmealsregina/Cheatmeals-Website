import React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import './styles/unify.css';
import './styles/v2.css';
import './styles/app.css';

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
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load design-system bundle: ' + DS_SRC));
    document.head.appendChild(s);
  });
}

/* Live data: replace window.CM_DATA with the Supabase-backed object
   before the app modules evaluate. On any failure (env missing, network
   down, timeout) the bundled public/scripts/data.js data stays in place —
   the site never renders empty. */
async function loadLiveData() {
  /* Cap the wait on live data. In production the read is a CDN-cached
     /api/bootstrap hit (usually tens of ms), so this only bites if both the
     edge cache and Supabase are unreachable — then we fall back to the bundled
     seed fast instead of staring at the boot spinner. */
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Supabase request timed out')), 2500)
  );
  const { loadAll } = await import('./lib/data.js');
  window.CM_DATA = await Promise.race([loadAll(), timeout]);
}

const root = document.getElementById('root');
root.innerHTML =
  '<div class="pt-boot" role="status" aria-label="Loading">' +
  '<span class="pt-boot__dot"></span><span class="pt-boot__dot"></span><span class="pt-boot__dot"></span>' +
  '</div>';

Promise.all([
  loadDS(),
  loadLiveData().catch((e) =>
    console.warn('[data] Supabase unreachable — falling back to bundled seed data.', e)
  ),
])
  .then(() => import('./App.jsx'))
  .then(({ default: App }) => {
    const ds = window.CheatMealsDesignSystem_e4e564;
    const errors = ds && ds.__errors;
    if (errors && errors.length) console.error('Design-system bundle errors:', errors);
    root.innerHTML = '';
    createRoot(root).render(<App />);
  })
  .catch((err) => {
    /* DS bundle 404, App import failure, etc. — never leave the user on a
       spinner. Tokens load via <link> so this still renders without the JS. */
    console.error('[boot] App failed to start:', err);
    root.innerHTML =
      '<div class="pt-boot" role="alert" style="gap:10px;padding:24px;text-align:center;">' +
      '<p style="font-family:var(--font-body,sans-serif);color:var(--color-text,#0a0a0a);font-size:18px;font-weight:600;margin:0;">Something went wrong.</p>' +
      '<p style="font-family:var(--font-body,sans-serif);color:var(--color-text,#0a0a0a);opacity:.7;font-size:14px;margin:0;">Please refresh the page to try again.</p>' +
      '</div>';
  });
