import { useState } from 'react';
import { errorMessage, getJson } from '../../../../lib/api';

export default function ParticipantCount({
  guildId,
  threadId,
}: {
  guildId: string;
  threadId: string;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError('');
    try {
      const result = await getJson<{ participants: number }>(
        `/api/guilds/${guildId}/art-challenges/${encodeURIComponent(threadId)}/participants`,
      );
      setCount(result.participants);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" disabled={busy} onClick={() => void load()}>
        Count participants
      </button>
      {count !== null && <span> {count} participants</span>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
