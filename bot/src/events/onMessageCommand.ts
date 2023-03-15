import { Message } from "discord.js";
import { MessageCommandList } from "../commands";

export const onMessageCommand = async (message: Message, prefix: string) => {
  if (message.content.startsWith(prefix)) {
    for (const MessageCommand of MessageCommandList) {
      if (message.content.substring(1) === MessageCommand.data.shortcut) {
        await MessageCommand.run(message);
      }
    }
  }
};
