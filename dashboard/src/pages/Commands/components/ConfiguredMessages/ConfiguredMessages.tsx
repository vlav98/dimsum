import type { RoleMessage } from '../../types';
import type { ReactionRoleEditor } from '../../hooks/useReactionRoleEditor';

export default function ConfiguredMessages({
  messages,
  editor,
}: {
  messages: RoleMessage[];
  editor: ReactionRoleEditor;
}) {
  return (
    <div className="configured-messages">
      <h3>Configured messages</h3>
      {messages.length === 0 ? (
        <p className="empty-state">No reaction-role messages yet.</p>
      ) : (
        <ul className="configured-list">
          {messages.map((message) => (
            <li key={message.messageId}>
              <div>
                <a
                  href={`https://discord.com/channels/${message.guildId}/${message.channelId}/${message.messageId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open message
                </a>
                <p className="message-preview">{message.content}</p>
              </div>
              <div className="message-actions">
                <button
                  className="text-button"
                  disabled={editor.busy}
                  onClick={() => editor.editMessage(message)}
                >
                  Edit
                </button>
                <button
                  className="text-button danger-button"
                  disabled={editor.busy}
                  onClick={() => void editor.deleteMessage(message.messageId)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
