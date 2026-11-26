import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage, mutate } from '../../../lib/api';
import type { CommandSettings } from './useCommandSettings';

export function useWritingChannel({
  base,
  details,
  setDetails,
  setError,
}: CommandSettings) {
  const [channelId, setChannelId] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setChannelId(details?.writing.channelId ?? '');
  }, [details?.writing.channelId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await mutate(`${base}/settings/writing`, 'PUT', {
        channelId: channelId || null,
      });
      const result: { channelId: string | null } = await response.json();
      setDetails((current) =>
        current
          ? {
              ...current,
              writing: { ...current.writing, channelId: result.channelId },
            }
          : current,
      );
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }
  return { channelId, setChannelId, busy, save };
}
export type WritingChannel = ReturnType<typeof useWritingChannel>;
