import type { Details } from '../../types';
import ContentCard from '../../../../components/common/ContentCard/ContentCard';
import type { ReactionRoleEditor } from '../../hooks/useReactionRoleEditor';
import ReactionRoleForm from '../ReactionRoleForm/ReactionRoleForm';
import ConfiguredMessages from '../ConfiguredMessages/ConfiguredMessages';

export default function ReactionRoles({
  details,
  editor,
}: {
  details: Details;
  editor: ReactionRoleEditor;
}) {
  return (
    <ContentCard className="feature-card">
      <p className="eyebrow">SELF-ASSIGNABLE ROLES</p>
      <h2>
        {editor.editing
          ? 'Edit reaction-role message'
          : 'Create reaction-role message'}
      </h2>
      <p className="form-description">
        Members gain a role when they react and lose it when they remove their
        reaction. Editing does not retroactively change roles already assigned.
      </p>
      {details.channels.length === 0 || details.roles.length === 0 ? (
        <p className="empty-state">
          The bot needs Manage Roles, an accessible text channel, and a role
          above the roles being offered.
        </p>
      ) : (
        <ReactionRoleForm details={details} editor={editor} />
      )}
      <ConfiguredMessages messages={details.messages} editor={editor} />
    </ContentCard>
  );
}
