import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Channel, ChannelComboboxProps } from './types';

function channelLabel(channel: Channel) {
  return `${channel.category ? `${channel.category} / ` : ''}# ${channel.name}`;
}

export function useChannelCombobox({
  channels,
  value,
  onChange,
  required = false,
  disabled = false,
  emptyLabel = 'Choose channel',
}: ChannelComboboxProps) {
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
    if (open)
      listRef.current
        ?.querySelector<HTMLElement>('[data-active="true"]')
        ?.scrollIntoView?.({ block: 'nearest' });
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
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) showOptions();
      else if (options.length) {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex(
          (highlightedIndex + direction + options.length) % options.length,
        );
      }
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (activeOption) choose(activeOption.id);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setQuery(null);
    }
  }
  return {
    query,
    setQuery,
    setActiveIndex,
    inputRef,
    listRef,
    selectedLabel,
    emptyLabel,
    options,
    open,
    highlightedIndex,
    activeOption,
    showOptions,
    choose,
    onKeyDown,
  };
}
export type ChannelComboboxState = ReturnType<typeof useChannelCombobox>;
