import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { jsonResponse, mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('completed challenges expose participant counts', async () => {
  mockDashboard();
  const original = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = String(input);
    if (url.endsWith('/art-challenges/history'))
      return Promise.resolve(jsonResponse([{ threadId: 'old', endedAt: 1800000000000 }]));
    if (url.endsWith('/old/participants'))
      return Promise.resolve(jsonResponse({ participants: 3 }));
    return original(input, init);
  });
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('tab', { name: 'antiArtBlock' }));
  const link = await screen.findByRole('link', { name: 'Open completed challenge thread' });
  expect(link).toHaveAttribute('href', 'https://discord.com/channels/guild-1/old');
  const buttons = screen.getAllByRole('button', { name: 'Count participants' });
  await user.click(buttons[buttons.length - 1]);
  expect(await screen.findByText('3 participants')).toBeInTheDocument();
});
