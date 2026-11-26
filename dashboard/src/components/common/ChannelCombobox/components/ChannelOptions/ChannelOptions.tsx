import type { ChannelComboboxState } from '../../useChannelCombobox';

export default function ChannelOptions({
  id,
  label,
  value,
  model,
}: {
  id: string;
  label: string;
  value: string;
  model: ChannelComboboxState;
}) {
  return (
    <div className="channel-combobox-menu">
      <ul
        ref={model.listRef}
        id={`${id}-options`}
        role="listbox"
        aria-label={label}
      >
        {model.options.map((option, index) => (
          <li
            id={`${id}-option-${index}`}
            key={option.id}
            role="option"
            aria-selected={value === option.id}
            data-active={model.highlightedIndex === index}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => model.setActiveIndex(index)}
            onClick={() => model.choose(option.id)}
          >
            {option.label}
          </li>
        ))}
      </ul>
      {model.options.length === 0 && (
        <p className="field-help" role="status">
          No matching channels.
        </p>
      )}
    </div>
  );
}
