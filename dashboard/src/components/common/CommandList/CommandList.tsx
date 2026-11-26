import type { DashboardData } from '../../../types/dashboard';

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
        </li>
      ))}
    </ul>
  );
}
