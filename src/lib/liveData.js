import React from 'react';

/* Live-data refresh seam for the prerender/hydration flow.
 *
 * Every screen reads its content from the module-captured `window.CM_DATA`
 * reference (e.g. `const data = window.CM_DATA`). The boot flow renders first
 * from the bundled seed (so the client's first paint matches the prerendered
 * HTML and hydration is clean), then fetches live data and MERGES IT IN PLACE
 * onto that same object (`Object.assign(window.CM_DATA, live)`) so every held
 * reference now points at live fields. Calling bumpDataVersion() then nudges
 * this store, re-rendering the tree so those render-time reads pick up the
 * live values — no per-component data plumbing required. */

let version = 0;
const listeners = new Set();

export function bumpDataVersion() {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return version;
}

/* Subscribe a component to live-data refreshes. The App root calls this so the
   whole tree re-renders once live data has been merged into window.CM_DATA. */
export function useLiveData() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
