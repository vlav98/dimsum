import { FormEvent, useEffect, useState } from 'react';
import { errorMessage, getJson, mutate } from './api';

type Settings = {
  enabled: boolean;
  channelId: string | null;
  time: string;
  kind: 'prompt' | 'challenge';
  lastPostedDate: string | null;
};

export default function DailyPostSettings({
  guildId,
  channels,
}: {
  guildId: string;
  channels: { id: string; name: string; category: string | null }[];
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const url = `/api/guilds/${guildId}/settings/daily`;
  useEffect(() => {
    let active = true;
    setError('');
    void getJson<Settings>(url)
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

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await mutate(url, 'PUT', settings);
      const result: Settings = await response.json();
      setSettings(result);
      setNotice('Daily schedule saved.');
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content-card feature-card">
      <h2>Automatic daily posts</h2>
      <p className="form-description">
        Post a story prompt or the /daily challenge automatically. Times are
        UTC. After downtime, today's post is sent when the bot returns if its
        time has passed; older days are skipped.
      </p>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!settings ? (
        error ? (
          <button
            className="secondary-button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </button>
        ) : (
          <p role="status">Loading daily schedule…</p>
        )
      ) : (
        <form onSubmit={(event) => void save(event)}>
          <fieldset className="reaction-form" disabled={busy}>
            <label>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) =>
                  setSettings({ ...settings, enabled: event.target.checked })
                }
              />{' '}
              Enable daily posts
            </label>
            <label className="field-label" htmlFor="daily-kind">
              Daily content
            </label>
            <select
              id="daily-kind"
              className="server-select"
              value={settings.kind}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  kind:
                    event.target.value === 'challenge' ? 'challenge' : 'prompt',
                })
              }
            >
              <option value="prompt">Story prompt</option>
              <option value="challenge">Daily writing challenge</option>
            </select>
            <label className="field-label" htmlFor="daily-channel">
              Daily posting channel
            </label>
            <select
              id="daily-channel"
              className="server-select"
              required={settings.enabled}
              value={settings.channelId ?? ''}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  channelId: event.target.value || null,
                })
              }
            >
              <option value="">Choose channel</option>
              {settings.channelId &&
                !channels.some(
                  (channel) => channel.id === settings.channelId,
                ) && (
                  <option value={settings.channelId}>
                    Current channel (unavailable)
                  </option>
                )}
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.category ? `${channel.category} / ` : ''}#{' '}
                  {channel.name}
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="daily-time">
              Posting time (UTC)
            </label>
            <input
              id="daily-time"
              className="text-input"
              type="time"
              required
              value={settings.time}
              onChange={(event) =>
                setSettings({ ...settings, time: event.target.value })
              }
            />
            <button className="secondary-button form-submit">
              {busy ? 'Saving…' : 'Save daily schedule'}
            </button>
            <p className="field-help">
              At most one scheduled post per UTC day.{' '}
              {settings.lastPostedDate
                ? `Last posted: ${settings.lastPostedDate} UTC.`
                : 'No scheduled posts sent yet.'}
            </p>
          </fieldset>
        </form>
      )}
    </section>
  );
}
