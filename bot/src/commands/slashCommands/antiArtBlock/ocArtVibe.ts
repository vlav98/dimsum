import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";
import { generateOC } from "../../../generators/character/sheets";
import { generatePalette, renderPalette } from "../../../generators/palette";

export const ocArtVibe: Command = {
  data: new SlashCommandBuilder()
    .setName("oc-art-vibe")
    .setDescription("Generate an OC concept, palette, and color script"),
  async run(interaction) {
    const { harmony, colors } = generatePalette(
      3 + Math.floor(Math.random() * 4),
    );
    const oc = generateOC();
    const fields = oc.toJSON().fields ?? [];
    oc.setTitle("OC art vibe")
      .setFields(
        fields.filter((field) =>
          ["Name", "Personality", "Aesthetic", "Power / role"].includes(
            field.name,
          ),
        ),
      )
      .addFields(
        {
          name: `${harmony} palette`,
          value: colors.map((color) => `\`${color}\``).join("  "),
        },
        {
          name: "Color script",
          value: `Use \`${colors[0]}\` for shadows or anchors, \`${colors[Math.floor(colors.length / 2)]}\` for the main shapes, and \`${colors[colors.length - 1]}\` for highlights or accents.`,
        },
      )
      .setColor(parseInt(colors[0].slice(1), 16))
      .setImage("attachment://palette.png");
    await interaction.reply({
      embeds: [oc],
      files: [
        new AttachmentBuilder(renderPalette(colors), { name: "palette.png" }),
      ],
    });
  },
};
