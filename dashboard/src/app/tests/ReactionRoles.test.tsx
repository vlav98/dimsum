import { expect, test } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('settings search channels, pick emojis, and edit, publish, and delete configured messages', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/commands';
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
  await user.click(screen.getByRole('tab', { name: 'antiArtBlock' }));
  await user.click(
    screen.getByRole('tab', { name: 'Administration & utilities' }),
  );
  expect(screen.getByLabelText('Message')).toHaveValue('Edited role message');
  expect(screen.getByLabelText('Emoji 1')).toHaveValue(':heart:');
  expect(screen.getByLabelText('Post in')).toBeDisabled();
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
    expect(screen.queryByText('A fresh role message')).not.toBeInTheDocument(),
  );
  expect(screen.getByText('Edited role message')).toBeInTheDocument();
});
