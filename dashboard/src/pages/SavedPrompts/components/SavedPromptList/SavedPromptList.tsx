import { kindLabels, type SavedPrompt } from '../../../../lib/api';

export default function SavedPromptList({
  prompts,
  deleting,
  onDelete,
}: {
  prompts: SavedPrompt[];
  deleting: string;
  onDelete: (prompt: SavedPrompt) => void;
}) {
  if (!prompts.length)
    return <p className="empty-state">No saved prompts match this filter.</p>;
  return (
    <ul className="saved-prompt-list">
      {prompts.map((prompt) => (
        <li className="saved-prompt" key={prompt.id}>
          <div className="saved-prompt-meta">
            <strong>{prompt.displayName}</strong>
            <span>
              {kindLabels[prompt.kind]} · {prompt.guildName ?? 'Direct message'}{' '}
              · {new Date(prompt.createdAt).toLocaleDateString()}
            </span>
          </div>
          <pre>{prompt.content}</pre>
          <button
            className="text-button danger-button"
            disabled={!!deleting}
            aria-label={`Delete saved prompt by ${prompt.displayName}`}
            onClick={() => onDelete(prompt)}
          >
            {deleting === prompt.id ? 'Deleting…' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  );
}
