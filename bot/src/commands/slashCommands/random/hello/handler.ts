import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from 'interfaces/Command';

export const hello: Command = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Returns a greeting')
    .addStringOption((option) =>
      option.setName('yourname').setDescription('Returns a greeting.'),
    ),
  run: async (interaction: CommandInteraction) => {
    await interaction.deferReply();

    const { user } = interaction;
    const content = 'Hello there ' + user.globalName;

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};
