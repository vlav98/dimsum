import { useState } from 'react';
import type { Guild } from '../../lib/api';
import type { DashboardData } from '../../types/dashboard';
import CommandList from '../../components/common/CommandList/CommandList';
import Feedback from '../../components/common/Feedback/Feedback';
import LoadState from '../../components/common/LoadState/LoadState';
import TabList from '../../components/common/TabList/TabList';
import DailyPostSettings from './components/DailyPostSettings/DailyPostSettings';
import ReactionRoles from './components/ReactionRoles/ReactionRoles';
import WritingChannelSettings from './components/WritingChannelSettings/WritingChannelSettings';
import { useCommandSettings } from './hooks/useCommandSettings';
import { useReactionRoleEditor } from './hooks/useReactionRoleEditor';
import { useWritingChannel } from './hooks/useWritingChannel';

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
  const activeCommands = commands.filter(
    (command) => (command.category ?? 'Utilities') === category,
  );
  const hasCommand = (name: string) =>
    activeCommands.some((command) => command.name === name);
  const settings = useCommandSettings(guild.id);
  const editor = useReactionRoleEditor(settings);
  const writing = useWritingChannel(settings);
  const { details, error } = settings;

  if (!details)
    return (
      <section className="content-card">
        <Feedback error={error} />
        <LoadState
          error={error}
          label="Loading command settings…"
          onRetry={settings.refresh}
        />
      </section>
    );
  return (
    <>
      <section className="content-card">
        <h2>Commands</h2>
        <TabList
          label="Command themes"
          className="command-tabs"
          tabClassName="secondary-button"
          idPrefix="theme"
          panelId="command-theme-panel"
          tabs={categories.map((name) => ({ value: name, label: name }))}
          value={category}
          onChange={setCategory}
        />
      </section>
      <div
        role="tabpanel"
        id="command-theme-panel"
        aria-labelledby={`theme-${categories.indexOf(category)}`}
      >
        <section className="content-card">
          <h3>{category}</h3>
          <CommandList commands={activeCommands} />
          {!['daily', 'group-prompt', 'writing-channel', 'reactionroles'].some(
            hasCommand,
          ) && (
            <p className="field-help">
              These commands are configured when you run them in Discord; no
              server-wide settings are needed.
            </p>
          )}
        </section>
        <Feedback error={error} />
        <div className="feature-grid">
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
      </div>
    </>
  );
}
