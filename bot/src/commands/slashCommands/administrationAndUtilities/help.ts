import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Browse DimSum's commands by theme"),
  run: async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const { CommandGroups } = await import("../index");
      const embed = new EmbedBuilder()
        .setTitle("DimSum | Writing & community tools")
        .setDescription(
          "Generated writing tools use curated local lists, not an external AI service. Use Save prompt to keep an idea.",
        )
        .addFields(
          CommandGroups.map((group) => ({
            name: group.name,
            value: group.commands
              .map(
                (command) =>
                  `/${command.data.name} — ${command.data.description}`,
              )
              .join("\n"),
          })),
        )
        .setFooter({
          text: "Configure /writing-channel before /group-prompt. Adopted OCs appear under /savedprompts kind:oc.",
        });
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Could not display command help:", error);
      await interaction.editReply(
        "Command help could not be loaded. Please try again.",
      );
    }
  },
};
