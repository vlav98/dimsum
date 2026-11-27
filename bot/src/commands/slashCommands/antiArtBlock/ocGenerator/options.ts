import { characterOptions } from "../../../../config/characterProperties";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export function addCharacterOptions(command: SlashCommandBuilder) {
  for (const [name, description] of characterOptions) {
    command.addStringOption((option) =>
      option.setName(name).setDescription(description).setMaxLength(100),
    );
  }
  return command.addBooleanOption((option) =>
    option
      .setName("heterochromia")
      .setDescription(
        "Choose whether the character has two different eye colors",
      ),
  );
}

function optionalText(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function getCharacterOptions(interaction: ChatInputCommandInteraction) {
  return {
    name: optionalText(interaction.options.getString("name")),
    gender: optionalText(interaction.options.getString("gender")),
    sexuality: optionalText(interaction.options.getString("sexuality")),
    species: optionalText(interaction.options.getString("species")),
    hairColor: optionalText(interaction.options.getString("hair_color")),
    hairLength: optionalText(interaction.options.getString("hair_length")),
    eyeColor: optionalText(interaction.options.getString("eye_color")),
    lifeStatus: optionalText(interaction.options.getString("life_status")),
    heterochromia: interaction.options.getBoolean("heterochromia"),
  };
}
