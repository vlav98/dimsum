import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('offers Discord sign-in when the user has no session', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 401,
      ok: false,
    } as Response);

    render(<App />);

    expect(await screen.findByRole('link', { name: /continue with discord/i }))
      .toHaveAttribute('href', '/api/auth/login');
  });

  test('shows bot status, selectable server presence, and slash commands', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 'user-1',
          username: 'test-user',
          displayName: 'Test User',
          avatar: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          online: true,
          username: 'DimSum',
          guildCount: 2,
          uptimeMs: 3_900_000,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'guild-1', name: 'Test Server', icon: null, botPresent: true },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { name: 'fanficprompt', description: 'Generate a fanfic prompt' },
        ],
      } as Response);

    render(<App />);

    expect(await screen.findByText('Online')).toBeInTheDocument();
    expect(screen.getByLabelText('Select a server')).toHaveValue('guild-1');
    expect(screen.getByText('DimSum is in this server')).toBeInTheDocument();
    expect(screen.getByText('/fanficprompt')).toBeInTheDocument();
  });
});
