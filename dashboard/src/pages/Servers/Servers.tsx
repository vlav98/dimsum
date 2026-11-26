import type { Guild } from '../../lib/api';
import ServerList from './components/ServerList/ServerList';

export default function Servers({
  guilds,
  onRefresh,
}: {
  guilds: Guild[];
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SERVER MANAGEMENT</p>
          <h1>My servers</h1>
          <p className="intro">
            Choose a server where you have Administrator or Manage Server
            permission.
          </p>
        </div>
        <button className="secondary-button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <ServerList guilds={guilds} />
    </>
  );
}
