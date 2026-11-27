import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";
import { fetchPoseReference } from "../../../features/community/unsplash";

export const pose: Command = {
  data: new SlashCommandBuilder()
    .setName("pose")
    .setDescription("Get a random pose photo for drawing reference"),
  async run(interaction) {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
      await interaction.reply({
        content:
          "Pose references are unavailable: the Unsplash access key is not configured.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    let photo;
    try {
      photo = await fetchPoseReference(apiKey);
    } catch (error) {
      console.error("Could not fetch pose reference from Unsplash:", error);
      await interaction.editReply(
        "Could not fetch a pose reference from Unsplash. Please try again later.",
      );
      return;
    }

    if (!photo) {
      await interaction.editReply(
        "No pose references were found on Unsplash. Please try again later.",
      );
      return;
    }

    await interaction.editReply({ embeds: [photo] });
  },
};
