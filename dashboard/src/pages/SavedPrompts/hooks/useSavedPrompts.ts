import { useEffect, useState } from 'react';
import {
  errorMessage,
  getJson,
  mutate,
  type Guild,
  type SavedPrompt,
} from '../../../lib/api';

export function useSavedPrompts(guild?: Guild) {
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
  return {
    tab,
    setTab,
    kind,
    setKind,
    prompts,
    loading,
    error,
    deleting,
    deletePrompt,
    filtered: prompts.filter(
      (prompt) => kind === 'all' || prompt.kind === kind,
    ),
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
