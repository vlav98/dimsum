import { useEffect, useState } from 'react';
import { errorMessage, getJson, mutate } from '../../../lib/api';

export type ArtChallenge = {
  threadId: string;
  hideAt: number;
  endAt: number;
  hidden: boolean;
};

export function useArtChallenges(guildId: string) {
  const [challenges, setChallenges] = useState<ArtChallenge[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);
  const url = `/api/guilds/${guildId}/art-challenges`;
  useEffect(() => {
    let active = true;
    setError('');
    void getJson<ArtChallenge[]>(url)
      .then((value) => {
        if (active) setChallenges(value);
      })
      .catch((failure: unknown) => {
        if (active) setError(errorMessage(failure));
      });
    return () => {
      active = false;
    };
  }, [url, refreshKey]);

  async function act(threadId: string, action: 'hide' | 'end') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await mutate(`${url}/${encodeURIComponent(threadId)}/${action}`, 'POST');
      setChallenges(await getJson<ArtChallenge[]>(url));
      if (action === 'end') setHistoryVersion((version) => version + 1);
      setNotice(action === 'hide' ? 'Reference hidden.' : 'Challenge ended.');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  async function edit(threadId: string, hideAt: number, endAt: number) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await mutate(`${url}/${encodeURIComponent(threadId)}/deadlines`, 'PUT', {
        hideAt,
        endAt,
      });
      setChallenges(await getJson<ArtChallenge[]>(url));
      setNotice('Challenge deadlines updated.');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return {
    challenges,
    error,
    notice,
    busy,
    act,
    edit,
    historyVersion,
    refresh: () => {
      setRefreshKey((key) => key + 1);
      setHistoryVersion((version) => version + 1);
    },
  };
}
