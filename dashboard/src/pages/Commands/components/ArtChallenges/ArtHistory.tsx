import { useEffect, useState } from 'react';
import { errorMessage, getJson } from '../../../../lib/api';
import ParticipantCount from './ParticipantCount';

type Entry = { threadId: string; endedAt: number };
export default function ArtHistory({ guildId }: { guildId: string }) {
  const [history, setHistory] = useState<Entry[] | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    void getJson<Entry[]>(`/api/guilds/${guildId}/art-challenges/history`)
      .then((entries) => {
        if (active) setHistory(entries);
      })
      .catch((failure: unknown) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [guildId]);
  const pages = Math.ceil((history?.length ?? 0) / 5);
  return (
    <section>
      <h3>Completed drawing challenges</h3>
      <p>
        History starts with challenges completed after this update. Participants
        are unique non-bot users who posted an attachment before the deadline.
      </p>
      {error && <p role="alert">{error}</p>}
      {!history && !error && <p>Loading history…</p>}
      {history?.length === 0 && <p>No recorded challenges yet.</p>}
      <ul className="art-challenge-list">
        {history?.slice(page * 5, (page + 1) * 5).map((entry) => (
          <li key={`${entry.threadId}-${entry.endedAt}`}>
            <a
              href={`https://discord.com/channels/${guildId}/${entry.threadId}`}
              target="_blank"
              rel="noreferrer"
            >
              Open completed challenge thread
            </a>
            <p>Ended: {new Date(entry.endedAt).toLocaleString()}</p>
            <ParticipantCount guildId={guildId} threadId={entry.threadId} />
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="art-challenge-actions" aria-label="History pages">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous history page
          </button>
          <span>
            Page {page + 1} of {pages}
          </span>
          <button
            type="button"
            disabled={page + 1 === pages}
            onClick={() => setPage(page + 1)}
          >
            Next history page
          </button>
        </div>
      )}
    </section>
  );
}
