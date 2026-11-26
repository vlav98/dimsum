import type { Details } from '../../types';
import type { ReactionRoleEditor } from '../../hooks/useReactionRoleEditor';
import ReactionChannelFields from '../ReactionChannelFields/ReactionChannelFields';
import MappingsEditor from '../MappingsEditor/MappingsEditor';

export default function ReactionRoleForm({
  details,
  editor,
}: {
  details: Details;
  editor: ReactionRoleEditor;
}) {
  return (
    <form onSubmit={(event) => void editor.saveMessage(event)}>
      <fieldset className="reaction-form" disabled={editor.busy}>
        <ReactionChannelFields channels={details.channels} editor={editor} />
        <label className="field-label" htmlFor="reaction-content">
          Message
        </label>
        <textarea
          id="reaction-content"
          className="text-input message-textarea"
          value={editor.content}
          maxLength={2000}
          required
          onChange={(event) => editor.setContent(event.target.value)}
        />
        <p className="field-help">
          Choose a default/server emoji, paste a Unicode emoji, or enter a code
          such as :heart: or :server_emoji_name:.
        </p>
        <MappingsEditor details={details} editor={editor} />
        <button className="primary-button form-submit">
          {editor.busy
            ? 'Saving…'
            : editor.editing
              ? 'Save changes'
              : 'Publish message'}
        </button>
        {editor.editing && (
          <button
            className="text-button"
            type="button"
            onClick={editor.clearEditor}
          >
            Cancel editing
          </button>
        )}
      </fieldset>
    </form>
  );
}
