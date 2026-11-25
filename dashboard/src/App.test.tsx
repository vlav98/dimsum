import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

function jsonResponse(data: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
  } as Response;
}

describe('dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('offers Discord sign-in when the user has no session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 401));

    render(<App />);

    expect(await screen.findByRole('link', { name: /continue with discord/i }))
      .toHaveAttribute('href', '/api/auth/login');
  });

  test('shows bot status, server controls, and saved prompt sections', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === '/api/me') {
        return jsonResponse({
          id: 'user-1',
          username: 'test-user',
          displayName: 'Test User',
          avatar: null,
        });
      }
      if (url === '/api/status') {
        return jsonResponse({
          online: true,
          username: 'DimSum',
          guildCount: 2,
          uptimeMs: 3_900_000,
        });
      }
      if (url === '/api/guilds') {
        return jsonResponse([
          { id: 'guild-1', name: 'Test Server', icon: null, botPresent: true },
        ]);
      }
      if (url === '/api/commands') {
        return jsonResponse([
          { name: 'reactionroles', description: 'Create a reaction-role message' },
        ]);
      }
      if (url === '/api/me/saved-prompts') return jsonResponse([]);
      if (url.endsWith('/settings')) {
        return jsonResponse({ prefix: '!', isCustom: false });
      }
      if (url.endsWith('/saved-prompts')) return jsonResponse([]);
      if (url.endsWith('/reaction-roles')) return jsonResponse([]);
      if (url.endsWith('/channels')) {
        return jsonResponse([{ id: 'channel-1', name: 'general', category: null }]);
      }
      if (url.endsWith('/roles')) {
        return jsonResponse([{ id: 'role-1', name: 'Member', color: '#ffffff' }]);
      }
      throw new Error(`Unexpected dashboard request: ${url}`);
    });

    render(<App />);

    expect(await screen.findByText('Online')).toBeInTheDocument();
    expect(screen.getByLabelText('Select a server')).toHaveValue('guild-1');
    expect(screen.getByLabelText('Prefix (1–5 characters)')).toHaveValue('!');
    expect(await screen.findByRole('heading', { name: 'Create reaction-role message' }))
      .toBeInTheDocument();
    expect(screen.getByLabelText('Emoji 1')).toBeInTheDocument();
    expect(screen.getByText('My saved prompts')).toBeInTheDocument();
    expect(screen.getByText('/reactionroles')).toBeInTheDocument();
  });
});
