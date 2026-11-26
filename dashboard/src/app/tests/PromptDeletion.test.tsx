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

test('cancelled or failed deletion keeps the saved prompt visible', async () => {
  mockDashboard();
  window.location.hash = '#/saved';
  const user = userEvent.setup();
  render(<App />);
  const prompt = await screen.findByText('My saved OC');
  const deleteButton = within(prompt.closest('li')!).getByRole('button', {
    name: /delete saved prompt/i,
  });
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  await user.click(deleteButton);
  expect(fetch).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ method: 'DELETE' }),
  );
  vi.mocked(fetch).mockResolvedValueOnce(
    jsonResponse({ error: 'Permission denied.' }, 403),
  );
  await user.click(deleteButton);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Permission denied.',
  );
  expect(screen.getByText('My saved OC')).toBeInTheDocument();
});
