import { FormEvent, useEffect, useState } from 'react';
import { errorMessage, getJson, Guild, mutate } from '../../lib/api';

type PrefixSettings = { prefix: string; isCustom: boolean };
type NicknameSettings = { nickname: string | null; username: string };

export default function BotSettings({ guild }: { guild: Guild }) {
  const [settings, setSettings] = useState<PrefixSettings | null>(null);
  const [nicknameSettings, setNicknameSettings] =
    useState<NicknameSettings | null>(null);
  const [prefix, setPrefix] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const base = `/api/guilds/${guild.id}/settings`;

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

  function submit(event: FormEvent, kind: 'prefix' | 'nickname') {
    event.preventDefault();
    void save(kind);
  }

  return (
    <section className="content-card">
      <h2>Bot settings</h2>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!settings || !nicknameSettings ? (
        error ? (
          <button
            className="secondary-button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </button>
        ) : (
          <p role="status">Loading bot settings…</p>
        )
      ) : (
        <fieldset className="reaction-form" disabled={busy}>
          <form onSubmit={(event) => submit(event, 'nickname')}>
            <label className="field-label" htmlFor="bot-nickname">
              Bot nickname
            </label>
            <div className="inline-form">
              <input
                id="bot-nickname"
                className="text-input"
                value={nickname}
                maxLength={32}
                placeholder={nicknameSettings.username}
                onChange={(event) => setNickname(event.target.value)}
              />
              <button className="secondary-button">Save nickname</button>
              <button
                className="text-button"
                type="button"
                disabled={!nicknameSettings.nickname}
                onClick={() => void save('nickname', true)}
              >
                Reset nickname
              </button>
            </div>
            <p className="field-help">
              Only changes the bot's nickname in this server. Requires Change
              Nickname permission.
            </p>
          </form>
          <form onSubmit={(event) => submit(event, 'prefix')}>
            <label className="field-label" htmlFor="prefix-input">
              Prefix (1–5 characters)
            </label>
            <div className="inline-form">
              <input
                id="prefix-input"
                className="text-input prefix-input"
                value={prefix}
                minLength={1}
                maxLength={5}
                required
                onChange={(event) => setPrefix(event.target.value)}
              />
              <button className="secondary-button">Save prefix</button>
              <button
                className="text-button"
                type="button"
                disabled={!settings.isCustom}
                onClick={() => void save('prefix', true)}
              >
                Reset prefix
              </button>
            </div>
            <p className="field-help">
              Applies to message commands in this server, not slash commands.
            </p>
          </form>
        </fieldset>
      )}
    </section>
  );
}
