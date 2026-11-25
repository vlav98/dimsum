import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../interfaces/Command";
import { savePromptButton } from "../promptComponents";
import { SavedPromptKind } from "../storage";

export function generatedCommand(
  data: Command["data"],
  kind: SavedPromptKind,
  generate: (interaction: ChatInputCommandInteraction) => EmbedBuilder,
): Command {
  return {
    data,
    run: async (interaction) => {
      await interaction.deferReply();
      try {
        await interaction.editReply({
          embeds: [generate(interaction)],
          components: [savePromptButton(kind)],
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        console.error(`Could not run /${data.name}:`, error);
        await interaction.editReply("Generation failed. Please try again.");
      }
    },
  };
}
