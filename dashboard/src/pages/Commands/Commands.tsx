import { useState } from 'react';
import type { Guild } from '../../lib/api';
import type { DashboardData } from '../../types/dashboard';
import ContentCard from '../../components/common/ContentCard/ContentCard';
import Feedback from '../../components/common/Feedback/Feedback';
import LoadState from '../../components/common/LoadState/LoadState';
import CommandThemeTabs from './components/CommandThemeTabs/CommandThemeTabs';
import CommandCatalog from './components/CommandCatalog/CommandCatalog';
import DailyPostSettings from './components/DailyPostSettings/DailyPostSettings';
import ArtChallenges from './components/ArtChallenges/ArtChallenges';
import ReactionRoles from './components/ReactionRoles/ReactionRoles';
import WritingChannelSettings from './components/WritingChannelSettings/WritingChannelSettings';
import { useCommandSettings } from './hooks/useCommandSettings';
import { useReactionRoleEditor } from './hooks/useReactionRoleEditor';
import { useWritingChannel } from './hooks/useWritingChannel';
import './Commands.css';

export default function Commands({
  guild,
  commands,
}: {
  guild: Guild;
  commands: DashboardData['commands'];
}) {
  const categories = [
    ...new Set(commands.map((command) => command.category ?? 'Utilities')),
  ];
  const [category, setCategory] = useState(categories[0] ?? '');
  const activeCategory = categories.includes(category)
    ? category
    : (categories[0] ?? '');
  const activeCommands = commands.filter(
    (command) => (command.category ?? 'Utilities') === activeCategory,
  );
  const hasCommand = (name: string) =>
    activeCommands.some((command) => command.name === name);
  const settings = useCommandSettings(guild.id);
  const editor = useReactionRoleEditor(settings);
  const writing = useWritingChannel(settings);
  const { details, error } = settings;

  if (!details)
    return (
      <ContentCard>
        <Feedback error={error} />
        <LoadState
          error={error}
          label="Loading command settings…"
          onRetry={settings.refresh}
        />
      </ContentCard>
    );
  return (
    <div className="command-settings">
      <CommandThemeTabs
        categories={categories}
        category={activeCategory}
        onChange={setCategory}
      />
      <div
        className="command-theme-panel"
        role="tabpanel"
        id="command-theme-panel"
        aria-labelledby={`theme-${categories.indexOf(activeCategory)}`}
      >
        <Feedback error={error} />
        <div className="feature-grid">
          {hasCommand('draw-this-in-palette') && (
            <ArtChallenges guildId={guild.id} />
          )}
          {hasCommand('daily') && (
            <DailyPostSettings
              guildId={guild.id}
              channels={details.writing.channels}
            />
          )}
          {(hasCommand('group-prompt') || hasCommand('writing-channel')) && (
            <WritingChannelSettings
              settings={details.writing}
              model={writing}
            />
          )}
          {hasCommand('reactionroles') && (
            <ReactionRoles details={details} editor={editor} />
          )}
        </div>
        <CommandCatalog category={activeCategory} commands={activeCommands} />
      </div>
    </div>
  );
}
