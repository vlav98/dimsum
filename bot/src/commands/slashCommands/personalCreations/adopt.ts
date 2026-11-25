import {
  InteractionContextType,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { adoptionButton } from "../../../adoptions";
import { generateOC, nameStyles } from "../../../generators/writing";
import { promptText } from "../../../savedPrompts";
import { createAdoptionOffer } from "../../../storage";

export const adopt: Command = {
  data: new SlashCommandBuilder()
    .setName("adopt")
    .setDescription("Offer a new OC for the first member to adopt")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("Character style")
        .addChoices(...nameStyles.map((value) => ({ name: value, value }))),
    ),
  run: async (interaction) => {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({
        content: "Use /adopt in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply();
    try {
      const embed = generateOC(interaction.options.getString("style"))
        .setTitle("An OC looking for a new story")
        .setFooter({
          text: "First claim wins. Adoption saves this sheet to your OC library.",
        });
      const message = await interaction.fetchReply();
      await createAdoptionOffer({
        id: message.id,
        guildId: interaction.guildId,
        guildName: interaction.guild.name,
        content: promptText(embed.toJSON()),
        createdAt: new Date().toISOString(),
        claimedBy: null,
      });
      await interaction.editReply({
        embeds: [embed],
        components: [adoptionButton(message.id)],
      });
    } catch (error) {
      console.error("Could not create an OC adoption offer:", error);
      await interaction.editReply(
        "The adoption offer could not be created. Please try again.",
      );
    }
  },
};
