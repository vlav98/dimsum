import ChannelOptions from './components/ChannelOptions/ChannelOptions';
import type { ChannelComboboxProps } from './types';
import { useChannelCombobox } from './useChannelCombobox';
import './ChannelCombobox.css';

export type { Channel } from './types';

export default function ChannelCombobox(props: ChannelComboboxProps) {
  const { id, label, value, required, disabled } = props;
  const model = useChannelCombobox(props);
  return (
    <div
      className="channel-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          model.setQuery(null);
      }}
    >
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="channel-combobox-control">
        <input
          ref={model.inputRef}
          id={id}
          className="text-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={model.open}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            model.open && model.activeOption
              ? `${id}-option-${model.highlightedIndex}`
              : undefined
          }
          aria-required={required}
          autoComplete="off"
          disabled={disabled}
          placeholder={
            model.open ? 'Search channel or category name' : model.emptyLabel
          }
          value={model.query ?? model.selectedLabel}
          onFocus={model.showOptions}
          onClick={() => {
            if (!model.open) model.showOptions();
          }}
          onChange={(event) => {
            model.setQuery(event.target.value);
            model.setActiveIndex(0);
          }}
          onKeyDown={model.onKeyDown}
        />
        <span className="channel-combobox-arrow" aria-hidden="true">
          ▾
        </span>
        {model.open && (
          <ChannelOptions id={id} label={label} value={value} model={model} />
        )}
      </div>
    </div>
  );
}
