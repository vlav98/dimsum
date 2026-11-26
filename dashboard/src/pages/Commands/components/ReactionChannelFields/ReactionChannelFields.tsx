import type { Channel } from '../../../../components/common/ChannelCombobox/types';
import type { ReactionRoleEditor } from '../../hooks/useReactionRoleEditor';

export default function ReactionChannelFields({
  channels,
  editor,
}: {
  channels: Channel[];
  editor: ReactionRoleEditor;
}) {
  const matching = channels.filter((channel) =>
    `${channel.category ?? ''} ${channel.name}`
      .toLowerCase()
      .includes(editor.channelQuery.toLowerCase()),
  );
  return (
    <>
      <label className="field-label" htmlFor="channel-search">
        Search channels
      </label>
      <input
        id="channel-search"
        className="text-input"
        placeholder="Channel or category name"
        value={editor.channelQuery}
        disabled={!!editor.editing}
        onChange={(event) => {
          editor.setChannelQuery(event.target.value);
          editor.setChannelId('');
        }}
      />
      <label className="field-label" htmlFor="message-channel">
        Post in
      </label>
      <select
        id="message-channel"
        className="server-select"
        value={editor.channelId}
        required
        disabled={!!editor.editing}
        onChange={(event) => editor.setChannelId(event.target.value)}
      >
        <option value="">Choose channel</option>
        {editor.editing &&
          !matching.some((channel) => channel.id === editor.channelId) && (
            <option value={editor.channelId}>
              Current channel (unavailable)
            </option>
          )}
        {matching.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.category ? `${channel.category} / ` : ''}# {channel.name}
          </option>
        ))}
      </select>
      {!matching.length && <p className="field-help">No matching channels.</p>}
      {editor.editing && (
        <p className="field-help">
          An existing message stays in its original channel.
        </p>
      )}
    </>
  );
}
