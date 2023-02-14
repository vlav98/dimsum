import { SlashCommandBuilder } from "discord.js";
import { Command } from "src/interfaces/Command";

export const react: Command = {
  data: new SlashCommandBuilder()
    .setName("react")
    .setDescription("Put a reaction")
    .addStringOption(
      (option) =>
        option.setName("message").setDescription("Put your message here.")
      // .setRequired(true)
    ),
  run: async (interaction) => {
    await interaction.deferReply();

    const { user } = interaction;
    const content = "You can react with custom emojis" + user.username + "!";

    const message = await interaction.reply({
      content,
      fetchReply: true,
    });

    message.react(":smile:");
    // const text = interaction.options;
    // console.log(text);
    // await interaction.followUp({
    //   ephemeral: true,
    //   content,
    // });
  },
};
