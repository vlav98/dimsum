import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { generatePalette, renderPalette } from "../../../generators/palette";
import { Command } from "../../../interfaces/Command";

export const palette: Command = {
  data: new SlashCommandBuilder()
    .setName("palette")
    .setDescription("Generate a harmonious color palette")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of colors (2–8; random if omitted)")
        .setMinValue(2)
        .setMaxValue(8),
    ),
  async run(interaction) {
    const { harmony, colors } = generatePalette(
      interaction.options.getInteger("count") ??
        2 + Math.floor(Math.random() * 7),
    );
    const embed = new EmbedBuilder()
      .setTitle(`${harmony} palette`)
      .setDescription(colors.map((color) => `\`${color}\``).join("  "))
      .setColor(parseInt(colors[0].slice(1), 16))
      .setImage("attachment://palette.png");
    const image = new AttachmentBuilder(renderPalette(colors), {
      name: "palette.png",
    });
    await interaction.reply({ embeds: [embed], files: [image] });
  },
};
