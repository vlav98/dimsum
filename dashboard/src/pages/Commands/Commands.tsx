import { FormEvent, useEffect, useState } from 'react';
import { errorMessage, getJson, Guild, mutate } from '../../lib/api';
import DailyPostSettings from './components/DailyPostSettings/DailyPostSettings';
import ChannelCombobox, {
  type Channel,
} from '../../components/common/ChannelCombobox/ChannelCombobox';
import EmojiInput, { type Emoji } from './components/EmojiInput/EmojiInput';

type Role = { id: string; name: string };
type Mapping = { emoji: string; roleId: string };
type RoleMessage = {
  guildId: string;
  messageId: string;
  channelId: string;
  content: string;
  mappings: Mapping[];
};
type WritingSettings = { channelId: string | null; channels: Channel[] };
type Details = {
  channels: Channel[];
  roles: Role[];
  emojis: Emoji[];
  messages: RoleMessage[];
  writing: WritingSettings;
};

export default function Commands({
  guild,
  commands,
}: {
  guild: Guild;
  commands: { name: string; description: string; category?: string }[];
}) {
  const categories = [
    ...new Set(commands.map((command) => command.category ?? 'Utilities')),
  ];
  const [category, setCategory] = useState(categories[0] ?? '');
  const activeCommands = commands.filter(
    (command) => (command.category ?? 'Utilities') === category,
  );
  const hasCommand = (name: string) =>
    activeCommands.some((command) => command.name === name);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
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
      getJson<Channel[]>(`${base}/channels`),
      getJson<Role[]>(`${base}/roles`),
      getJson<Emoji[]>(`${base}/emojis`),
      getJson<RoleMessage[]>(`${base}/reaction-roles`),
      getJson<WritingSettings>(`${base}/settings/writing`),
    ])
      .then(([channels, roles, emojis, messages, writing]) => {
        if (active) {
          setDetails({ channels, roles, emojis, messages, writing });
          setWritingChannelId(writing.channelId ?? '');
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
          <p role="status">Loading command settings…</p>
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
      <section className="content-card">
        <h2>Commands</h2>
        <div
          className="command-tabs"
          role="tablist"
          aria-label="Command themes"
        >
          {categories.map((name) => (
            <button
              type="button"
              className="secondary-button"
              role="tab"
              id={`theme-${categories.indexOf(name)}`}
              aria-controls="command-theme-panel"
              aria-selected={category === name}
              tabIndex={category === name ? 0 : -1}
              key={name}
              onClick={() => setCategory(name)}
              onKeyDown={(event) => {
                const index = categories.indexOf(name);
                let next: number;
                if (event.key === 'ArrowRight')
                  next = (index + 1) % categories.length;
                else if (event.key === 'ArrowLeft')
                  next = (index - 1 + categories.length) % categories.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = categories.length - 1;
                else return;
                event.preventDefault();
                setCategory(categories[next]);
                document.getElementById(`theme-${next}`)?.focus();
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </section>
      <div
        role="tabpanel"
        id="command-theme-panel"
        aria-labelledby={`theme-${categories.indexOf(category)}`}
      >
        <section className="content-card">
          <h3>{category}</h3>
          <ul className="command-list">
            {activeCommands.map((command) => (
              <li className="command-item" key={command.name}>
                <code>/{command.name}</code>
                <span>{command.description}</span>
              </li>
            ))}
          </ul>
          {!hasCommand('daily') &&
            !hasCommand('group-prompt') &&
            !hasCommand('writing-channel') &&
            !hasCommand('reactionroles') && (
              <p className="field-help">
                These commands are configured when you run them in Discord; no
                server-wide settings are needed.
              </p>
            )}
        </section>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="feature-grid">
          {hasCommand('daily') && (
            <DailyPostSettings
              guildId={guild.id}
              channels={details.writing.channels}
            />
          )}
          {(hasCommand('group-prompt') || hasCommand('writing-channel')) && (
            <section className="content-card feature-card">
              <div>
                <h2>Community writing channel</h2>
                <p className="form-description">
                  /group-prompt posts here, never in an arbitrary channel. The
                  bot needs View Channel, Send Messages, and Embed Links.
                </p>
                <form onSubmit={(event) => void saveWritingChannel(event)}>
                  <ChannelCombobox
                    id="writing-channel"
                    label="Dedicated writing channel"
                    channels={details.writing.channels}
                    value={writingChannelId}
                    onChange={setWritingChannelId}
                    emptyLabel="Disabled — no channel configured"
                    disabled={savingWriting}
                  />
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
          )}
          {hasCommand('reactionroles') && (
            <section className="content-card feature-card">
              <p className="eyebrow">SELF-ASSIGNABLE ROLES</p>
              <h2>
                {editing
                  ? 'Edit reaction-role message'
                  : 'Create reaction-role message'}
              </h2>
              <p className="form-description">
                Members gain a role when they react and lose it when they remove
                their reaction. Editing does not retroactively change roles
                already assigned.
              </p>
              {details.channels.length === 0 || details.roles.length === 0 ? (
                <p className="empty-state">
                  The bot needs Manage Roles, an accessible text channel, and a
                  role above the roles being offered.
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
                        !channels.some(
                          (channel) => channel.id === channelId,
                        ) && (
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
                      Choose a default/server emoji, paste a Unicode emoji, or
                      enter a code such as :heart: or :server_emoji_name:.
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
                            onClick={() =>
                              void deleteMessage(message.messageId)
                            }
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
          )}
        </div>
      </div>
    </>
  );
}
