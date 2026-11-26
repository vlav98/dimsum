import { expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('server prompt tabs filter and delete own saves and other members’ server saves', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/saved';
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText('My saved OC');
  expect(screen.queryByText('My private DM prompt')).not.toBeInTheDocument();
  expect(screen.queryByText('Another member’s fanfic')).not.toBeInTheDocument();
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
    screen.queryByRole('link', { name: 'Bot settings' }),
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
