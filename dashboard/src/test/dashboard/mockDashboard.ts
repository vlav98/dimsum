import { vi } from 'vitest';

export function jsonResponse(data: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
  } as Response;
}

export function mockDashboard(hasManagedServers = true) {
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
    if (
      [
        '/api/guilds/guild-1/settings/writing',
        '/api/guilds/guild-1/settings/nickname',
        '/api/guilds/guild-1/settings/daily',
      ].includes(url) &&
      method === 'PUT'
    ) {
      return jsonResponse(JSON.parse(String(init?.body)));
    }
    if (url === '/api/guilds/guild-1/settings/prefix' && method !== 'GET') {
      return jsonResponse(
        method === 'DELETE'
          ? { prefix: '!', isCustom: false }
          : { ...JSON.parse(String(init?.body)), isCustom: true },
      );
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
        {
          name: 'daily',
          description: 'Daily challenge',
          category: 'Productivity & sharing',
        },
        {
          name: 'group-prompt',
          description: 'Post a group prompt',
          category: 'Productivity & sharing',
        },
      ],
      '/api/me/saved-prompts': mine,
      '/api/guilds/guild-1/saved-prompts': server,
      '/api/guilds/guild-1/settings': { prefix: '!', isCustom: false },
      '/api/guilds/guild-1/settings/nickname': {
        nickname: null,
        username: 'DimSum',
      },
      '/api/guilds/guild-1/settings/daily': {
        enabled: false,
        channelId: null,
        time: '09:00',
        kind: 'prompt',
        lastPostedDate: null,
      },
      '/api/guilds/guild-1/settings/writing': {
        channelId: null,
        channels: [
          { id: 'channel-1', name: 'general', category: null },
          { id: 'channel-2', name: 'science', category: 'Topics' },
        ],
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
