import type { Guild } from '../../../lib/api';

export default function ServerNavigation({
  guild,
  page,
}: {
  guild: Guild;
  page: string;
}) {
  return (
    <>
      <p className="nav-section-label">SELECTED SERVER</p>
      <div className="sidebar-server">{guild.name}</div>
      <nav className="sidebar-nav" aria-label="Server navigation">
        {guild.canManage && (
          <>
            <a
              href={`#/servers/${guild.id}/settings`}
              aria-current={page === 'settings' ? 'page' : undefined}
            >
              Bot settings
            </a>
            <a
              href={`#/servers/${guild.id}/commands`}
              aria-current={page === 'commands' ? 'page' : undefined}
            >
              Commands
            </a>
          </>
        )}
        <a
          href={`#/servers/${guild.id}/saved`}
          aria-current={page === 'saved' ? 'page' : undefined}
        >
          Saved in {guild.name}
        </a>
      </nav>
    </>
  );
}
