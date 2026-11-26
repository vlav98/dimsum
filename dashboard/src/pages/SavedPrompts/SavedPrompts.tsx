import { kindLabels, type Guild } from '../../lib/api';
import ContentCard from '../../components/common/ContentCard/ContentCard';
import Feedback from '../../components/common/Feedback/Feedback';
import TabList from '../../components/common/TabList/TabList';
import SavedPromptList from './components/SavedPromptList/SavedPromptList';
import { useSavedPrompts } from './hooks/useSavedPrompts';

export default function SavedPrompts({ guild }: { guild?: Guild }) {
  const model = useSavedPrompts(guild);
  return (
    <ContentCard className="feature-card">
      <h2>{guild ? `Saved in ${guild.name}` : 'My saved prompts'}</h2>
      {guild && (
        <TabList
          label="Saved prompt libraries"
          value={model.tab}
          onChange={model.setTab}
          tabs={[
            { value: 'mine', label: 'My prompts' },
            {
              value: 'server',
              label: 'Server prompts',
              disabled: !guild.canManage,
            },
          ]}
        />
      )}
      <p className="form-description">
        {model.tab === 'server'
          ? 'Server managers can view and delete saves made in this server.'
          : guild
            ? 'Your own prompts saved in this server.'
            : 'All your saved prompts, including direct messages.'}{' '}
        Deleting a save does not delete the original Discord message.
      </p>
      {guild && !guild.canManage && (
        <p className="field-help">
          Manage Server permission is required for the Server prompts tab.
        </p>
      )}
      <label className="field-label" htmlFor="prompt-kind">
        Prompt type
      </label>
      <select
        id="prompt-kind"
        className="server-select"
        value={model.kind}
        onChange={(event) => model.setKind(event.target.value)}
      >
        <option value="all">All kinds</option>
        {Object.entries(kindLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Feedback error={model.error} />
      <button className="text-button" onClick={model.refresh}>
        Refresh prompts
      </button>
      {model.loading ? (
        <p role="status">Loading saved prompts…</p>
      ) : model.error && model.prompts.length === 0 ? null : (
        <SavedPromptList
          prompts={model.filtered}
          deleting={model.deleting}
          onDelete={(prompt) => void model.deletePrompt(prompt)}
        />
      )}
    </ContentCard>
  );
}
