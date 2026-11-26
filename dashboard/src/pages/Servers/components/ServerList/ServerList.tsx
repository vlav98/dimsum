import type { Guild } from '../../../../lib/api';
import './ServerList.css';

export default function ServerList({ guilds }: { guilds: Guild[] }) {
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
