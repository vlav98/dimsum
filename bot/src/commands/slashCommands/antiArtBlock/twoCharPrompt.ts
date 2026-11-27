import { prompts } from "../../../data/generators/otp";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { savePromptButton } from "../../../components/common/promptButtons/promptButtons";

function fluff(character1: string, character2: string): string {
  // Get random prompt
  const R1 = Math.floor(Math.random() * prompts.length);
  const str = prompts[R1];

  // Replace {A} & {B} in prompt with OTP names
  return str.replace(/{A}/g, character1).replace(/{B}/g, character2);
}

export const twoCharPrompt: Command = {
  data: new SlashCommandBuilder()
    .setName("otpprompt")
    .setDescription("Generate a prompt between two characters")
    .addStringOption((option) =>
      option
        .setName("character1")
        .setDescription("first character name")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("character2")
        .setDescription("second character name")
        .setRequired(true),
    ),
  run: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    const character1 = interaction.options.getString("character1", true);
    const character2 = interaction.options.getString("character2", true);
    const content = fluff(character1, character2);

    const randomPromptEmbed = new EmbedBuilder();
    randomPromptEmbed.setTitle("OTP Sentence Prompt");
    randomPromptEmbed.setDescription(
      "Generating your random sentence prompt...",
    );

    randomPromptEmbed.addFields({
      name: "Sentence",
      value: content,
    });

    await interaction.editReply({
      embeds: [randomPromptEmbed],
      components: [savePromptButton("otp")],
    });
  },
};
