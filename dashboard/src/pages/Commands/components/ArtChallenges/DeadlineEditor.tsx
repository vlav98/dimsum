import { useState } from 'react';
import type { ArtChallenge } from '../../hooks/useArtChallenges';

function localDateTime(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(timestamp - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function DeadlineEditor({
  challenge,
  busy,
  onSave,
  onClose,
}: {
  challenge: ArtChallenge;
  busy: boolean;
  onSave: (id: string, hideAt: number, endAt: number) => Promise<void>;
  onClose: () => void;
}) {
  const [hide, setHide] = useState(localDateTime(challenge.hideAt));
  const [end, setEnd] = useState(localDateTime(challenge.endAt));
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(
          challenge.threadId,
          challenge.hidden || hide === localDateTime(challenge.hideAt)
            ? challenge.hideAt
            : new Date(hide).getTime(),
          end === localDateTime(challenge.endAt)
            ? challenge.endAt
            : new Date(end).getTime(),
        );
      }}
    >
      {!challenge.hidden && (
        <label>
          Reference hiding time
          <input
            type="datetime-local"
            required
            value={hide}
            onChange={(event) => setHide(event.target.value)}
          />
        </label>
      )}
      <label>
        Submission deadline
        <input
          type="datetime-local"
          required
          value={end}
          onChange={(event) => setEnd(event.target.value)}
        />
      </label>
      <button disabled={busy}>Save deadlines</button>
      <button type="button" disabled={busy} onClick={onClose}>
        Cancel editing
      </button>
    </form>
  );
}
