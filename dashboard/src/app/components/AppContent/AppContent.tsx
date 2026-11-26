import type { Guild } from '../../../lib/api';
import ContentCard from '../../../components/common/ContentCard/ContentCard';
import type { DashboardData, User } from '../../../types/dashboard';
import Overview from '../../../pages/Overview/Overview';
import Servers from '../../../pages/Servers/Servers';
import SavedPrompts from '../../../pages/SavedPrompts/SavedPrompts';
import ServerPage from '../ServerPage/ServerPage';

export default function AppContent({
  user,
  dashboard,
  route,
  guild,
  serverPage,
  onRefresh,
}: {
  user: User;
  dashboard: DashboardData | null;
  route: string;
  guild?: Guild;
  serverPage?: string;
  onRefresh: () => void;
}) {
  if (!dashboard)
    return (
      <ContentCard>
        <h1>Dashboard unavailable</h1>
        <button className="secondary-button" onClick={onRefresh}>
          Try again
        </button>
      </ContentCard>
    );
  if (route === '#/' || route === '#')
    return <Overview user={user} dashboard={dashboard} onRefresh={onRefresh} />;
  if (route === '#/servers')
    return (
      <Servers
        guilds={dashboard.guilds.filter((entry) => entry.canManage)}
        onRefresh={onRefresh}
      />
    );
  if (route === '#/saved') return <SavedPrompts key="personal" />;
  if (guild?.botPresent && serverPage)
    return (
      <ServerPage
        guild={guild}
        page={serverPage}
        commands={dashboard.commands}
      />
    );
  return (
    <ContentCard>
      <h1>Page unavailable</h1>
      <p>This server is not shared with the bot, or you do not have access.</p>
      <a href="#/">Back to Overview</a>
    </ContentCard>
  );
}
