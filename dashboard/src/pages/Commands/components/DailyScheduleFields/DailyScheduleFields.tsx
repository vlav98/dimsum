import ChannelCombobox, {
  type Channel,
} from '../../../../components/common/ChannelCombobox/ChannelCombobox';
import type { DailySettings } from '../../types';

export default function DailyScheduleFields({
  settings,
  onChange,
  channels,
  busy,
}: {
  settings: DailySettings;
  onChange: (value: DailySettings) => void;
  channels: Channel[];
  busy: boolean;
}) {
  return (
    <>
      <label className="field-label" htmlFor="daily-kind">
        Daily content
      </label>
      <select
        id="daily-kind"
        className="server-select"
        value={settings.kind}
        onChange={(event) =>
          onChange({
            ...settings,
            kind: event.target.value === 'challenge' ? 'challenge' : 'prompt',
          })
        }
      >
        <option value="prompt">Story prompt</option>
        <option value="challenge">Daily writing challenge</option>
      </select>
      <ChannelCombobox
        id="daily-channel"
        label="Daily posting channel"
        channels={channels}
        required={settings.enabled}
        disabled={busy}
        value={settings.channelId ?? ''}
        onChange={(channelId) =>
          onChange({ ...settings, channelId: channelId || null })
        }
      />
      <label className="field-label" htmlFor="daily-time">
        Posting time (UTC)
      </label>
      <input
        id="daily-time"
        className="text-input"
        type="time"
        required
        value={settings.time}
        onChange={(event) =>
          onChange({ ...settings, time: event.target.value })
        }
      />
    </>
  );
}
