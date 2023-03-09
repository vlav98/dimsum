import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../interfaces/Command";

export const addRole: Command = {
  data: new SlashCommandBuilder()
    .setName("addRole")
    .setDescription("Add a role to a user")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Put your message here.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("emoji").setDescription("Put your emoji here.")
    ),
  run: async (interaction: CommandInteraction) => {
    const { user, options } = interaction;
    const content = options.get("message")?.value as string;
    const emojiOption = options.get("emoji")?.value as string;

    const message = await interaction.reply({
      content,
      fetchReply: true,
    });

    message.react(emojiOption ?? "👍");

    message.awaitReactions({}).then((collected) => {
      console.log(collected);
    });
  },
};
