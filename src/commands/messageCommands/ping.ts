import { ChannelType } from "discord.js";
import { MessageCommand } from "interfaces/MessageCommand";

export const ping: MessageCommand = {
  data: {
    shortcut: "ping",
  },
  run: async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.GuildText) {
      message.channel.send("pong!");
    }
  },
};
