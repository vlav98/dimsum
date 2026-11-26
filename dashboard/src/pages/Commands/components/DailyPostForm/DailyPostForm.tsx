import type { FormEvent } from 'react';
import type { Channel } from '../../../../components/common/ChannelCombobox/types';
import type { DailySettings } from '../../types';
import DailyScheduleFields from '../DailyScheduleFields/DailyScheduleFields';

export default function DailyPostForm({
  settings,
  onChange,
  onSubmit,
  busy,
  channels,
}: {
  settings: DailySettings;
  onChange: (value: DailySettings) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  busy: boolean;
  channels: Channel[];
}) {
  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <fieldset className="reaction-form" disabled={busy}>
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) =>
              onChange({ ...settings, enabled: event.target.checked })
            }
          />{' '}
          Enable daily posts
        </label>
        <DailyScheduleFields
          settings={settings}
          onChange={onChange}
          channels={channels}
          busy={busy}
        />
        <button className="secondary-button form-submit">
          {busy ? 'Saving…' : 'Save daily schedule'}
        </button>
        <p className="field-help">
          At most one scheduled post per UTC day.{' '}
          {settings.lastPostedDate
            ? `Last posted: ${settings.lastPostedDate} UTC.`
            : 'No scheduled posts sent yet.'}
        </p>
      </fieldset>
    </form>
  );
}
