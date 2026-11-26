import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { SavedPromptKind } from "../../../storage";

export function savePromptButton(kind: SavedPromptKind) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`save-generated-prompt:${kind}`)
      .setLabel("Save prompt")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔖"),
  );
}
