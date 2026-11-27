import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('command themes expose and save the daily schedule', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    await screen.findByRole('tab', { name: 'antiArtBlock' }),
  );
  expect(
    screen.queryByLabelText('Daily posting channel'),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: 'Productivity & sharing' }));
  await screen.findByLabelText('Enable daily posts');
  expect(
    screen.getByRole('tab', { name: 'Productivity & sharing' }),
  ).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByLabelText('Enable daily posts'));
  await user.type(
    screen.getByRole('combobox', { name: 'Daily posting channel' }),
    'ner',
  );
  await user.click(screen.getByRole('option', { name: '# general' }));
  await user.selectOptions(screen.getByLabelText('Daily content'), 'challenge');
  await user.clear(screen.getByLabelText('Posting time (UTC)'));
  await user.type(screen.getByLabelText('Posting time (UTC)'), '14:30');
  await user.click(screen.getByRole('button', { name: 'Save daily schedule' }));
  await screen.findByText('Daily schedule saved.');
  expect(fetch).toHaveBeenCalledWith(
    '/api/guilds/guild-1/settings/daily',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({
        enabled: true,
        channelId: 'channel-1',
        time: '14:30',
        kind: 'challenge',
        lastPostedDate: null,
      }),
    }),
  );
  expect(screen.queryByLabelText('Bot nickname')).not.toBeInTheDocument();
});
