import Feedback from '../components/common/Feedback/Feedback';
import Login from '../pages/Login/Login';
import AppContent from './components/AppContent/AppContent';
import AppHeader from './components/AppHeader/AppHeader';
import AppSidebar from './components/AppSidebar/AppSidebar';
import { useDashboard } from './hooks/useDashboard';
import { useHashRoute } from './hooks/useHashRoute';
import './App.css';

export default function App() {
  const { user, dashboard, loading, error, logout, refresh } = useDashboard();
  const route = useHashRoute();
  const serverRoute = route.match(
    /^#\/servers\/([^/]+)\/(settings|commands|saved)$/,
  );
  const guild = dashboard?.guilds.find(
    (entry) => entry.id === serverRoute?.[1],
  );
  const serverPage = serverRoute?.[2];

  if (loading)
    return (
      <main className="page-shell">
        <p role="status">Loading dashboard…</p>
      </main>
    );
  if (!user) return <Login error={error} />;
  return (
    <main className="dashboard-shell">
      <AppHeader user={user} onLogout={() => void logout()} />
      <div className="dashboard-layout">
        <AppSidebar route={route} guild={guild} serverPage={serverPage} />
        <div className="dashboard-content">
          <Feedback error={error} />
          <AppContent
            user={user}
            dashboard={dashboard}
            route={route}
            guild={guild}
            serverPage={serverPage}
            onRefresh={refresh}
          />
        </div>
      </div>
    </main>
  );
}
