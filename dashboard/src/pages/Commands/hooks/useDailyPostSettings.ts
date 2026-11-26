import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage, getJson, mutate } from '../../../lib/api';
import type { DailySettings } from '../types';

export function useDailyPostSettings(guildId: string) {
  const [settings, setSettings] = useState<DailySettings | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const url = `/api/guilds/${guildId}/settings/daily`;
  useEffect(() => {
    let active = true;
    setError('');
    void getJson<DailySettings>(url)
      .then((value) => {
        if (active) setSettings(value);
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [url, refreshKey]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await mutate(url, 'PUT', settings);
      const result: DailySettings = await response.json();
      setSettings(result);
      setNotice('Daily schedule saved.');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }
  return {
    settings,
    setSettings,
    error,
    notice,
    busy,
    save,
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
