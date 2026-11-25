import { FormEvent, useEffect, useState } from 'react';
import './App.css';

type User = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
};

type BotStatus = {
  online: boolean;
  username: string | null;
  guildCount: number;
  uptimeMs: number | null;
};

type Guild = {
  id: string;
  name: string;
  icon: string | null;
  botPresent: boolean;
};

type Command = {
  name: string;
  description: string;
};

type SavedPrompt = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  guildName: string | null;
  kind: 'random' | 'fanfic' | 'otp' | 'oc' | 'other';
  content: string;
  createdAt: string;
};

type DashboardData = {
  status: BotStatus;
  guilds: Guild[];
  commands: Command[];
  savedPrompts: SavedPrompt[];
};

type Channel = {
  id: string;
  name: string;
  category: string | null;
};

type Role = {
  id: string;
  name: string;
  color: string;
};

type ReactionRoleMessage = {
  guildId: string;
  channelId: string;
  messageId: string;
  content: string;
  mappings: { emoji: string; roleId: string }[];
  createdAt: string;
};

type GuildSettings = {
  prefix: string;
  isCustom: boolean;
};

type GuildDetails = {
  settings: GuildSettings;
  channels: Channel[];
  roles: Role[];
  reactionRoleMessages: ReactionRoleMessage[];
  savedPrompts: SavedPrompt[];
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function sendJson<T>(
  url: string,
  method: 'PUT' | 'POST',
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = (await response.json()) as { error?: string };
    throw new Error(result.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function formatUptime(uptimeMs: number | null): string {
  if (uptimeMs === null) return 'Unavailable';
  const totalMinutes = Math.floor(uptimeMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

function PromptList({ prompts, empty }: { prompts: SavedPrompt[]; empty: string }) {
  if (prompts.length === 0) return <p className="empty-state">{empty}</p>;
  const kindLabels = {
    random: 'Random prompt',
    fanfic: 'Fanfic prompt',
    otp: 'OTP prompt',
    oc: 'OC generator',
    other: 'Other',
  };
  return (
    <ul className="saved-prompt-list">
      {prompts.map((prompt) => (
        <li className="saved-prompt" key={prompt.id}>
          <div className="saved-prompt-meta">
            <strong>{prompt.displayName}</strong>
            <span>
              {kindLabels[prompt.kind]} · {prompt.guildName ?? 'Direct message'} ·{' '}
              {new Date(prompt.createdAt).toLocaleDateString()}
            </span>
          </div>
          <pre>{prompt.content}</pre>
        </li>
      ))}
    </ul>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [guildDetails, setGuildDetails] = useState<GuildDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [featureError, setFeatureError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [prefixInput, setPrefixInput] = useState('');
  const [messageChannelId, setMessageChannelId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [roleMappings, setRoleMappings] = useState([{ emoji: '', roleId: '' }]);
  const [savingPrefix, setSavingPrefix] = useState(false);
  const [publishingMessage, setPublishingMessage] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const profileResponse = await fetch('/api/me', {
          credentials: 'same-origin',
        });
        if (profileResponse.status === 401) {
          if (active) {
            setUser(null);
            setDashboard(null);
          }
          return;
        }
        if (!profileResponse.ok) {
          throw new Error(`Could not load your profile (${profileResponse.status}).`);
        }
        const profile = (await profileResponse.json()) as User;
        if (active) setUser(profile);
        const [status, guilds, commands, savedPrompts] = await Promise.all([
          getJson<BotStatus>('/api/status'),
          getJson<Guild[]>('/api/guilds'),
          getJson<Command[]>('/api/commands'),
          getJson<SavedPrompt[]>('/api/me/saved-prompts'),
        ]);
        if (active) {
          setDashboard({ status, guilds, commands, savedPrompts });
          setSelectedGuildId((current) =>
            guilds.some((guild) => guild.id === current)
              ? current
              : (guilds[0]?.id ?? ''),
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load the dashboard.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const selectedGuild = dashboard?.guilds.find(
    (guild) => guild.id === selectedGuildId,
  );

  useEffect(() => {
    let active = true;
    if (!user || !selectedGuild) {
      setGuildDetails(null);
      return () => {
        active = false;
      };
    }

    setGuildDetails(null);
    setFeatureError('');
    const guildId = selectedGuild.id;
    const botPresent = selectedGuild.botPresent;
    const base = `/api/guilds/${guildId}`;
    async function loadGuildDetails() {
      try {
        const [
          settings,
          savedPrompts,
          reactionRoleMessages,
          channels,
          roles,
        ] = await Promise.all([
          getJson<GuildSettings>(`${base}/settings`),
          getJson<SavedPrompt[]>(`${base}/saved-prompts`),
          getJson<ReactionRoleMessage[]>(`${base}/reaction-roles`),
          botPresent
            ? getJson<Channel[]>(`${base}/channels`)
            : Promise.resolve([]),
          botPresent
            ? getJson<Role[]>(`${base}/roles`)
            : Promise.resolve([]),
        ]);
        if (active) {
          setGuildDetails({
            settings,
            savedPrompts,
            reactionRoleMessages,
            channels,
            roles,
          });
          setPrefixInput(settings.prefix);
          setMessageChannelId((current) =>
            channels.some((channel) => channel.id === current)
              ? current
              : (channels[0]?.id ?? ''),
          );
        }
      } catch (loadError) {
        if (active) {
          setFeatureError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load this server’s dashboard settings.',
          );
        }
      }
    }

    void loadGuildDetails();
    return () => {
      active = false;
    };
  }, [selectedGuild?.id, selectedGuild?.botPresent, user?.id, refreshKey]);

  async function logout() {
    setError('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Sign-out failed (${response.status}).`);
      setUser(null);
      setDashboard(null);
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : 'Unable to sign out.',
      );
    }
  }

  async function savePrefix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGuild) return;
    setSavingPrefix(true);
    setFeatureError('');
    try {
      const settings = await sendJson<GuildSettings>(
        `/api/guilds/${selectedGuild.id}/settings/prefix`,
        'PUT',
        { prefix: prefixInput },
      );
      setGuildDetails((current) =>
        current ? { ...current, settings } : current,
      );
    } catch (saveError) {
      setFeatureError(
        saveError instanceof Error ? saveError.message : 'Could not save prefix.',
      );
    } finally {
      setSavingPrefix(false);
    }
  }

  async function resetPrefix() {
    if (!selectedGuild) return;
    setSavingPrefix(true);
    setFeatureError('');
    try {
      const response = await fetch(
        `/api/guilds/${selectedGuild.id}/settings/prefix`,
        { method: 'DELETE', credentials: 'same-origin' },
      );
      const settings = (await response.json()) as GuildSettings & { error?: string };
      if (!response.ok) throw new Error(settings.error ?? 'Could not reset prefix.');
      setPrefixInput(settings.prefix);
      setGuildDetails((current) =>
        current ? { ...current, settings } : current,
      );
    } catch (resetError) {
      setFeatureError(
        resetError instanceof Error ? resetError.message : 'Could not reset prefix.',
      );
    } finally {
      setSavingPrefix(false);
    }
  }

  async function createReactionRoleMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGuild) return;
    setPublishingMessage(true);
    setFeatureError('');
    try {
      await sendJson(
        `/api/guilds/${selectedGuild.id}/reaction-roles`,
        'POST',
        {
          channelId: messageChannelId,
          content: messageContent,
          mappings: roleMappings,
        },
      );
      setMessageContent('');
      setRoleMappings([{ emoji: '', roleId: '' }]);
      setRefreshKey((key) => key + 1);
    } catch (createError) {
      setFeatureError(
        createError instanceof Error
          ? createError.message
          : 'Could not publish reaction-role message.',
      );
    } finally {
      setPublishingMessage(false);
    }
  }

  async function removeReactionRoleMessage(messageId: string) {
    if (!selectedGuild) return;
    setFeatureError('');
    try {
      const response = await fetch(
        `/api/guilds/${selectedGuild.id}/reaction-roles/${messageId}`,
        { method: 'DELETE', credentials: 'same-origin' },
      );
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? 'Could not remove reaction-role message.');
      }
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      setFeatureError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not remove reaction-role message.',
      );
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <p className="loading-message" role="status">Loading dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-shell">
        <section className="welcome-card">
          <div className="brand-mark" aria-hidden="true">D</div>
          <p className="eyebrow">DIMSUM BOT</p>
          <h1>Your Discord, at a glance.</h1>
          <p className="intro">
            Manage reaction roles and server prefixes, and review saved writing
            prompts for servers you manage.
          </p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <a className="primary-button" href="/api/auth/login">
            <span aria-hidden="true">◉</span> Continue with Discord
          </a>
          <p className="privacy-note">
            Server changes require Manage Server permission. Saved prompts are
            visible to their author and server admins.
          </p>
        </section>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="page-shell">
        <header className="topbar">
          <a className="brand" href="/">DIMSUM <span>CONTROL PANEL</span></a>
          <button className="text-button" onClick={() => void logout()}>Sign out</button>
        </header>
        <section className="content-card error-card">
          <h1>Dashboard unavailable</h1>
          <p className="error-message" role="alert">
            {error || 'The dashboard data could not be loaded.'}
          </p>
          <button className="primary-button" onClick={() => setRefreshKey((key) => key + 1)}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=96`
    : null;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/">DIMSUM <span>CONTROL PANEL</span></a>
        <div className="account">
          {avatarUrl ? (
            <img className="avatar" src={avatarUrl} alt="" />
          ) : (
            <span className="avatar avatar-fallback" aria-hidden="true">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="account-name">{user.displayName}</span>
          <button className="text-button" onClick={() => void logout()}>Sign out</button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Welcome back, {user.displayName}</h1>
            <p className="intro">Manage server features and browse saved prompts.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Refresh
          </button>
        </div>

        {error && <p className="error-message inline-error" role="alert">{error}</p>}

        <div className="stat-grid">
          <article className="stat-card">
            <p className="eyebrow">BOT CONNECTION</p>
            <p className={`stat-value ${dashboard.status.online ? 'online' : 'offline'}`}>
              <span className="status-dot" />
              {dashboard.status.online ? 'Online' : 'Offline'}
            </p>
            <p className="stat-detail">{dashboard.status.username ?? 'DimSum'}</p>
          </article>
          <article className="stat-card">
            <p className="eyebrow">CONNECTED SERVERS</p>
            <p className="stat-value">{dashboard.status.guildCount}</p>
            <p className="stat-detail">servers the bot can currently see</p>
          </article>
          <article className="stat-card">
            <p className="eyebrow">BOT UPTIME</p>
            <p className="stat-value uptime">{formatUptime(dashboard.status.uptimeMs)}</p>
            <p className="stat-detail">since the current connection started</p>
          </article>
        </div>

        <div className="section-grid">
          <section className="content-card server-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR SERVERS</p>
                <h2>Server overview</h2>
              </div>
              <span className="count-pill">{dashboard.guilds.length}</span>
            </div>
            {dashboard.guilds.length === 0 ? (
              <p className="empty-state">
                No servers where you have Manage Server or Administrator permission
                were found.
              </p>
            ) : (
              <>
                <label className="field-label" htmlFor="server-select">Select a server</label>
                <select
                  id="server-select"
                  className="server-select"
                  value={selectedGuild?.id ?? ''}
                  onChange={(event) => setSelectedGuildId(event.target.value)}
                >
                  {dashboard.guilds.map((guild) => (
                    <option key={guild.id} value={guild.id}>{guild.name}</option>
                  ))}
                </select>
                {selectedGuild && (
                  <div className="selected-server">
                    {selectedGuild.icon ? (
                      <img
                        className="guild-icon"
                        src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png?size=96`}
                        alt=""
                      />
                    ) : (
                      <span className="guild-icon guild-fallback" aria-hidden="true">
                        {selectedGuild.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="guild-details">
                      <h3>{selectedGuild.name}</h3>
                      <p>
                        {selectedGuild.botPresent
                          ? 'DimSum is in this server'
                          : 'DimSum is not in this server'}
                      </p>
                    </div>
                    <span className={`presence-pill ${selectedGuild.botPresent ? 'present' : 'absent'}`}>
                      {selectedGuild.botPresent ? 'Added' : 'Not added'}
                    </span>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="content-card commands-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">AVAILABLE TO EVERYONE</p>
                <h2>Slash commands</h2>
              </div>
              <span className="count-pill">{dashboard.commands.length}</span>
            </div>
            <ul className="command-list">
              {dashboard.commands.map((command) => (
                <li className="command-item" key={command.name}>
                  <code>/{command.name}</code>
                  <span>{command.description}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="feature-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SERVER SETTINGS</p>
              <h2>{selectedGuild?.name ?? 'Select a server'}</h2>
            </div>
          </div>
          {featureError && <p className="error-message inline-error" role="alert">{featureError}</p>}
          {!selectedGuild ? (
            <p className="empty-state">Select a server to manage its settings.</p>
          ) : !guildDetails ? (
            <div className="loading-message" role="status">
              <p>{featureError || 'Loading server settings…'}</p>
              {featureError && (
                <button
                  className="secondary-button"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            <div className="feature-grid">
              <section className="content-card feature-card">
                <p className="eyebrow">MESSAGE COMMANDS</p>
                <h3>Server prefix</h3>
                <p className="form-description">
                  Prefix-based commands in this server will use this prefix.
                </p>
                <form className="prefix-form" onSubmit={(event) => void savePrefix(event)}>
                  <label className="field-label" htmlFor="prefix-input">Prefix (1–5 characters)</label>
                  <div className="inline-form">
                    <input
                      id="prefix-input"
                      className="text-input prefix-input"
                      value={prefixInput}
                      maxLength={5}
                      onChange={(event) => setPrefixInput(event.target.value)}
                    />
                    <button className="secondary-button" disabled={savingPrefix}>
                      {savingPrefix ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      className="text-button reset-button"
                      type="button"
                      disabled={savingPrefix || !guildDetails.settings.isCustom}
                      onClick={() => void resetPrefix()}
                    >
                      Reset
                    </button>
                  </div>
                  <p className="field-help">
                    {guildDetails.settings.isCustom
                      ? 'Custom prefix for this server.'
                      : 'Using the default prefix from bot/.env.'}
                  </p>
                </form>
              </section>

              <section className="content-card feature-card">
                <p className="eyebrow">SELF-ASSIGNABLE ROLES</p>
                <h3>Create reaction-role message</h3>
                <p className="form-description">
                  Members gain the selected role when they react; removing their
                  reaction removes that role.
                </p>
                {!selectedGuild.botPresent ? (
                  <p className="empty-state">
                    Add DimSum to this server before creating reaction-role
                    messages.
                  </p>
                ) : guildDetails.channels.length === 0 || guildDetails.roles.length === 0 ? (
                  <p className="empty-state">
                    The bot needs Manage Roles and access to a text channel where
                    it can send messages and add reactions. Its highest role must
                    be above the roles you want to offer.
                  </p>
                ) : (
                  <form className="reaction-form" onSubmit={(event) => void createReactionRoleMessage(event)}>
                    <label className="field-label" htmlFor="message-channel">Post in</label>
                    <select
                      id="message-channel"
                      className="server-select"
                      value={messageChannelId}
                      onChange={(event) => setMessageChannelId(event.target.value)}
                    >
                      {guildDetails.channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.category ? `${channel.category} / ` : ''}# {channel.name}
                        </option>
                      ))}
                    </select>
                    <label className="field-label" htmlFor="reaction-content">Message</label>
                    <textarea
                      id="reaction-content"
                      className="text-input message-textarea"
                      value={messageContent}
                      maxLength={2000}
                      required
                      onChange={(event) => setMessageContent(event.target.value)}
                    />
                    <div className="mapping-heading">
                      <span className="field-label">Emoji and role pairs (up to 10)</span>
                      {roleMappings.length < 10 && (
                        <button
                          className="text-button add-mapping"
                          type="button"
                          onClick={() => setRoleMappings((items) => [...items, { emoji: '', roleId: '' }])}
                        >
                          Add pair
                        </button>
                      )}
                    </div>
                    <div className="mapping-list">
                      {roleMappings.map((mapping, index) => (
                        <div className="mapping-row" key={`mapping-${index}`}>
                          <input
                            className="text-input emoji-input"
                            aria-label={`Emoji ${index + 1}`}
                            placeholder="Emoji"
                            maxLength={100}
                            value={mapping.emoji}
                            required
                            onChange={(event) =>
                              setRoleMappings((items) =>
                                items.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, emoji: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                          <select
                            className="server-select role-select"
                            aria-label={`Role ${index + 1}`}
                            value={mapping.roleId}
                            required
                            onChange={(event) =>
                              setRoleMappings((items) =>
                                items.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, roleId: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">Choose role</option>
                            {guildDetails.roles.map((role) => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                          {roleMappings.length > 1 && (
                            <button
                              className="remove-mapping"
                              type="button"
                              aria-label={`Remove mapping ${index + 1}`}
                              onClick={() => setRoleMappings((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button className="primary-button form-submit" disabled={publishingMessage}>
                      {publishingMessage ? 'Publishing…' : 'Publish message'}
                    </button>
                  </form>
                )}
                <div className="configured-messages">
                  <h4>Configured messages</h4>
                  {guildDetails.reactionRoleMessages.length === 0 ? (
                    <p className="field-help">No reaction-role messages yet.</p>
                  ) : (
                    <ul className="configured-list">
                      {guildDetails.reactionRoleMessages.map((message) => (
                        <li key={message.messageId}>
                          <div>
                            <a
                              href={`https://discord.com/channels/${message.guildId}/${message.channelId}/${message.messageId}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open message
                            </a>
                            <p>{message.mappings.map(({ emoji }) => emoji).join('  ')}</p>
                          </div>
                          <button
                            className="text-button"
                            onClick={() => void removeReactionRoleMessage(message.messageId)}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="content-card feature-card saved-prompts-card">
                <p className="eyebrow">VISIBLE TO SERVER ADMINS</p>
                <h3>Saved in {selectedGuild.name}</h3>
                <p className="form-description">
                  Authors can see their own saved prompts. Managers of this server
                  can see prompts saved from this server.
                </p>
                <PromptList
                  prompts={guildDetails.savedPrompts}
                  empty="No prompts have been saved from this server."
                />
              </section>
            </div>
          )}
        </section>

        <section className="content-card feature-card personal-prompts">
          <p className="eyebrow">YOUR LIBRARY</p>
          <h3>My saved prompts</h3>
          <p className="form-description">
            Prompts you saved with the button on a generated prompt.
          </p>
          <PromptList
            prompts={dashboard.savedPrompts}
            empty="You have not saved any prompts yet."
          />
        </section>

        <footer className="footer-note">
          Server changes require Manage Server. Saved prompts are visible to
          authors and admins of the server where they were saved.
        </footer>
      </section>
    </main>
  );
}

export default App;
