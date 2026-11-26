import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabList from './TabList';

afterEach(cleanup);

test('tab navigation wraps, skips unavailable tabs, and supports Home and End', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <TabList
      label="Libraries"
      tabs={[
        { value: 'mine', label: 'Mine' },
        { value: 'unavailable', label: 'Unavailable', disabled: true },
        { value: 'server', label: 'Server' },
      ]}
      value="mine"
      onChange={onChange}
    />,
  );
  const mine = screen.getByRole('tab', { name: 'Mine' });
  const server = screen.getByRole('tab', { name: 'Server' });
  mine.focus();
  await user.keyboard('{ArrowRight}');
  expect(server).toHaveFocus();
  expect(onChange).toHaveBeenLastCalledWith('server');
  await user.keyboard('{ArrowRight}');
  expect(mine).toHaveFocus();
  await user.keyboard('{ArrowLeft}');
  expect(server).toHaveFocus();
  await user.keyboard('{Home}');
  expect(mine).toHaveFocus();
  await user.keyboard('{End}');
  expect(server).toHaveFocus();
});
