import type { Guild } from '../../../lib/api';
import type { DashboardData } from '../../../types/dashboard';
import BotSettings from '../../../pages/BotSettings/BotSettings';
import Commands from '../../../pages/Commands/Commands';
import SavedPrompts from '../../../pages/SavedPrompts/SavedPrompts';

export default function ServerPage({
  guild,
  page,
  commands,
}: {
  guild: Guild;
  page: string;
  commands: DashboardData['commands'];
}) {
  return (
    <>
      <div className="page-heading">
        <h1>{guild.name}</h1>
      </div>
      {page === 'saved' ? (
        <SavedPrompts key={guild.id} guild={guild} />
      ) : !guild.canManage ? (
        <p role="alert">
          Manage Server permission is required to change these settings.
        </p>
      ) : page === 'commands' ? (
        <Commands
          key={`${guild.id}-commands`}
          guild={guild}
          commands={commands}
        />
      ) : (
        <BotSettings key={`${guild.id}-settings`} guild={guild} />
      )}
    </>
  );
}
