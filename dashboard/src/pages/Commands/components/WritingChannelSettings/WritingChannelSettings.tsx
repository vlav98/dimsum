import ChannelCombobox from '../../../../components/common/ChannelCombobox/ChannelCombobox';
import ContentCard from '../../../../components/common/ContentCard/ContentCard';
import type { WritingChannel } from '../../hooks/useWritingChannel';
import type { WritingSettings } from '../../types';

export default function WritingChannelSettings({
  settings,
  model,
}: {
  settings: WritingSettings;
  model: WritingChannel;
}) {
  return (
    <ContentCard className="feature-card">
      <div>
        <h2>Community writing channel</h2>
        <p className="form-description">
          /group-prompt posts here, never in an arbitrary channel. The bot needs
          View Channel, Send Messages, and Embed Links.
        </p>
        <form onSubmit={(event) => void model.save(event)}>
          <ChannelCombobox
            id="writing-channel"
            label="Dedicated writing channel"
            channels={settings.channels}
            value={model.channelId}
            onChange={model.setChannelId}
            emptyLabel="Disabled — no channel configured"
            disabled={model.busy}
          />
          <button
            className="secondary-button form-submit"
            disabled={model.busy}
          >
            {model.busy ? 'Saving…' : 'Save writing channel'}
          </button>
          <p className="field-help">
            {settings.channelId
              ? 'Community prompt posting is configured.'
              : 'Group prompts are disabled until a manager chooses a channel.'}
          </p>
        </form>
      </div>
    </ContentCard>
  );
}
