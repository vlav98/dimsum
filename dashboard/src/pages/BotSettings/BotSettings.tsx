import type { Guild } from '../../lib/api';
import ContentCard from '../../components/common/ContentCard/ContentCard';
import Feedback from '../../components/common/Feedback/Feedback';
import LoadState from '../../components/common/LoadState/LoadState';
import SettingForm from '../../components/common/SettingForm/SettingForm';
import { useBotSettings } from './hooks/useBotSettings';

export default function BotSettings({ guild }: { guild: Guild }) {
  const model = useBotSettings(guild.id);
  const { settings, nicknameSettings } = model;
  return (
    <ContentCard>
      <h2>Bot settings</h2>
      <Feedback error={model.error} notice={model.notice} />
      {!settings || !nicknameSettings ? (
        <LoadState
          error={model.error}
          label="Loading bot settings…"
          onRetry={model.refresh}
        />
      ) : (
        <fieldset className="reaction-form" disabled={model.busy}>
          <SettingForm
            id="bot-nickname"
            label="Bot nickname"
            name="nickname"
            value={model.nickname}
            onChange={model.setNickname}
            onSave={() => void model.save('nickname')}
            onReset={() => void model.save('nickname', true)}
            canReset={!!nicknameSettings.nickname}
            inputProps={{
              maxLength: 32,
              placeholder: nicknameSettings.username,
            }}
            help="Only changes the bot's nickname in this server. Requires Change Nickname permission."
          />
          <SettingForm
            id="prefix-input"
            label="Prefix (1–5 characters)"
            name="prefix"
            value={model.prefix}
            onChange={model.setPrefix}
            onSave={() => void model.save('prefix')}
            onReset={() => void model.save('prefix', true)}
            canReset={settings.isCustom}
            inputProps={{
              minLength: 1,
              maxLength: 5,
              required: true,
              className: 'text-input prefix-input',
            }}
            help="Applies to message commands in this server, not slash commands."
          />
        </fieldset>
      )}
    </ContentCard>
  );
}
