import type { KeyboardEvent } from 'react';

type Tab<Value extends string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

export default function TabList<Value extends string>({
  tabs,
  value,
  onChange,
  label,
  className = 'tabs',
  tabClassName,
  idPrefix,
  panelId,
}: {
  tabs: Tab<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  label: string;
  className?: string;
  tabClassName?: string;
  idPrefix?: string;
  panelId?: string;
}) {
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const current = buttons.findIndex(
      (button) => button === document.activeElement,
    );
    let next: number;
    if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowLeft')
      next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next]?.focus();
    buttons[next]?.click();
  }

  return (
    <div
      className={className}
      role="tablist"
      aria-label={label}
      onKeyDown={navigate}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          type="button"
          className={tabClassName}
          role="tab"
          id={idPrefix ? `${idPrefix}-${index}` : undefined}
          aria-controls={panelId}
          aria-selected={value === tab.value}
          tabIndex={value === tab.value ? 0 : -1}
          disabled={tab.disabled}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
