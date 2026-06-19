import React from 'react';
import { HomeScreen } from './components/site/HomeScreen.jsx';
import { MenuScreen } from './components/site/MenuScreen.jsx';
import { AboutScreen } from './components/site/AboutScreen.jsx';
import { TeamScreen } from './components/site/TeamScreen.jsx';
import { VisitScreen } from './components/site/VisitScreen.jsx';
import { applyRouteHead, renderKey } from './lib/routeHead.js';
import { useLiveData } from './lib/liveData.js';

/* Route code-splitting without React.lazy: the home page ('/') ships only the
   site screens imported above. The game, jokes and admin screens load as their
   own chunks via dynamic import in main.jsx, which preloads the matched route
   and passes the resolved component in as `routeComponent`. Doing the await in
   the boot step (rather than React.lazy) means the component is present
   synchronously at render time — so a prerendered /game or /jokes hydrates
   against real content instead of flashing a Suspense fallback. */

/* First render assumes mobile — the viewport the routes are prerendered at — so
   the client's first paint matches the static HTML and hydration is clean. The
   real viewport is applied on mount: mobile visitors (the priority) never
   change; a desktop visitor settles to the desktop layout in one post-hydration
   render. When booting without prerendered HTML (createRoot), start from the
   real width so there's no needless reflow. */
function useIsMobile(ssr) {
  const [mobile, setMobile] = React.useState(() =>
    ssr ? true : (typeof window !== 'undefined' ? window.innerWidth < 768 : true)
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

function RouteFallback() {
  return (
    <div className="pt-boot" role="status" aria-label="Loading">
      <span className="pt-boot__dot" /><span className="pt-boot__dot" /><span className="pt-boot__dot" />
    </div>
  );
}

function SitePage({ mobile }) {
  return (
    <div className="site-page">
      <HomeScreen mobile={mobile} />
      <MenuScreen mobile={mobile} showNav={false} />
      <AboutScreen mobile={mobile} showNav={false} />
      <TeamScreen mobile={mobile} showNav={false} />
      <VisitScreen mobile={mobile} showNav={false} />
    </div>
  );
}

export default function App({ routeComponent: RouteComponent = null, hydrating = false }) {
  const mobile = useIsMobile(hydrating);
  /* Re-render once live data has been merged into window.CM_DATA so the
     render-time reads in every screen pick up the live values. */
  useLiveData();
  const path = window.location.pathname;

  /* Give /game, /jokes and /admin their own title/description/canonical (and
     keep /admin out of search) — index.html's static head is home-only. */
  React.useEffect(() => { applyRouteHead(path); }, [path]);

  const key = renderKey(path);
  if (key === 'site') return <SitePage mobile={mobile} />;

  /* Non-site routes are rendered from the component preloaded by main.jsx.
     The fallback only shows if that preload was skipped (it never is in the
     normal boot path). */
  if (!RouteComponent) return <RouteFallback />;
  const cls =
    key === 'game' ? 'game-page'
    : key === 'jokes' ? 'jokes-page'
    : key === 'content' ? 'content-page'
    : 'admin-page';
  return <div className={cls}><RouteComponent mobile={mobile} /></div>;
}
