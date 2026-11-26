import type { DashboardData, User } from '../../types/dashboard';

function formatUptime(uptimeMs: number | null) {
  if (uptimeMs === null) return 'Unavailable';
  const minutes = Math.floor(uptimeMs / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours >= 24
    ? `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes % 60}m`
    : `${hours}h ${minutes % 60}m`;
}

export default function Overview({
  user,
  dashboard,
  onRefresh,
}: {
  user: User;
  dashboard: DashboardData;
  onRefresh: () => void;
}) {
  const categories = [
    ...new Set(
      dashboard.commands.map((command) => command.category ?? 'Utilities'),
    ),
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Welcome back, {user.displayName}</h1>
        </div>
        <button className="secondary-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <section className="overview-banner">
        <div>
          <p className="eyebrow">YOUR COMMUNITY, SIMPLIFIED</p>
          <h2>A home for your server tools.</h2>
          <p>
            Set up reaction roles, customize commands, and keep your writing
            prompts in one place.
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
          <p className="stat-detail">{dashboard.status.username ?? 'DimSum'}</p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">YOUR ACTIVE SERVERS</p>
          <p className="stat-value">
            {
              dashboard.guilds.filter(
                (entry) => entry.canManage && entry.botPresent,
              ).length
            }
          </p>
          <p className="stat-detail">managed servers with DimSum added</p>
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
        {categories.map((category) => (
          <div key={category} className="command-group">
            <h3>{category}</h3>
            <ul className="command-list">
              {dashboard.commands
                .filter(
                  (command) => (command.category ?? 'Utilities') === category,
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
  );
}
