import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

export const react: Command = {
  data: new SlashCommandBuilder()
    .setName("react")
    .setDescription("Put a reaction")
    .addStringOption((option) =>
      option.setName("message").setDescription("Put your message here.")
    )
    .addStringOption((option) =>
      option.setName("emoji").setDescription("Put your emoji here.")
    ),
  run: async (interaction: CommandInteraction) => {
    const { user, options } = interaction;
    const messageOption = options.get("message")?.value as string;
    const emojiOption = options.get("emoji")?.value as string;

    const content =
      messageOption ??
      "You can react with custom emojis " + user.username + "!";

    const message = await interaction.reply({
      content,
      fetchReply: true,
    });

    message.react(emojiOption ?? "👍");
  },
};
