import { expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('bot settings edit nickname and prefix separately from command settings', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/settings';
  const user = userEvent.setup();
  render(<App />);
  const nickname = await screen.findByLabelText('Bot nickname');
  expect(
    screen.queryByRole('heading', { name: 'Configured messages' }),
  ).not.toBeInTheDocument();
  await user.type(nickname, 'Dumpling');
  await user.click(screen.getByRole('button', { name: 'Save nickname' }));
  await screen.findByText('Nickname saved.');
  expect(fetch).toHaveBeenCalledWith(
    '/api/guilds/guild-1/settings/nickname',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ nickname: 'Dumpling' }),
    }),
  );
  const prefix = screen.getByLabelText('Prefix (1–5 characters)');
  await user.clear(prefix);
  await user.type(prefix, '??');
  await user.click(screen.getByRole('button', { name: 'Save prefix' }));
  await screen.findByText('Prefix saved.');
  expect(prefix).toHaveValue('??');
  await user.click(screen.getByRole('button', { name: 'Reset prefix' }));
  await waitFor(() => expect(prefix).toHaveValue('!'));
});
