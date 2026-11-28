import {
  AttachmentBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { emojiGenres } from "../../../data/generators/emojiArt";
import {
  generateEmojiOC,
  generateEmojiPalette,
  generateEmojiScene,
} from "../../../generators/emojiArt";
import { renderPalette } from "../../../generators/palette";
import { Command } from "../../../interfaces/Command";

export const emojiOC: Command = {
  data: new SlashCommandBuilder()
    .setName("emoji-oc")
    .setDescription("Design a character from a curated emoji roll")
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("Character genre (random if omitted)")
        .addChoices(...emojiGenres.map((value) => ({ name: value, value }))),
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of emojis (3 or 4; random if omitted)")
        .addChoices({ name: "3", value: 3 }, { name: "4", value: 4 }),
    ),
  async run(interaction) {
    const { genre, prompts } = generateEmojiOC(
      interaction.options.getString("genre"),
      interaction.options.getInteger("count"),
    );
    const embed = new EmbedBuilder()
      .setTitle("Emoji OC challenge")
      .setDescription(
        `Design a **${genre}** character using ${prompts.map((prompt) => prompt.emoji).join(" + ")}.\n\n${prompts.map((prompt) => `**${prompt.name}:** ${prompt.emoji}`).join("\n")}`,
      );
    await interaction.reply({ embeds: [embed] });
  },
};

export const emojiPalette: Command = {
  data: new SlashCommandBuilder()
    .setName("emoji-palette")
    .setDescription("Get an emoji-inspired palette and color constraint"),
  async run(interaction) {
    const { emojis, colors } = generateEmojiPalette();
    const embed = new EmbedBuilder()
      .setTitle(`Emoji palette: ${emojis.join(" + ")}`)
      .setDescription(
        `**${emojis[0]} main colors:** ${colors
          .slice(0, 3)
          .map((color) => `\`${color}\``)
          .join("  ")}\n**${emojis[1]} accent colors:** ${colors
          .slice(3)
          .map((color) => `\`${color}\``)
          .join(
            "  ",
          )}\n\nChallenge: use the main colors for roughly 70% of your artwork and the accent colors for 30%.`,
      )
      .setColor(parseInt(colors[0].slice(1), 16))
      .setImage("attachment://palette.png");
    await interaction.reply({
      embeds: [embed],
      files: [
        new AttachmentBuilder(renderPalette([...colors]), {
          name: "palette.png",
        }),
      ],
    });
  },
};

export const emojiScene: Command = {
  data: new SlashCommandBuilder()
    .setName("emoji-scene")
    .setDescription("Compose a scene from setting, weather, and object emojis"),
  async run(interaction) {
    const { setting, weather, focus } = generateEmojiScene();
    const embed = new EmbedBuilder()
      .setTitle("Emoji scene challenge")
      .setDescription(
        `${setting.emoji} + ${weather.emoji} + ${focus.emoji}\n\nCreate an illustration or thumbnail of **${setting.label}**, with **${focus.label}** as the focal point.\n**Time / weather:** ${weather.label}`,
      );
    await interaction.reply({ embeds: [embed] });
  },
};
