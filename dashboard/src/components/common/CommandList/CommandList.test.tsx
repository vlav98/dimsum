import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandList from './CommandList';

test('new commands and nested options render without a custom component', async () => {
  const user = userEvent.setup();
  render(
    <CommandList
      commands={[
        {
          name: 'future-command',
          description: 'A new tool',
          options: [
            {
              type: 1,
              name: 'make',
              description: 'Make something',
              options: [
                {
                  type: 3,
                  name: 'style',
                  description: 'Choose style',
                  required: true,
                  choices: [{ name: 'Bright', value: 'bright' }],
                },
              ],
            },
          ],
        },
      ]}
    />,
  );
  await user.click(screen.getByText('Options for /future-command'));
  expect(screen.getByText('style')).toBeInTheDocument();
  expect(screen.getByText('Required')).toBeInTheDocument();
  expect(screen.getByText('Choices: Bright (bright)')).toBeInTheDocument();
});
