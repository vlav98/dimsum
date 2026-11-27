import type { CommandOption } from '../../../types/dashboard';

export default function CommandOptions({
  options,
}: {
  options: CommandOption[];
}) {
  return (
    <ul className="command-option-list">
      {options.map((option) => (
        <li key={option.name}>
          <code>{option.name}</code>{' '}
          {option.type !== 1 && option.type !== 2 && (
            <small>{option.required ? 'Required' : 'Optional'}</small>
          )}
          <p>{option.description}</p>
          {option.min_value !== undefined && option.max_value !== undefined && (
            <p>
              Range: {option.min_value}–{option.max_value}
            </p>
          )}
          {!!option.choices?.length && (
            <p>
              Choices:{' '}
              {option.choices
                .map((choice) =>
                  choice.name === String(choice.value)
                    ? choice.name
                    : `${choice.name} (${choice.value})`,
                )
                .join(', ')}
            </p>
          )}
          {!!option.options?.length && (
            <CommandOptions options={option.options} />
          )}
        </li>
      ))}
    </ul>
  );
}
