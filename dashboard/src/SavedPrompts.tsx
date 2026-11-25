import { useEffect, useState } from 'react';
import {
  errorMessage,
  getJson,
  Guild,
  kindLabels,
  mutate,
  SavedPrompt,
} from './api';

export default function SavedPrompts({ guild }: { guild?: Guild }) {
  const [tab, setTab] = useState<'mine' | 'server'>('mine');
  const [kind, setKind] = useState('all');
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const base =
    tab === 'server' && guild?.canManage
      ? `/api/guilds/${guild.id}/saved-prompts`
      : '/api/me/saved-prompts';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPrompts([]);
    setError('');
    void getJson<SavedPrompt[]>(base)
      .then((data) => {
        if (active)
          setPrompts(
            guild ? data.filter((prompt) => prompt.guildId === guild.id) : data,
          );
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, guild?.id, refreshKey]);

  async function deletePrompt(prompt: SavedPrompt) {
    if (!window.confirm('Delete this saved prompt? This cannot be undone.'))
      return;
    setDeleting(prompt.id);
    setError('');
    try {
      await mutate(`${base}/${encodeURIComponent(prompt.id)}`, 'DELETE');
      setPrompts((current) =>
        current.filter((entry) => entry.id !== prompt.id),
      );
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setDeleting('');
    }
  }

  const filtered = prompts.filter(
    (prompt) => kind === 'all' || prompt.kind === kind,
  );
  return (
    <section className="content-card feature-card">
      <h2>{guild ? `Saved in ${guild.name}` : 'My saved prompts'}</h2>
      {guild && (
        <div
          className="tabs"
          role="tablist"
          aria-label="Saved prompt libraries"
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]:not(:disabled)',
              ),
            );
            const current = buttons.findIndex(
              (button) => button === document.activeElement,
            );
            const next =
              buttons[
                (current +
                  (event.key === 'ArrowRight' ? 1 : -1) +
                  buttons.length) %
                  buttons.length
              ];
            next?.focus();
            next?.click();
          }}
        >
          <button
            role="tab"
            aria-selected={tab === 'mine'}
            onClick={() => setTab('mine')}
          >
            My prompts
          </button>
          <button
            role="tab"
            aria-selected={tab === 'server'}
            disabled={!guild.canManage}
            onClick={() => setTab('server')}
          >
            Server prompts
          </button>
        </div>
      )}
      <p className="form-description">
        {tab === 'server'
          ? 'Server managers can view and delete saves made in this server.'
          : guild
            ? 'Your own prompts saved in this server.'
            : 'All your saved prompts, including direct messages.'}{' '}
        Deleting a save does not delete the original Discord message.
      </p>
      {guild && !guild.canManage && (
        <p className="field-help">
          Manage Server permission is required for the Server prompts tab.
        </p>
      )}
      <label className="field-label" htmlFor="prompt-kind">
        Prompt type
      </label>
      <select
        id="prompt-kind"
        className="server-select"
        value={kind}
        onChange={(event) => setKind(event.target.value)}
      >
        <option value="all">All kinds</option>
        {Object.entries(kindLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button
        className="text-button"
        onClick={() => setRefreshKey((key) => key + 1)}
      >
        Refresh prompts
      </button>
      {loading ? (
        <p role="status">Loading saved prompts…</p>
      ) : error && prompts.length === 0 ? null : filtered.length === 0 ? (
        <p className="empty-state">No saved prompts match this filter.</p>
      ) : (
        <ul className="saved-prompt-list">
          {filtered.map((prompt) => (
            <li className="saved-prompt" key={prompt.id}>
              <div className="saved-prompt-meta">
                <strong>{prompt.displayName}</strong>
                <span>
                  {kindLabels[prompt.kind]} ·{' '}
                  {prompt.guildName ?? 'Direct message'} ·{' '}
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </span>
              </div>
              <pre>{prompt.content}</pre>
              <button
                className="text-button danger-button"
                disabled={!!deleting}
                aria-label={`Delete saved prompt by ${prompt.displayName}`}
                onClick={() => void deletePrompt(prompt)}
              >
                {deleting === prompt.id ? 'Deleting…' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
