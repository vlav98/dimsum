import { expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import {
  jsonResponse,
  mockDashboard,
} from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('art commands and options are shown from the catalog', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('tab', { name: 'antiArtBlock' }));
  const panel = await screen.findByRole('tabpanel');
  expect(within(panel).getByText('/oc-art-vibe')).toBeInTheDocument();
  await user.click(within(panel).getByText('Options for /palette'));
  expect(within(panel).getByText('count')).toBeInTheDocument();
  expect(within(panel).getByText('Range: 2–8')).toBeInTheDocument();
  await user.click(
    within(panel).getByText('Options for /draw-this-in-palette'),
  );
  expect(within(panel).getByText('view_minutes')).toBeInTheDocument();
  expect(within(panel).getByText('submit_minutes')).toBeInTheDocument();
  expect(
    within(panel).getByRole('heading', { name: 'Drawing challenges' }),
  ).toBeInTheDocument();
  expect(
    within(panel)
      .getByRole('heading', { name: 'Drawing challenges' })
      .compareDocumentPosition(within(panel).getByText('/oc-art-vibe')) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await user.click(screen.getByRole('tab', { name: 'Productivity & sharing' }));
  expect(
    within(panel).queryByText('/draw-this-in-palette'),
  ).not.toBeInTheDocument();
  expect(
    within(panel).queryByRole('heading', { name: 'Drawing challenges' }),
  ).not.toBeInTheDocument();
});

test('managers can hide and end an active challenge after confirmation', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('tab', { name: 'antiArtBlock' }));
  expect(
    await screen.findByRole('link', { name: 'Open challenge thread' }),
  ).toHaveAttribute('href', 'https://discord.com/channels/guild-1/thread-1');
  await user.click(
    screen.getByRole('button', { name: 'Hide reference early' }),
  );
  expect(screen.getByText('Hide this reference now?')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(await screen.findByText('Reference hidden.')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Hide reference early' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'End challenge early' }));
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(await screen.findByText('Challenge ended.')).toBeInTheDocument();
  expect(screen.getByText('No active drawing challenges.')).toBeInTheDocument();
});

test('a failed challenge action is shown without claiming success', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('tab', { name: 'antiArtBlock' }));
  await screen.findByRole('button', { name: 'Hide reference early' });
  const original = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation((input, init) =>
    init?.method === 'POST'
      ? Promise.resolve(
          jsonResponse({ error: 'Could not hide reference' }, 502),
        )
      : original(input, init),
  );
  await user.click(
    screen.getByRole('button', { name: 'Hide reference early' }),
  );
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not hide reference',
  );
  expect(screen.queryByText('Reference hidden.')).not.toBeInTheDocument();
});
