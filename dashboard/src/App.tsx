import { useEffect, useState } from 'react';
import { errorMessage, getJson, Guild, mutate } from './api';
import SavedPrompts from './SavedPrompts';
import ServerSettings from './ServerSettings';
import './App.css';

type User = { id: string; displayName: string; avatar: string | null };
type DashboardData = {
  status: {
    online: boolean;
    username: string | null;
    guildCount: number;
    uptimeMs: number | null;
  };
  guilds: Guild[];
  commands: { name: string; description: string; category?: string }[];
};

function formatUptime(uptimeMs: number | null) {
  if (uptimeMs === null) return 'Unavailable';
  const minutes = Math.floor(uptimeMs / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours >= 24
    ? `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes % 60}m`
    : `${hours}h ${minutes % 60}m`;
}

function ServerList({ guilds }: { guilds: Guild[] }) {
  return (
    <section className="content-card">
      <div className="section-heading">
        <h2>Your servers</h2>
        <span className="count-pill">{guilds.length}</span>
      </div>
      {guilds.length === 0 ? (
        <p className="empty-state">
          No servers where you have Administrator or Manage Server permission
          were found.
        </p>
      ) : (
        <ul className="server-grid">
          {guilds.map((entry) => {
            const content = (
              <>
                <span className="server-tile-banner" aria-hidden="true">
                  {entry.icon ? (
                    <img
                      className="guild-icon"
                      src={`https://cdn.discordapp.com/icons/${entry.id}/${entry.icon}.png?size=128`}
                      alt=""
                    />
                  ) : (
                    <span className="guild-icon guild-fallback">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="server-tile-body">
                  <strong className="server-name">{entry.name}</strong>
                  <span
                    className={`presence-pill ${entry.botPresent ? 'present' : 'absent'}`}
                  >
                    {entry.botPresent ? 'Bot added' : 'Bot not added'}
                  </span>
                  <span className="server-tile-action">
                    {entry.botPresent
                      ? 'Manage server'
                      : 'Add DimSum to enable settings'}
                    {entry.botPresent && <span aria-hidden="true"> →</span>}
                  </span>
                </span>
              </>
            );
            return (
              <li key={entry.id}>
                {entry.botPresent ? (
                  <a
                    className="server-tile"
                    href={`#/servers/${entry.id}/settings`}
                    aria-label={`Open ${entry.name}`}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    className="server-tile"
                    type="button"
                    disabled
                    aria-label={`${entry.name}: bot not added`}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

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
  if (!user)
    return (
      <main className="page-shell">
        <section className="welcome-card">
          <div className="brand-mark" aria-hidden="true">
            D
          </div>
          <p className="eyebrow">DIMSUM BOT</p>
          <h1>Your Discord, at a glance.</h1>
          <p className="intro">
            Explore your servers, manage server settings, and browse saved
            writing prompts.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <a className="primary-button" href="/api/auth/login">
            Continue with Discord
          </a>
          <p className="privacy-note">
            Server changes require Manage Server permission. Saved prompts are
            visible to their author and server managers.
          </p>
        </section>
      </main>
    );

  const serverRoute = route.match(/^#\/servers\/([^/]+)\/(settings|saved)$/);
  const guild = dashboard?.guilds.find(
    (entry) => entry.id === serverRoute?.[1],
  );
  const home = route === '#/' || route === '#';
  const myServers = route === '#/servers';
  const managedGuilds =
    dashboard?.guilds.filter((entry) => entry.canManage) ?? [];
  const commandCategories = [
    ...new Set(
      dashboard?.commands.map((command) => command.category ?? 'Utilities') ??
        [],
    ),
  ];
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
                  <a
                    href={`#/servers/${guild.id}/settings`}
                    aria-current={
                      serverRoute[2] === 'settings' ? 'page' : undefined
                    }
                  >
                    Server settings
                  </a>
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
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">OVERVIEW</p>
                  <h1>Welcome back, {user.displayName}</h1>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Refresh
                </button>
              </div>
              <section className="overview-banner">
                <div>
                  <p className="eyebrow">YOUR COMMUNITY, SIMPLIFIED</p>
                  <h2>A home for your server tools.</h2>
                  <p>
                    Set up reaction roles, customize commands, and keep your
                    writing prompts in one place.
                  </p>
                </div>
                <a className="primary-button" href="#/servers">
                  Manage servers
                </a>
              </section>
              <div className="stat-grid">
                <article className="stat-card">
                  <p className="eyebrow">BOT CONNECTION</p>
                  <p
                    className={`stat-value ${dashboard.status.online ? 'online' : 'offline'}`}
                  >
                    {dashboard.status.online ? 'Online' : 'Offline'}
                  </p>
                  <p className="stat-detail">
                    {dashboard.status.username ?? 'DimSum'}
                  </p>
                </article>
                <article className="stat-card">
                  <p className="eyebrow">YOUR ACTIVE SERVERS</p>
                  <p className="stat-value">
                    {managedGuilds.filter((entry) => entry.botPresent).length}
                  </p>
                  <p className="stat-detail">
                    managed servers with DimSum added
                  </p>
                </article>
                <article className="stat-card">
                  <p className="eyebrow">BOT UPTIME</p>
                  <p className="stat-value uptime">
                    {formatUptime(dashboard.status.uptimeMs)}
                  </p>
                </article>
              </div>
              <section className="content-card personal-prompts">
                <h2>Slash commands</h2>
                {commandCategories.map((category) => (
                  <div key={category} className="command-group">
                    <h3>{category}</h3>
                    <ul className="command-list">
                      {dashboard.commands
                        .filter(
                          (command) =>
                            (command.category ?? 'Utilities') === category,
                        )
                        .map((command) => (
                          <li className="command-item" key={command.name}>
                            <code>/{command.name}</code>
                            <span>{command.description}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </section>
            </>
          ) : myServers ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">SERVER MANAGEMENT</p>
                  <h1>My servers</h1>
                  <p className="intro">
                    Choose a server where you have Administrator or Manage
                    Server permission.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Refresh
                </button>
              </div>
              <ServerList guilds={managedGuilds} />
            </>
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
                <ServerSettings key={guild.id} guild={guild} />
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
