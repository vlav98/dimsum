import type { DashboardData } from '../../../../types/dashboard';
import CommandList from '../../../../components/common/CommandList/CommandList';
import ContentCard from '../../../../components/common/ContentCard/ContentCard';

export default function CommandCatalog({
  category,
  commands,
}: {
  category: string;
  commands: DashboardData['commands'];
}) {
  const configurable = [
    'daily',
    'group-prompt',
    'writing-channel',
    'reactionroles',
    'draw-this-in-palette',
  ];
  return (
    <ContentCard>
      <h3>{category}</h3>
      <CommandList commands={commands} />
      {!commands.some((command) => configurable.includes(command.name)) && (
        <p className="field-help">
          These commands are configured when you run them in Discord; no
          server-wide settings are needed.
        </p>
      )}
    </ContentCard>
  );
}
