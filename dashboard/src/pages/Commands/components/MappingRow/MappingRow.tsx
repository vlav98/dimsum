import { Xmark } from 'iconoir-react';
import type { Details, Mapping } from '../../types';
import type { ReactionRoleEditor } from '../../hooks/useReactionRoleEditor';
import EmojiInput from '../EmojiInput/EmojiInput';

export default function MappingRow({
  mapping,
  index,
  details,
  editor,
}: {
  mapping: Mapping;
  index: number;
  details: Details;
  editor: ReactionRoleEditor;
}) {
  return (
    <div className="mapping-row">
      <EmojiInput
        index={index}
        value={mapping.emoji}
        emojis={details.emojis}
        onChange={(emoji) => editor.updateMapping(index, { emoji })}
      />
      <select
        className="server-select"
        aria-label={`Role ${index + 1}`}
        required
        value={mapping.roleId}
        onChange={(event) =>
          editor.updateMapping(index, { roleId: event.target.value })
        }
      >
        <option value="">Choose role</option>
        {mapping.roleId &&
          !details.roles.some((role) => role.id === mapping.roleId) && (
            <option value={mapping.roleId}>Unavailable role</option>
          )}
        {details.roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      {editor.mappings.length > 1 && (
        <button
          className="remove-mapping"
          type="button"
          aria-label={`Remove mapping ${index + 1}`}
          onClick={() => editor.removeMapping(index)}
        >
          <Xmark width={18} height={18} aria-hidden="true" focusable="false" />
        </button>
      )}
    </div>
  );
}
