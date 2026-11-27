import type { DashboardData } from '../../../types/dashboard';
import CommandOptions from './CommandOptions';

export default function CommandList({
  commands,
}: {
  commands: DashboardData['commands'];
}) {
  return (
    <ul className="command-list">
      {commands.map((command) => (
        <li className="command-item" key={command.name}>
          <code>/{command.name}</code>
          <span>{command.description}</span>
          {!!command.options?.length && (
            <details className="command-options">
              <summary>Options for /{command.name}</summary>
              <CommandOptions options={command.options} />
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
