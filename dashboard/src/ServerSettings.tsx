import { FormEvent, useEffect, useState } from 'react';
import { errorMessage, getJson, Guild, mutate } from './api';

type Channel = { id: string; name: string; category: string | null };
type Role = { id: string; name: string };
type Emoji = {
  name: string;
  value: string;
  imageUrl: string | null;
  source: string;
};
type Mapping = { emoji: string; roleId: string };
type RoleMessage = {
  guildId: string;
  messageId: string;
  channelId: string;
  content: string;
  mappings: Mapping[];
};
type Settings = { prefix: string; isCustom: boolean };
type WritingSettings = { channelId: string | null; channels: Channel[] };
type Details = {
  settings: Settings;
  channels: Channel[];
  roles: Role[];
  emojis: Emoji[];
  messages: RoleMessage[];
  writing: WritingSettings;
};

function EmojiInput({
  index,
  value,
  emojis,
  onChange,
}: {
  index: number;
  value: string;
  emojis: Emoji[];
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const matching = emojis.filter(
    (emoji) =>
      emoji.name.toLowerCase().includes(query.toLowerCase()) ||
      emoji.value.includes(query),
  );
  const selected = emojis.find(
    (emoji) => emoji.value === value || `:${emoji.name}:` === value,
  );
  return (
    <div className="emoji-control">
      <input
        className="text-input"
        aria-label={`Emoji ${index + 1}`}
        placeholder="Emoji or :name:"
        value={value}
        maxLength={100}
        required
        onChange={(event) => onChange(event.target.value)}
      />
      {selected && (
        <span className="emoji-preview">
          {selected.imageUrl ? (
            <img src={selected.imageUrl} alt={`:${selected.name}:`} />
          ) : (
            selected.value
          )}
        </span>
      )}
      <details className="emoji-picker">
        <summary>Choose emoji {index + 1}</summary>
        <input
          className="text-input"
          aria-label={`Search emojis ${index + 1}`}
          placeholder="Search emojis"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {['default', 'server'].map((source) => (
          <div key={source}>
            <p className="field-label">
              {source === 'default' ? 'Default emojis' : 'Server emojis'}
            </p>
            <div className="emoji-grid">
              {matching
                .filter((emoji) => emoji.source === source)
                .map((emoji) => (
                  <button
                    type="button"
                    className="emoji-choice"
                    key={emoji.value}
                    title={`:${emoji.name}:`}
                    aria-label={`Use ${source} emoji ${emoji.name} for pair ${index + 1}`}
                    onClick={() => onChange(emoji.value)}
                  >
                    {emoji.imageUrl ? (
                      <img src={emoji.imageUrl} alt="" />
                    ) : (
                      emoji.value
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
        {matching.length === 0 && (
          <p className="field-help">No emojis found.</p>
        )}
      </details>
    </div>
  );
}

export default function ServerSettings({ guild }: { guild: Guild }) {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [prefix, setPrefix] = useState('');
  const [savingPrefix, setSavingPrefix] = useState(false);
  const [writingChannelId, setWritingChannelId] = useState('');
  const [savingWriting, setSavingWriting] = useState(false);
  const [channelQuery, setChannelQuery] = useState('');
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [mappings, setMappings] = useState<Mapping[]>([
    { emoji: '', roleId: '' },
  ]);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false);
  const base = `/api/guilds/${guild.id}`;

  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([
      getJson<Settings>(`${base}/settings`),
      getJson<Channel[]>(`${base}/channels`),
      getJson<Role[]>(`${base}/roles`),
      getJson<Emoji[]>(`${base}/emojis`),
      getJson<RoleMessage[]>(`${base}/reaction-roles`),
      getJson<WritingSettings>(`${base}/settings/writing`),
    ])
      .then(([settings, channels, roles, emojis, messages, writing]) => {
        if (active) {
          setDetails({ settings, channels, roles, emojis, messages, writing });
          setWritingChannelId(writing.channelId ?? '');
          setPrefix(settings.prefix);
          setChannelId(channels[0]?.id ?? '');
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      });
    return () => {
      active = false;
    };
  }, [base, refreshKey]);

  async function savePrefix(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSavingPrefix(true);
    setError('');
    try {
      const response = await mutate(
        `${base}/settings/prefix`,
        event ? 'PUT' : 'DELETE',
        event ? { prefix } : undefined,
      );
      const settings: Settings = await response.json();
      setPrefix(settings.prefix);
      setDetails((current) => (current ? { ...current, settings } : current));
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setSavingPrefix(false);
    }
  }

  async function saveWritingChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingWriting(true);
    setError('');
    try {
      const response = await mutate(`${base}/settings/writing`, 'PUT', {
        channelId: writingChannelId || null,
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
      setSavingWriting(false);
    }
  }

  function clearEditor() {
    setEditing('');
    setContent('');
    setMappings([{ emoji: '', roleId: '' }]);
    setChannelQuery('');
    setChannelId(details?.channels[0]?.id ?? '');
  }

  function editMessage(message: RoleMessage) {
    setEditing(message.messageId);
    setChannelId(message.channelId);
    setChannelQuery('');
    setContent(message.content);
    setMappings(message.mappings.map((mapping) => ({ ...mapping })));
    setError('');
  }

  async function saveMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutate(
        `${base}/reaction-roles${editing ? `/${editing}` : ''}`,
        editing ? 'PUT' : 'POST',
        { channelId, content, mappings },
      );
      const messages = await getJson<RoleMessage[]>(`${base}/reaction-roles`);
      setDetails((current) => (current ? { ...current, messages } : current));
      clearEditor();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!window.confirm('Delete this reaction-role message from Discord?'))
      return;
    setBusy(true);
    setError('');
    try {
      await mutate(`${base}/reaction-roles/${messageId}`, 'DELETE');
      setDetails((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter(
                (message) => message.messageId !== messageId,
              ),
            }
          : current,
      );
      if (editing === messageId) clearEditor();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  }

  function updateMapping(index: number, patch: Partial<Mapping>) {
    setMappings((current) =>
      current.map((mapping, itemIndex) =>
        itemIndex === index ? { ...mapping, ...patch } : mapping,
      ),
    );
  }

  if (!details)
    return (
      <section className="content-card">
        {error ? (
          <>
            <p className="error-message" role="alert">
              {error}
            </p>
            <button
              className="secondary-button"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </button>
          </>
        ) : (
          <p role="status">Loading server settings…</p>
        )}
      </section>
    );
  const channels = details.channels.filter((channel) =>
    `${channel.category ?? ''} ${channel.name}`
      .toLowerCase()
      .includes(channelQuery.toLowerCase()),
  );
  return (
    <>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="feature-grid">
        <section className="content-card feature-card">
          <h2>Server prefix</h2>
          <form onSubmit={(event) => void savePrefix(event)}>
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
              <button className="secondary-button" disabled={savingPrefix}>
                Save prefix
              </button>
              <button
                type="button"
                className="text-button"
                disabled={savingPrefix || !details.settings.isCustom}
                onClick={() => void savePrefix()}
              >
                Reset
              </button>
            </div>
            <p className="field-help">
              {details.settings.isCustom
                ? 'Custom prefix for this server.'
                : 'Using the default bot prefix.'}
            </p>
          </form>
          <div className="configured-messages">
            <h2>Community writing channel</h2>
            <p className="form-description">
              /group-prompt posts here, never in an arbitrary channel. The bot
              needs View Channel, Send Messages, and Embed Links.
            </p>
            <form onSubmit={(event) => void saveWritingChannel(event)}>
              <label className="field-label" htmlFor="writing-channel">
                Dedicated writing channel
              </label>
              <select
                id="writing-channel"
                className="server-select"
                value={writingChannelId}
                onChange={(event) => setWritingChannelId(event.target.value)}
              >
                <option value="">Disabled — no channel configured</option>
                {writingChannelId &&
                  !details.writing.channels.some(
                    (channel) => channel.id === writingChannelId,
                  ) && (
                    <option value={writingChannelId}>
                      Current channel (unavailable)
                    </option>
                  )}
                {details.writing.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.category ? `${channel.category} / ` : ''}#{' '}
                    {channel.name}
                  </option>
                ))}
              </select>
              <button
                className="secondary-button form-submit"
                disabled={savingWriting}
              >
                {savingWriting ? 'Saving…' : 'Save writing channel'}
              </button>
              <p className="field-help">
                {details.writing.channelId
                  ? 'Community prompt posting is configured.'
                  : 'Group prompts are disabled until a manager chooses a channel.'}
              </p>
            </form>
          </div>
        </section>
        <section className="content-card feature-card">
          <p className="eyebrow">SELF-ASSIGNABLE ROLES</p>
          <h2>
            {editing
              ? 'Edit reaction-role message'
              : 'Create reaction-role message'}
          </h2>
          <p className="form-description">
            Members gain a role when they react and lose it when they remove
            their reaction. Editing does not retroactively change roles already
            assigned.
          </p>
          {details.channels.length === 0 || details.roles.length === 0 ? (
            <p className="empty-state">
              The bot needs Manage Roles, an accessible text channel, and a role
              above the roles being offered.
            </p>
          ) : (
            <form onSubmit={(event) => void saveMessage(event)}>
              <fieldset className="reaction-form" disabled={busy}>
                <label className="field-label" htmlFor="channel-search">
                  Search channels
                </label>
                <input
                  id="channel-search"
                  className="text-input"
                  placeholder="Channel or category name"
                  value={channelQuery}
                  disabled={!!editing}
                  onChange={(event) => {
                    setChannelQuery(event.target.value);
                    setChannelId('');
                  }}
                />
                <label className="field-label" htmlFor="message-channel">
                  Post in
                </label>
                <select
                  id="message-channel"
                  className="server-select"
                  value={channelId}
                  required
                  disabled={!!editing}
                  onChange={(event) => setChannelId(event.target.value)}
                >
                  <option value="">Choose channel</option>
                  {editing &&
                    !channels.some((channel) => channel.id === channelId) && (
                      <option value={channelId}>
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
                {!channels.length && (
                  <p className="field-help">No matching channels.</p>
                )}
                {editing && (
                  <p className="field-help">
                    An existing message stays in its original channel.
                  </p>
                )}
                <label className="field-label" htmlFor="reaction-content">
                  Message
                </label>
                <textarea
                  id="reaction-content"
                  className="text-input message-textarea"
                  value={content}
                  maxLength={2000}
                  required
                  onChange={(event) => setContent(event.target.value)}
                />
                <p className="field-help">
                  Choose a default/server emoji, paste a Unicode emoji, or enter
                  a code such as :heart: or :server_emoji_name:.
                </p>
                <div className="mapping-heading">
                  <span className="field-label">
                    Emoji and role pairs (up to 10)
                  </span>
                  {mappings.length < 10 && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        setMappings((current) => [
                          ...current,
                          { emoji: '', roleId: '' },
                        ])
                      }
                    >
                      Add pair
                    </button>
                  )}
                </div>
                {mappings.map((mapping, index) => (
                  <div className="mapping-row" key={`${editing}-${index}`}>
                    <EmojiInput
                      index={index}
                      value={mapping.emoji}
                      emojis={details.emojis}
                      onChange={(emoji) => updateMapping(index, { emoji })}
                    />
                    <select
                      className="server-select"
                      aria-label={`Role ${index + 1}`}
                      required
                      value={mapping.roleId}
                      onChange={(event) =>
                        updateMapping(index, { roleId: event.target.value })
                      }
                    >
                      <option value="">Choose role</option>
                      {mapping.roleId &&
                        !details.roles.some(
                          (role) => role.id === mapping.roleId,
                        ) && (
                          <option value={mapping.roleId}>
                            Unavailable role
                          </option>
                        )}
                      {details.roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {mappings.length > 1 && (
                      <button
                        className="remove-mapping"
                        type="button"
                        aria-label={`Remove mapping ${index + 1}`}
                        onClick={() =>
                          setMappings((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button className="primary-button form-submit">
                  {busy
                    ? 'Saving…'
                    : editing
                      ? 'Save changes'
                      : 'Publish message'}
                </button>
                {editing && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={clearEditor}
                  >
                    Cancel editing
                  </button>
                )}
              </fieldset>
            </form>
          )}
          <div className="configured-messages">
            <h3>Configured messages</h3>
            {details.messages.length === 0 ? (
              <p className="empty-state">No reaction-role messages yet.</p>
            ) : (
              <ul className="configured-list">
                {details.messages.map((message) => (
                  <li key={message.messageId}>
                    <div>
                      <a
                        href={`https://discord.com/channels/${message.guildId}/${message.channelId}/${message.messageId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open message
                      </a>
                      <p className="message-preview">{message.content}</p>
                    </div>
                    <div className="message-actions">
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => editMessage(message)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-button danger-button"
                        disabled={busy}
                        onClick={() => void deleteMessage(message.messageId)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
