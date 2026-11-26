import type { Channel } from '../../components/common/ChannelCombobox/types';
import type { Emoji } from './components/EmojiInput/EmojiInput';

export type Role = { id: string; name: string };
export type Mapping = { emoji: string; roleId: string };
export type RoleMessage = {
  guildId: string;
  messageId: string;
  channelId: string;
  content: string;
  mappings: Mapping[];
};
export type WritingSettings = { channelId: string | null; channels: Channel[] };
export type Details = {
  channels: Channel[];
  roles: Role[];
  emojis: Emoji[];
  messages: RoleMessage[];
  writing: WritingSettings;
};
export type DailySettings = {
  enabled: boolean;
  channelId: string | null;
  time: string;
  kind: 'prompt' | 'challenge';
  lastPostedDate: string | null;
};
