import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../../interfaces/Command";
import { addCharacterOptions } from "./options";
import { beginOCGeneration } from "./selection";
import { nameStyles, ocSections } from "../../../../config/generatorOptions";

export const RandomOCGenerator: Command = {
  data: addCharacterOptions(
    new SlashCommandBuilder()
      .setName("ocgen")
      .setDescription("Generate a random OC or a styled character sheet."),
  )
    .addStringOption((option) =>
      option
        .setName("section")
        .setDescription("Generate a full sheet or one part")
        .addChoices(...ocSections.map((value) => ({ name: value, value }))),
    )
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("Character name and setting style")
        .addChoices(...nameStyles.map((value) => ({ name: value, value }))),
    )
    .addBooleanOption((option) =>
      option
        .setName("omit")
        .setDescription("Choose properties to leave out before generating"),
    ),
  run: async (interaction: ChatInputCommandInteraction) => {
    const style = interaction.options.getString("style");
    const section = interaction.options.getString("section");
    await beginOCGeneration(
      interaction,
      style || section ? "sheet" : "random",
      style,
      section,
      interaction.options.getBoolean("omit") ?? false,
    );
  },
};
