import { ChannelType, Message } from 'discord.js';
import { MessageCommand } from 'src/interfaces/MessageCommand';

export const ping: MessageCommand = {
  data: {
    shortcut: 'ping',
  },
  run: async (message: Message) => {
    console.log('message.author', message.author);

    if (message.author.bot) return;
    if (message.channel.type === ChannelType.GuildText) {
      message.channel.send('pong!');
    }
  },
};
