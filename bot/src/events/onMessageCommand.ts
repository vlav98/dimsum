import { Message } from "discord.js";
import { MessageCommandList } from "../commands";
import { getDefaultPrefix, getGuildPrefix } from "../storage";

export const onMessageCommand = async (
  message: Message,
  defaultPrefix = getDefaultPrefix(),
) => {
  if (message.author.bot) return;
  const prefix = message.guildId
    ? (await getGuildPrefix(message.guildId)) ?? defaultPrefix
    : defaultPrefix;
  if (message.content.startsWith(prefix)) {
    const shortcut = message.content.slice(prefix.length).trim();
    for (const MessageCommand of MessageCommandList) {
      if (shortcut === MessageCommand.data.shortcut) {
        await MessageCommand.run(message);
      }
    }
  }
};
