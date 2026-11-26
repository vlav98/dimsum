import type { Guild } from '../../../lib/api';
import ServerNavigation from '../ServerNavigation/ServerNavigation';

export default function AppSidebar({
  route,
  guild,
  serverPage,
}: {
  route: string;
  guild?: Guild;
  serverPage?: string;
}) {
  return (
    <aside className="sidebar">
      <p className="nav-section-label">DASHBOARD</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <a
          href="#/"
          aria-current={route === '#/' || route === '#' ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden="true">
            ◫
          </span>{' '}
          Overview
        </a>
        <a
          href="#/servers"
          aria-current={
            route === '#/servers' || serverPage ? 'page' : undefined
          }
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
      {guild?.botPresent && serverPage && (
        <ServerNavigation guild={guild} page={serverPage} />
      )}
      <p className="sidebar-note">DimSum · Your community, your settings.</p>
    </aside>
  );
}
