import { useState } from 'react';
import type { ArtChallenge } from '../../hooks/useArtChallenges';
import DeadlineEditor from './DeadlineEditor';
import ParticipantCount from './ParticipantCount';

export default function ChallengeRow({
  guildId,
  challenge,
  busy,
  onAction,
  onEdit,
}: {
  guildId: string;
  challenge: ArtChallenge;
  busy: boolean;
  onAction: (id: string, action: 'hide' | 'end') => Promise<void>;
  onEdit: (id: string, hideAt: number, endAt: number) => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState<'hide' | 'end' | null>(null);
  const [editing, setEditing] = useState(false);
  return (
    <li>
      <a
        href={`https://discord.com/channels/${guildId}/${challenge.threadId}`}
        target="_blank"
        rel="noreferrer"
      >
        Open challenge thread
      </a>
      <p>
        {challenge.hidden
          ? 'Reference hidden'
          : `Reference hides: ${new Date(challenge.hideAt).toLocaleString()}`}
      </p>
      <p>Deadline: {new Date(challenge.endAt).toLocaleString()}</p>
      <ParticipantCount guildId={guildId} threadId={challenge.threadId} />
      {editing ? (
        <DeadlineEditor
          challenge={challenge}
          busy={busy}
          onSave={onEdit}
          onClose={() => setEditing(false)}
        />
      ) : (
        <button type="button" disabled={busy} onClick={() => setEditing(true)}>
          Edit deadlines
        </button>
      )}
      <div className="art-challenge-actions">
        {!challenge.hidden && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmation('hide')}
          >
            Hide reference early
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmation('end')}
        >
          End challenge early
        </button>
      </div>
      {confirmation && (
        <div>
          <p>
            {confirmation === 'hide'
              ? 'Hide this reference now?'
              : 'End this challenge now?'}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void onAction(challenge.threadId, confirmation);
              setConfirmation(null);
            }}
          >
            Confirm
          </button>{' '}
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmation(null)}
          >
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}
