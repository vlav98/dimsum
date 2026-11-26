import { useEffect, useRef, useState } from 'react';
import './ChannelCombobox.css';

export type Channel = { id: string; name: string; category: string | null };

function channelLabel(channel: Channel) {
  return `${channel.category ? `${channel.category} / ` : ''}# ${channel.name}`;
}

export default function ChannelCombobox({
  id,
  label,
  channels,
  value,
  onChange,
  emptyLabel = 'Choose channel',
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  channels: Channel[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = channels.find((channel) => channel.id === value);
  const selectedLabel = selected
    ? channelLabel(selected)
    : value
      ? 'Current channel (unavailable)'
      : '';
  const search = (query ?? '').trim().toLowerCase();
  const options = [
    ...(!search ? [{ id: '', label: emptyLabel }] : []),
    ...channels
      .filter((channel) => channelLabel(channel).toLowerCase().includes(search))
      .map((channel) => ({ id: channel.id, label: channelLabel(channel) })),
  ];
  const open = query !== null && !disabled;
  const highlightedIndex = Math.min(activeIndex, options.length - 1);
  const activeOption = options[highlightedIndex];

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && !value ? 'Select a channel from the list.' : '',
    );
  }, [required, value]);

  useEffect(() => {
    if (open) {
      listRef.current
        ?.querySelector<HTMLElement>('[data-active="true"]')
        ?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [open, query, highlightedIndex]);

  function showOptions() {
    setQuery('');
    setActiveIndex(
      Math.max(0, channels.findIndex((channel) => channel.id === value) + 1),
    );
  }

  function choose(channelId: string) {
    onChange(channelId);
    setQuery(null);
  }

  return (
    <div
      className="channel-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setQuery(null);
      }}
    >
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="channel-combobox-control">
        <input
          ref={inputRef}
          id={id}
          className="text-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            open && activeOption
              ? `${id}-option-${highlightedIndex}`
              : undefined
          }
          aria-required={required}
          autoComplete="off"
          disabled={disabled}
          placeholder={open ? 'Search channel or category name' : emptyLabel}
          value={query ?? selectedLabel}
          onFocus={showOptions}
          onClick={() => {
            if (!open) showOptions();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              if (!open) showOptions();
              else if (options.length) {
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                setActiveIndex(
                  (highlightedIndex + direction + options.length) %
                    options.length,
                );
              }
            } else if (event.key === 'Enter' && open) {
              event.preventDefault();
              if (activeOption) choose(activeOption.id);
            } else if (event.key === 'Escape' && open) {
              event.preventDefault();
              setQuery(null);
            }
          }}
        />
        <span className="channel-combobox-arrow" aria-hidden="true">
          ▾
        </span>
        {open && (
          <div className="channel-combobox-menu">
            <ul
              ref={listRef}
              id={`${id}-options`}
              role="listbox"
              aria-label={label}
            >
              {options.map((option, index) => (
                <li
                  id={`${id}-option-${index}`}
                  key={option.id}
                  role="option"
                  aria-selected={value === option.id}
                  data-active={highlightedIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option.id)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
            {options.length === 0 && (
              <p className="field-help" role="status">
                No matching channels.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
