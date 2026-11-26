import type { InputHTMLAttributes } from 'react';

type Props = {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  canReset: boolean;
  help: string;
  inputProps?: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'minLength' | 'maxLength' | 'required' | 'placeholder' | 'className'
  >;
};

export default function SettingForm({
  id,
  label,
  name,
  value,
  onChange,
  onSave,
  onReset,
  canReset,
  help,
  inputProps,
}: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="inline-form">
        <input
          id={id}
          className="text-input"
          {...inputProps}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button className="secondary-button">Save {name}</button>
        <button
          className="text-button"
          type="button"
          disabled={!canReset}
          onClick={onReset}
        >
          Reset {name}
        </button>
      </div>
      <p className="field-help">{help}</p>
    </form>
  );
}
