import { expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import {
  mockDashboard,
  jsonResponse,
} from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

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
  expect(navigation.getByRole('link', { name: 'My servers' })).toHaveAttribute(
    'aria-current',
    'page',
  );
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
