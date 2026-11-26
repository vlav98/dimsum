import { useEffect, useState } from 'react';
import { errorMessage, getJson } from '../../../lib/api';
import type { Channel } from '../../../components/common/ChannelCombobox/types';
import type { Emoji } from '../components/EmojiInput/EmojiInput';
import type { Details, Role, RoleMessage, WritingSettings } from '../types';

export function useCommandSettings(guildId: string) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const base = `/api/guilds/${guildId}`;

  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([
      getJson<Channel[]>(`${base}/channels`),
      getJson<Role[]>(`${base}/roles`),
      getJson<Emoji[]>(`${base}/emojis`),
      getJson<RoleMessage[]>(`${base}/reaction-roles`),
      getJson<WritingSettings>(`${base}/settings/writing`),
    ])
      .then(([channels, roles, emojis, messages, writing]) => {
        if (active) setDetails({ channels, roles, emojis, messages, writing });
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [base, refreshKey]);

  return {
    details,
    setDetails,
    error,
    setError,
    base,
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
export type CommandSettings = ReturnType<typeof useCommandSettings>;
