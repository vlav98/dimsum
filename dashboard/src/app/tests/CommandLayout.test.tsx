import { expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import commandStyles from '../../pages/Commands/Commands.css?inline';
import { mockDashboard } from '../../test/dashboard/mockDashboard';
import { setupDashboardTests } from '../../test/dashboard/setup';

setupDashboardTests();

test('command cards have vertical spacing below the theme tabs and catalog', async () => {
  mockDashboard();
  window.location.hash = '#/servers/guild-1/commands';
  const user = userEvent.setup();
  render(
    <>
      <style>{commandStyles}</style>
      <App />
    </>,
  );
  await user.click(
    await screen.findByRole('tab', { name: 'Productivity & sharing' }),
  );
  const panel = screen.getByRole('tabpanel');
  expect(
    within(panel).getByRole('heading', { name: 'Automatic daily posts' }),
  ).toBeInTheDocument();
  expect(
    within(panel).getByRole('heading', { name: 'Community writing channel' }),
  ).toBeInTheDocument();
  for (const container of [panel, panel.parentElement!]) {
    const style = getComputedStyle(container);
    expect(style.display).toBe('grid');
    expect(Number.parseFloat(style.rowGap)).toBeGreaterThan(0);
  }
});
