import React from 'react';
import { HomeScreen } from './components/site/HomeScreen.jsx';
import { MenuScreen } from './components/site/MenuScreen.jsx';
import { AboutScreen } from './components/site/AboutScreen.jsx';
import { TeamScreen } from './components/site/TeamScreen.jsx';
import { VisitScreen } from './components/site/VisitScreen.jsx';

/* Route code-splitting: the home page (the default route, '/') ships only the
   site screens above. The game, jokes, and admin screens — none of which the
   home page renders — load as their own chunks the first time those routes are
   visited (each route is a full page load, so the chunk is fetched once and
   then cached). This keeps the home page's initial JS small. */
const GameScreen = React.lazy(() =>
  import('./components/game/GameScreen.jsx').then((m) => ({ default: m.GameScreen }))
);
const JokesScreen = React.lazy(() =>
  import('./components/site/JokesScreen.jsx').then((m) => ({ default: m.JokesScreen }))
);
const AdminApp = React.lazy(() =>
  import('./components/admin/AdminScreens.jsx').then((m) => ({ default: m.AdminApp }))
);

function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

/* Spinner shown while a lazily-loaded route chunk is in flight — matches the
   boot loader so the hand-off is seamless. */
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

export default function App() {
  const mobile = useIsMobile();
  const path = window.location.pathname;

  /* '/' renders synchronously (no Suspense) from the statically imported site
     screens. The other routes are lazy, wrapped in one Suspense boundary. */
  if (!path.startsWith('/game') && !path.startsWith('/jokes') && !path.startsWith('/admin')) {
    return <SitePage mobile={mobile} />;
  }

  let page;
  if (path.startsWith('/game')) page = <div className="game-page"><GameScreen mobile={mobile} /></div>;
  else if (path.startsWith('/jokes')) page = <div className="jokes-page"><JokesScreen mobile={mobile} /></div>;
  else page = <div className="admin-page"><AdminApp mobile={mobile} /></div>;

  return <React.Suspense fallback={<RouteFallback />}>{page}</React.Suspense>;
}
