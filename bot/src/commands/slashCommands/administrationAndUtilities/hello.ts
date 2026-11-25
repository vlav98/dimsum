import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";

export const Hello: Command = {
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Returns a greeting")
    .addStringOption(
      (option) =>
        option.setName("yourname").setDescription("Returns a greeting.")
      // .setRequired(true)
    ),
  run: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    const { user } = interaction;
    const content = "Hello there " + user.username;

    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};
