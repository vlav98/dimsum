import { useEffect, useState } from 'react';
import { errorMessage, getJson, mutate } from '../../../lib/api';

type PrefixSettings = { prefix: string; isCustom: boolean };
type NicknameSettings = { nickname: string | null; username: string };

export function useBotSettings(guildId: string) {
  const [settings, setSettings] = useState<PrefixSettings | null>(null);
  const [nicknameSettings, setNicknameSettings] =
    useState<NicknameSettings | null>(null);
  const [prefix, setPrefix] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const base = `/api/guilds/${guildId}/settings`;

  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([
      getJson<PrefixSettings>(base),
      getJson<NicknameSettings>(`${base}/nickname`),
    ])
      .then(([prefixSettings, nameSettings]) => {
        if (!active) return;
        setSettings(prefixSettings);
        setPrefix(prefixSettings.prefix);
        setNicknameSettings(nameSettings);
        setNickname(nameSettings.nickname ?? '');
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [base, refreshKey]);

  async function save(kind: 'prefix' | 'nickname', reset = false) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (kind === 'prefix') {
        const response = await mutate(
          `${base}/prefix`,
          reset ? 'DELETE' : 'PUT',
          reset ? undefined : { prefix },
        );
        const result: PrefixSettings = await response.json();
        setSettings(result);
        setPrefix(result.prefix);
      } else {
        const response = await mutate(`${base}/nickname`, 'PUT', {
          nickname: reset ? null : nickname.trim() || null,
        });
        const result: NicknameSettings = await response.json();
        setNicknameSettings(result);
        setNickname(result.nickname ?? '');
      }
      setNotice(kind === 'prefix' ? 'Prefix saved.' : 'Nickname saved.');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }
  return {
    settings,
    nicknameSettings,
    prefix,
    setPrefix,
    nickname,
    setNickname,
    busy,
    error,
    notice,
    save,
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
