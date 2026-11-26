import { useState } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChannelCombobox from './ChannelCombobox';

const channels = [
  { id: 'general', name: 'general', category: null },
  { id: 'science', name: 'science-chat', category: 'Creative topics' },
];

afterEach(cleanup);

function Selector({
  initial = '',
  required = false,
}: {
  initial?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ChannelCombobox
      id="channel"
      label="Channel"
      channels={channels}
      value={value}
      onChange={setValue}
      required={required}
    />
  );
}

test('typing opens visible substring matches and clicking selects a channel', async () => {
  const user = userEvent.setup();
  render(<Selector />);
  const input = screen.getByRole('combobox', { name: 'Channel' });
  await user.type(input, 'IEn');
  expect(input).toHaveAttribute('aria-expanded', 'true');
  expect(
    screen.getByRole('option', { name: 'Creative topics / # science-chat' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('option', { name: '# general' }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('option', { name: 'Creative topics / # science-chat' }),
  );
  expect(input).toHaveValue('Creative topics / # science-chat');
  expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('keyboard selection, empty results, Escape and blur preserve the chosen channel', async () => {
  const user = userEvent.setup();
  render(
    <>
      <Selector initial="general" />
      <button>Outside</button>
    </>,
  );
  const input = screen.getByRole('combobox', { name: 'Channel' });
  await user.type(input, 'topics');
  expect(input.getAttribute('aria-activedescendant')).toBe(
    screen.getByRole('option').id,
  );
  await user.keyboard('{Enter}');
  expect(input).toHaveValue('Creative topics / # science-chat');
  await user.type(input, 'missing-channel');
  expect(screen.getByRole('status')).toHaveTextContent('No matching channels.');
  await user.keyboard('{Escape}');
  expect(input).toHaveValue('Creative topics / # science-chat');
  await user.type(input, 'general');
  await user.click(screen.getByRole('button', { name: 'Outside' }));
  expect(input).toHaveValue('Creative topics / # science-chat');
  await user.click(input);
  await user.keyboard('{ArrowUp}{Enter}');
  expect(input).toHaveValue('# general');
});

test('a required channel must be selected rather than entered as free text', async () => {
  const user = userEvent.setup();
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(
    <form onSubmit={submit}>
      <Selector required />
      <button>Save</button>
    </form>,
  );
  const input = screen.getByRole('combobox', { name: 'Channel' });
  await user.type(input, 'general');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(submit).not.toHaveBeenCalled();
  expect(input).toBeInvalid();
  await user.type(input, 'ner');
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(submit).toHaveBeenCalledOnce();
});
