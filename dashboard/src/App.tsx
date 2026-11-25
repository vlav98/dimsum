import { useEffect, useState } from 'react';
import './App.css';

type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
};

type BotStatus = {
  online: boolean;
  username: string | null;
  guildCount: number;
  uptimeMs: number | null;
};

type Guild = {
  id: string;
  name: string;
  icon: string | null;
  botPresent: boolean;
};

type Command = {
  name: string;
  description: string;
};

type DashboardData = {
  status: BotStatus;
  guilds: Guild[];
  commands: Command[];
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function formatUptime(uptimeMs: number | null): string {
  if (uptimeMs === null) return 'Unavailable';
  const totalMinutes = Math.floor(uptimeMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const profileResponse = await fetch('/api/me', {
          credentials: 'same-origin',
        });
        if (profileResponse.status === 401) {
          if (active) {
            setUser(null);
            setDashboard(null);
          }
          return;
        }
        if (!profileResponse.ok) {
          throw new Error(`Could not load your profile (${profileResponse.status}).`);
        }
        const profile = (await profileResponse.json()) as User;
        const [status, guilds, commands] = await Promise.all([
          getJson<BotStatus>('/api/status'),
          getJson<Guild[]>('/api/guilds'),
          getJson<Command[]>('/api/commands'),
        ]);
        if (active) {
          setUser(profile);
          setDashboard({ status, guilds, commands });
          setSelectedGuildId((current) =>
            guilds.some((guild) => guild.id === current)
              ? current
              : (guilds[0]?.id ?? ''),
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load the dashboard.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function logout() {
    setError('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Sign-out failed (${response.status}).`);
      setUser(null);
      setDashboard(null);
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : 'Unable to sign out.',
      );
    }
  }

  const selectedGuild = dashboard?.guilds.find(
    (guild) => guild.id === selectedGuildId,
  );

  if (loading) {
    return (
      <main className="page-shell">
        <p className="loading-message" role="status">Loading dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-shell">
        <section className="welcome-card">
          <div className="brand-mark" aria-hidden="true">D</div>
          <p className="eyebrow">DIMSUM BOT</p>
          <h1>Your Discord, at a glance.</h1>
          <p className="intro">
            Sign in to check the bot connection, browse your servers, and see its
            registered slash commands.
          </p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <a className="primary-button" href="/api/auth/login">
            <span aria-hidden="true">◉</span> Continue with Discord
          </a>
          <p className="privacy-note">Read-only dashboard. No server changes.</p>
        </section>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="page-shell">
        <header className="topbar">
          <a className="brand" href="/">DIMSUM <span>CONTROL PANEL</span></a>
          <button className="text-button" onClick={() => void logout()}>Sign out</button>
        </header>
        <section className="content-card error-card">
          <h1>Dashboard unavailable</h1>
          <p className="error-message" role="alert">
            {error || 'The dashboard data could not be loaded.'}
          </p>
          <button className="primary-button" onClick={() => setRefreshKey((key) => key + 1)}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=96`
    : null;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/">DIMSUM <span>CONTROL PANEL</span></a>
        <div className="account">
          {avatarUrl ? (
            <img className="avatar" src={avatarUrl} alt="" />
          ) : (
            <span className="avatar avatar-fallback" aria-hidden="true">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="account-name">{user.displayName}</span>
          <button className="text-button" onClick={() => void logout()}>Sign out</button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Welcome back, {user.displayName}</h1>
            <p className="intro">A live, read-only view of your DimSum bot.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Refresh
          </button>
        </div>

        {error && <p className="error-message inline-error" role="alert">{error}</p>}

        <div className="stat-grid">
          <article className="stat-card">
            <p className="eyebrow">BOT CONNECTION</p>
            <p className={`stat-value ${dashboard.status.online ? 'online' : 'offline'}`}>
              <span className="status-dot" />
              {dashboard.status.online ? 'Online' : 'Offline'}
            </p>
            <p className="stat-detail">{dashboard.status.username ?? 'DimSum'}</p>
          </article>
          <article className="stat-card">
            <p className="eyebrow">CONNECTED SERVERS</p>
            <p className="stat-value">{dashboard.status.guildCount}</p>
            <p className="stat-detail">servers the bot can currently see</p>
          </article>
          <article className="stat-card">
            <p className="eyebrow">BOT UPTIME</p>
            <p className="stat-value uptime">{formatUptime(dashboard.status.uptimeMs)}</p>
            <p className="stat-detail">since the current connection started</p>
          </article>
        </div>

        <div className="section-grid">
          <section className="content-card server-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR SERVERS</p>
                <h2>Server overview</h2>
              </div>
              <span className="count-pill">{dashboard.guilds.length}</span>
            </div>
            {dashboard.guilds.length === 0 ? (
              <p className="empty-state">
                No servers where you have Manage Server or Administrator permission
                were found.
              </p>
            ) : (
              <>
                <label className="field-label" htmlFor="server-select">Select a server</label>
                <select
                  id="server-select"
                  className="server-select"
                  value={selectedGuild?.id ?? ''}
                  onChange={(event) => setSelectedGuildId(event.target.value)}
                >
                  {dashboard.guilds.map((guild) => (
                    <option key={guild.id} value={guild.id}>{guild.name}</option>
                  ))}
                </select>
                {selectedGuild && (
                  <div className="selected-server">
                    {selectedGuild.icon ? (
                      <img
                        className="guild-icon"
                        src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=96`}
                        alt=""
                      />
                    ) : (
                      <span className="guild-icon guild-fallback" aria-hidden="true">
                        {selectedGuild.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="guild-details">
                      <h3>{selectedGuild.name}</h3>
                      <p>
                        {selectedGuild.botPresent
                          ? 'DimSum is in this server'
                          : 'DimSum is not in this server'}
                      </p>
                    </div>
                    <span className={`presence-pill ${selectedGuild.botPresent ? 'present' : 'absent'}`}>
                      {selectedGuild.botPresent ? 'Added' : 'Not added'}
                    </span>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="content-card commands-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AVAILABLE TO EVERYONE</p>
                <h2>Slash commands</h2>
              </div>
              <span className="count-pill">{dashboard.commands.length}</span>
            </div>
            <ul className="command-list">
              {dashboard.commands.map((command) => (
                <li className="command-item" key={command.name}>
                  <code>/{command.name}</code>
                  <span>{command.description}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <footer className="footer-note">Read-only view · Discord OAuth · No changes are made to your servers</footer>
      </section>
    </main>
  );
}

export default App;
