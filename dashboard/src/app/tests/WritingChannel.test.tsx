import { expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('Overview groups commands and managers configure or disable the community writing channel', async () => {
  mockDashboard();
  const user = userEvent.setup();
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: 'antiArtBlock' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: 'Administration & utilities' }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'My servers' }));
  await user.click(
    await screen.findByRole('link', { name: 'Open Test Server' }),
  );
  await user.click(await screen.findByRole('link', { name: 'Commands' }));
  await user.click(
    await screen.findByRole('tab', { name: 'Productivity & sharing' }),
  );
  const select = await screen.findByRole('combobox', {
    name: 'Dedicated writing channel',
  });
  await user.type(select, 'CiE');
  const list = screen.getByRole('listbox', {
    name: 'Dedicated writing channel',
  });
  expect(
    within(list).getByRole('option', { name: 'Topics / # science' }),
  ).toBeInTheDocument();
  expect(
    within(list).queryByRole('option', { name: '# general' }),
  ).not.toBeInTheDocument();
  await user.clear(select);
  await user.type(select, 'topics');
  expect(
    within(list).getByRole('option', { name: 'Topics / # science' }),
  ).toBeInTheDocument();
  await user.clear(select);
  await user.click(within(list).getByRole('option', { name: '# general' }));
  await user.type(select, 'no-such-channel');
  expect(screen.getByText('No matching channels.')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(select).toHaveValue('# general');
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
  await user.click(select);
  await user.click(
    screen.getByRole('option', { name: 'Disabled — no channel configured' }),
  );
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
