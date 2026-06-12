import React from 'react';
import { HomeScreen } from './components/site/HomeScreen.jsx';
import { MenuScreen } from './components/site/MenuScreen.jsx';
import { AboutScreen } from './components/site/AboutScreen.jsx';
import { TeamScreen } from './components/site/TeamScreen.jsx';
import { VisitScreen } from './components/site/VisitScreen.jsx';
import { GameScreen } from './components/game/GameScreen.jsx';
import { AdminLogin, AdminEditor } from './components/admin/AdminScreens.jsx';

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

function GamePage({ mobile }) {
  return (
    <div className="game-page">
      <GameScreen mobile={mobile} />
    </div>
  );
}

function AdminPage({ mobile }) {
  return (
    <div className="admin-page">
      <AdminLogin mobile={mobile} />
      <AdminEditor mobile={mobile} />
    </div>
  );
}

export default function App() {
  const mobile = useIsMobile();
  const path = window.location.pathname;

  if (path.startsWith('/game')) return <GamePage mobile={mobile} />;
  if (path.startsWith('/admin')) return <AdminPage mobile={mobile} />;
  return <SitePage mobile={mobile} />;
}
