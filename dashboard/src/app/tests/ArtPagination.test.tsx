import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import {
  jsonResponse,
  mockDashboard,
} from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('active challenges are paginated', async () => {
  mockDashboard();
  const original = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation((input, init) =>
    String(input) === '/api/guilds/guild-1/art-challenges'
      ? Promise.resolve(
          jsonResponse(
            Array.from({ length: 6 }, (_, index) => ({
              threadId: `thread-${index}`,
              hideAt: 2000000000000,
              endAt: 2000003600000,
              hidden: false,
            })),
          ),
        )
      : original(input, init),
  );
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('tab', { name: 'antiArtBlock' }));
  expect(
    await screen.findAllByRole('link', { name: 'Open challenge thread' }),
  ).toHaveLength(5);
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(
    screen.getAllByRole('link', { name: 'Open challenge thread' }),
  ).toHaveLength(1);
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Previous' }));
  expect(
    screen.getAllByRole('link', { name: 'Open challenge thread' }),
  ).toHaveLength(5);
});

test('deadline edits are sent to the challenge API', async () => {
  mockDashboard();
  const original = vi.mocked(fetch).getMockImplementation()!;
  vi.mocked(fetch).mockImplementation((input, init) =>
    String(input).endsWith('/deadlines')
      ? Promise.resolve(jsonResponse(null, 204))
      : original(input, init),
  );
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('tab', { name: 'antiArtBlock' }));
  await user.click(
    await screen.findByRole('button', { name: 'Edit deadlines' }),
  );
  await user.clear(screen.getByLabelText('Submission deadline'));
  await user.type(
    screen.getByLabelText('Submission deadline'),
    '2035-01-01T12:00',
  );
  await user.click(screen.getByRole('button', { name: 'Save deadlines' }));
  expect(
    await screen.findByText('Challenge deadlines updated.'),
  ).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    '/api/guilds/guild-1/art-challenges/thread-1/deadlines',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({
        hideAt: 2000000000000,
        endAt: new Date('2035-01-01T12:00').getTime(),
      }),
    }),
  );
});
