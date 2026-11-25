import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function jsonResponse(data: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
  } as Response;
}

function mockDashboard(hasManagedServers = true) {
  const prompt = {
    displayName: 'Test User',
    guildId: 'guild-1',
    guildName: 'Test Server',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  let mine = [
    { ...prompt, id: 'user-1:oc', kind: 'oc', content: 'My saved OC' },
    {
      ...prompt,
      id: 'user-1:fanfic',
      kind: 'fanfic',
      content: 'My saved fanfic',
    },
    {
      ...prompt,
      id: 'user-1:dm',
      guildId: null,
      guildName: null,
      kind: 'otp',
      content: 'My private DM prompt',
    },
  ];
  let server = [
    ...mine.filter((entry) => entry.guildId === 'guild-1'),
    {
      ...prompt,
      id: 'other:fanfic',
      displayName: 'Other User',
      kind: 'fanfic',
      content: 'Another member’s fanfic',
    },
  ];
  let messages = [
    {
      guildId: 'guild-1',
      channelId: 'channel-1',
      messageId: 'message-1',
      content: 'Pick a role',
      mappings: [{ emoji: '👍', roleId: 'role-1' }],
    },
  ];
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method === 'DELETE' && url.includes('/saved-prompts/')) {
      const id = decodeURIComponent(url.split('/').at(-1)!);
      mine = mine.filter((entry) => entry.id !== id);
      server = server.filter((entry) => entry.id !== id);
      return jsonResponse(null, 204);
    }
    if (url === '/api/guilds/guild-1/reaction-roles' && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as {
        channelId: string;
        content: string;
        mappings: { emoji: string; roleId: string }[];
      };
      messages.push({ ...body, guildId: 'guild-1', messageId: 'message-2' });
      return jsonResponse({ messageId: 'message-2' }, 201);
    }
    if (
      url.startsWith('/api/guilds/guild-1/reaction-roles/') &&
      method !== 'GET'
    ) {
      const id = url.split('/').at(-1);
      if (method === 'DELETE')
        messages = messages.filter((message) => message.messageId !== id);
      else {
        const body = JSON.parse(String(init?.body)) as {
          content: string;
          mappings: { emoji: string; roleId: string }[];
        };
        messages = messages.map((message) =>
          message.messageId === id ? { ...message, ...body } : message,
        );
      }
      return jsonResponse(null, 204);
    }
    if (url === '/api/guilds/guild-1/settings/writing' && method === 'PUT') {
      return jsonResponse(JSON.parse(String(init?.body)));
    }
    const responses: Record<string, unknown> = {
      '/api/me': { id: 'user-1', displayName: 'Test User', avatar: null },
      '/api/status': {
        online: true,
        username: 'DimSum',
        guildCount: 2,
        uptimeMs: 3_900_000,
      },
      '/api/guilds': [
        {
          id: 'guild-1',
          name: 'Test Server',
          icon: null,
          botPresent: true,
          canManage: hasManagedServers,
        },
        {
          id: 'guild-2',
          name: 'Member Server',
          icon: null,
          botPresent: true,
          canManage: false,
        },
        {
          id: 'guild-3',
          name: 'Absent Server',
          icon: null,
          botPresent: false,
          canManage: hasManagedServers,
        },
      ],
      '/api/commands': [
        {
          name: 'reactionroles',
          description: 'Create a reaction-role message',
          category: 'Administration & utilities',
        },
        {
          name: 'prompt',
          description: 'Generate a story starter',
          category: 'Anti-writer block',
        },
      ],
      '/api/me/saved-prompts': mine,
      '/api/guilds/guild-1/saved-prompts': server,
      '/api/guilds/guild-1/settings': { prefix: '!', isCustom: false },
      '/api/guilds/guild-1/settings/writing': {
        channelId: null,
        channels: [{ id: 'channel-1', name: 'general', category: null }],
      },
      '/api/guilds/guild-1/channels': [
        { id: 'channel-1', name: 'general', category: null },
        { id: 'channel-2', name: 'science', category: 'Topics' },
      ],
      '/api/guilds/guild-1/roles': [{ id: 'role-1', name: 'Member' }],
      '/api/guilds/guild-1/emojis': [
        { name: 'heart', value: '❤️', imageUrl: null, source: 'default' },
        {
          name: 'dimsum',
          value: '<:dimsum:123>',
          imageUrl: 'https://cdn.discordapp.com/emojis/123.png',
          source: 'server',
        },
      ],
      '/api/guilds/guild-1/reaction-roles': messages,
    };
    if (method === 'GET' && url in responses)
      return jsonResponse(responses[url]);
    throw new Error(`Unexpected dashboard request: ${method} ${url}`);
  });
}

describe('dashboard', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('offers Discord sign-in when the user has no session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 401));
    render(<App />);
    expect(
      await screen.findByRole('link', { name: /continue with discord/i }),
    ).toHaveAttribute('href', '/api/auth/login');
  });

  test('Overview links to managed servers and the full server card opens settings', async () => {
    mockDashboard();
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Online')).toBeInTheDocument();
    const navigation = within(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    );
    expect(
      navigation.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual(['#/', '#/servers']);
    expect(navigation.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.queryByRole('heading', { name: 'Your servers' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Prefix (1–5 characters)'),
    ).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/settings'),
      expect.anything(),
    );
    await user.click(navigation.getByRole('link', { name: 'My servers' }));
    await screen.findByRole('heading', { name: 'Your servers' });
    expect(screen.queryByText('Member Server')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Absent Server: bot not added' }),
    ).toBeDisabled();
    expect(
      navigation.getByRole('link', { name: 'My servers' }),
    ).toHaveAttribute('aria-current', 'page');
    const serverCard = screen.getByRole('link', { name: 'Open Test Server' });
    expect(screen.getByText('Test Server').closest('a')).toBe(serverCard);
    expect(within(serverCard).getByText('Manage server')).toBeInTheDocument();
    serverCard.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByLabelText('Prefix (1–5 characters)')).toHaveValue(
      '!',
    );
    expect(
      screen.queryByRole('heading', { name: 'Your servers' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Overview' }));
    expect(await screen.findByText('Online')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Your servers' }),
    ).not.toBeInTheDocument();
  });

  test('My servers supports direct navigation and an empty managed-server list', async () => {
    mockDashboard(false);
    window.location.hash = '#/servers';
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'My servers' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No servers where you have Administrator or Manage Server permission were found.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Test Server')).not.toBeInTheDocument();
    expect(screen.queryByText('Member Server')).not.toBeInTheDocument();
  });
  test('settings search channels, pick emojis, and edit, publish, and delete configured messages', async () => {
    mockDashboard();
    window.location.hash = '#/servers/guild-1/settings';
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('heading', { name: 'Configured messages' });
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Message')).toHaveValue('Pick a role');
    expect(screen.getByLabelText('Post in')).toBeDisabled();
    await user.clear(screen.getByLabelText('Message'));
    await user.type(screen.getByLabelText('Message'), 'Edited role message');
    await user.clear(screen.getByLabelText('Emoji 1'));
    await user.type(screen.getByLabelText('Emoji 1'), ':heart:');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Edited role message');
    expect(fetch).toHaveBeenCalledWith(
      '/api/guilds/guild-1/reaction-roles/message-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          channelId: 'channel-1',
          content: 'Edited role message',
          mappings: [{ emoji: ':heart:', roleId: 'role-1' }],
        }),
      }),
    );
    await user.type(screen.getByLabelText('Search channels'), 'sci');
    expect(
      within(screen.getByLabelText('Post in')).queryByRole('option', {
        name: '# general',
      }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Post in'), 'channel-2');
    await user.type(screen.getByLabelText('Message'), 'A fresh role message');
    await user.click(screen.getByText('Choose emoji 1'));
    await user.type(screen.getByLabelText('Search emojis 1'), 'dimsum');
    expect(
      screen.queryByRole('button', {
        name: 'Use default emoji heart for pair 1',
      }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: 'Use server emoji dimsum for pair 1',
      }),
    );
    expect(screen.getByLabelText('Emoji 1')).toHaveValue('<:dimsum:123>');
    await user.clear(screen.getByLabelText('Search emojis 1'));
    await user.click(
      screen.getByRole('button', {
        name: 'Use default emoji heart for pair 1',
      }),
    );
    expect(screen.getByLabelText('Emoji 1')).toHaveValue('❤️');
    await user.selectOptions(screen.getByLabelText('Role 1'), 'role-1');
    await user.click(screen.getByRole('button', { name: 'Publish message' }));
    const published = await screen.findByText('A fresh role message');
    expect(fetch).toHaveBeenCalledWith(
      '/api/guilds/guild-1/reaction-roles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          channelId: 'channel-2',
          content: 'A fresh role message',
          mappings: [{ emoji: '❤️', roleId: 'role-1' }],
        }),
      }),
    );
    await user.click(
      within(published.closest('li')!).getByRole('button', { name: 'Delete' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText('A fresh role message'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Edited role message')).toBeInTheDocument();
  });

  test('Overview groups commands and managers configure or disable the community writing channel', async () => {
    mockDashboard();
    const user = userEvent.setup();
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Anti-writer block' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Administration & utilities' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'My servers' }));
    await user.click(
      await screen.findByRole('link', { name: 'Open Test Server' }),
    );
    const select = await screen.findByLabelText('Dedicated writing channel');
    await user.selectOptions(select, 'channel-1');
    await user.click(
      screen.getByRole('button', { name: 'Save writing channel' }),
    );
    expect(
      await screen.findByText('Community prompt posting is configured.'),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/guilds/guild-1/settings/writing',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ channelId: 'channel-1' }),
      }),
    );
    await user.selectOptions(select, '');
    await user.click(
      screen.getByRole('button', { name: 'Save writing channel' }),
    );
    expect(
      await screen.findByText(
        'Group prompts are disabled until a manager chooses a channel.',
      ),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/guilds/guild-1/settings/writing',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ channelId: null }),
      }),
    );
  });

  test('server prompt tabs filter and delete own saves and other members’ server saves', async () => {
    mockDashboard();
    window.location.hash = '#/servers/guild-1/saved';
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('My saved OC');
    expect(screen.queryByText('My private DM prompt')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Another member’s fanfic'),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Prompt type'), 'oc');
    expect(screen.queryByText('My saved fanfic')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Delete saved prompt by Test User' }),
    );
    await waitFor(() =>
      expect(screen.queryByText('My saved OC')).not.toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/me/saved-prompts/user-1%3Aoc',
      expect.objectContaining({ method: 'DELETE' }),
    );
    await user.click(screen.getByRole('tab', { name: 'Server prompts' }));
    await user.selectOptions(screen.getByLabelText('Prompt type'), 'fanfic');
    await screen.findByText('Another member’s fanfic');
    await user.click(
      screen.getByRole('button', { name: 'Delete saved prompt by Other User' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText('Another member’s fanfic'),
      ).not.toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledWith(
      '/api/guilds/guild-1/saved-prompts/other%3Afanfic',
      expect.objectContaining({ method: 'DELETE' }),
    );
    await user.click(screen.getByRole('link', { name: 'My saved prompts' }));
    expect(await screen.findByText('My private DM prompt')).toBeInTheDocument();
  });

  test('ordinary members can access their saves but not server management', async () => {
    mockDashboard();
    window.location.hash = '#/servers/guild-2/saved';
    render(<App />);
    expect(
      await screen.findByRole('tab', { name: 'Server prompts' }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('link', { name: 'Server settings' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText('No saved prompts match this filter.'),
      ).toBeInTheDocument(),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/guilds/guild-2/'),
      expect.anything(),
    );
  });

  test('cancelled or failed deletion keeps the saved prompt visible', async () => {
    mockDashboard();
    window.location.hash = '#/saved';
    const user = userEvent.setup();
    render(<App />);
    const prompt = await screen.findByText('My saved OC');
    const deleteButton = within(prompt.closest('li')!).getByRole('button', {
      name: /delete saved prompt/i,
    });
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await user.click(deleteButton);
    expect(fetch).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'DELETE' }),
    );
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: 'Permission denied.' }, 403),
    );
    await user.click(deleteButton);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Permission denied.',
    );
    expect(screen.getByText('My saved OC')).toBeInTheDocument();
  });
});
