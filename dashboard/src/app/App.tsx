import { useEffect, useState } from 'react';
import { errorMessage, getJson, Guild, mutate } from '../lib/api';
import SavedPrompts from '../pages/SavedPrompts/SavedPrompts';
import Commands from '../pages/Commands/Commands';
import BotSettings from '../pages/BotSettings/BotSettings';
import Login from '../pages/Login/Login';
import Overview from '../pages/Overview/Overview';
import Servers from '../pages/Servers/Servers';
import type { DashboardData, User } from '../types/dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const navigate = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    async function load() {
      try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
        if (response.status === 401) {
          if (active) {
            setUser(null);
            setDashboard(null);
          }
          return;
        }
        if (!response.ok)
          throw new Error(`Could not load your profile (${response.status}).`);
        const profile: User = await response.json();
        if (active) setUser(profile);
        const [status, guilds, commands] = await Promise.all([
          getJson<DashboardData['status']>('/api/status'),
          getJson<Guild[]>('/api/guilds'),
          getJson<DashboardData['commands']>('/api/commands'),
        ]);
        if (active) setDashboard({ status, guilds, commands });
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function logout() {
    try {
      await mutate('/api/auth/logout', 'POST');
      setUser(null);
      setDashboard(null);
      window.location.hash = '#/';
    } catch (logoutError) {
      setError(errorMessage(logoutError));
    }
  }

  if (loading)
    return (
      <main className="page-shell">
        <p role="status">Loading dashboard…</p>
      </main>
    );
  if (!user) return <Login error={error} />;

  const serverRoute = route.match(
    /^#\/servers\/([^/]+)\/(settings|commands|saved)$/,
  );
  const guild = dashboard?.guilds.find(
    (entry) => entry.id === serverRoute?.[1],
  );
  const home = route === '#/' || route === '#';
  const myServers = route === '#/servers';
  const managedGuilds =
    dashboard?.guilds.filter((entry) => entry.canManage) ?? [];
  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#/">
          DIMSUM <span>CONTROL PANEL</span>
        </a>
        <div className="account">
          {user.avatar ? (
            <img
              className="avatar"
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=96`}
              alt=""
            />
          ) : (
            <span className="avatar avatar-fallback" aria-hidden="true">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="account-name">{user.displayName}</span>
          <button className="text-button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </header>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <p className="nav-section-label">DASHBOARD</p>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <a href="#/" aria-current={home ? 'page' : undefined}>
              <span className="nav-icon" aria-hidden="true">
                ◫
              </span>{' '}
              Overview
            </a>
            <a
              href="#/servers"
              aria-current={myServers || serverRoute ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                ▦
              </span>{' '}
              My servers
            </a>
          </nav>
          <p className="nav-section-label">YOUR LIBRARY</p>
          <nav className="sidebar-nav" aria-label="Library navigation">
            <a
              href="#/saved"
              aria-current={route === '#/saved' ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                ▤
              </span>{' '}
              My saved prompts
            </a>
          </nav>
          {guild?.botPresent && serverRoute && (
            <>
              <p className="nav-section-label">SELECTED SERVER</p>
              <div className="sidebar-server">{guild.name}</div>
              <nav className="sidebar-nav" aria-label="Server navigation">
                {guild.canManage && (
                  <>
                    <a
                      href={`#/servers/${guild.id}/settings`}
                      aria-current={
                        serverRoute[2] === 'settings' ? 'page' : undefined
                      }
                    >
                      Bot settings
                    </a>
                    <a
                      href={`#/servers/${guild.id}/commands`}
                      aria-current={
                        serverRoute[2] === 'commands' ? 'page' : undefined
                      }
                    >
                      Commands
                    </a>
                  </>
                )}
                <a
                  href={`#/servers/${guild.id}/saved`}
                  aria-current={serverRoute[2] === 'saved' ? 'page' : undefined}
                >
                  Saved in {guild.name}
                </a>
              </nav>
            </>
          )}
          <p className="sidebar-note">
            DimSum · Your community, your settings.
          </p>
        </aside>
        <div className="dashboard-content">
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {!dashboard ? (
            <section className="content-card">
              <h1>Dashboard unavailable</h1>
              <button
                className="secondary-button"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                Try again
              </button>
            </section>
          ) : home ? (
            <Overview
              user={user}
              dashboard={dashboard}
              onRefresh={() => setRefreshKey((key) => key + 1)}
            />
          ) : myServers ? (
            <Servers
              guilds={managedGuilds}
              onRefresh={() => setRefreshKey((key) => key + 1)}
            />
          ) : route === '#/saved' ? (
            <SavedPrompts key="personal" />
          ) : guild?.botPresent && serverRoute ? (
            <>
              <div className="page-heading">
                <h1>{guild.name}</h1>
              </div>
              {serverRoute[2] === 'saved' ? (
                <SavedPrompts key={guild.id} guild={guild} />
              ) : guild.canManage ? (
                serverRoute[2] === 'commands' ? (
                  <Commands
                    key={`${guild.id}-commands`}
                    guild={guild}
                    commands={dashboard.commands}
                  />
                ) : (
                  <BotSettings key={`${guild.id}-settings`} guild={guild} />
                )
              ) : (
                <p role="alert">
                  Manage Server permission is required to change these settings.
                </p>
              )}
            </>
          ) : (
            <section className="content-card">
              <h1>Page unavailable</h1>
              <p>
                This server is not shared with the bot, or you do not have
                access.
              </p>
              <a href="#/">Back to Overview</a>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
