import type { Details } from '../../types';
import type { ReactionRoleEditor } from '../../hooks/useReactionRoleEditor';
import MappingRow from '../MappingRow/MappingRow';

export default function MappingsEditor({
  details,
  editor,
}: {
  details: Details;
  editor: ReactionRoleEditor;
}) {
  return (
    <>
      <div className="mapping-heading">
        <span className="field-label">Emoji and role pairs (up to 10)</span>
        {editor.mappings.length < 10 && (
          <button
            className="text-button"
            type="button"
            onClick={editor.addMapping}
          >
            Add pair
          </button>
        )}
      </div>
      {editor.mappings.map((mapping, index) => (
        <MappingRow
          key={`${editor.editing}-${index}`}
          mapping={mapping}
          index={index}
          details={details}
          editor={editor}
        />
      ))}
    </>
  );
}
