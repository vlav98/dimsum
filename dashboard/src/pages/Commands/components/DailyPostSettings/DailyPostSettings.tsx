import type { Channel } from '../../../../components/common/ChannelCombobox/types';
import Feedback from '../../../../components/common/Feedback/Feedback';
import LoadState from '../../../../components/common/LoadState/LoadState';
import { useDailyPostSettings } from '../../hooks/useDailyPostSettings';
import DailyPostForm from '../DailyPostForm/DailyPostForm';

export default function DailyPostSettings({
  guildId,
  channels,
}: {
  guildId: string;
  channels: Channel[];
}) {
  const model = useDailyPostSettings(guildId);
  return (
    <section className="content-card feature-card">
      <h2>Automatic daily posts</h2>
      <p className="form-description">
        Post a story prompt or the /daily challenge automatically. Times are
        UTC. After downtime, today's post is sent when the bot returns if its
        time has passed; older days are skipped.
      </p>
      <Feedback error={model.error} notice={model.notice} />
      {!model.settings ? (
        <LoadState
          error={model.error}
          label="Loading daily schedule…"
          onRetry={model.refresh}
        />
      ) : (
        <DailyPostForm
          settings={model.settings}
          onChange={model.setSettings}
          onSubmit={model.save}
          busy={model.busy}
          channels={channels}
        />
      )}
    </section>
  );
}
