import { Interaction } from "discord.js";
import { CommandList } from "../commands/index";
import { saveGeneratedPrompt, showSavedPrompt } from "../savedPrompts";
import { handleSavedPromptsButton } from "../commands/slashCommands/personalCreations/savedPrompts";
import { savedPromptKinds } from "../storage";
import { adoptOC } from "../adoptions";
import { autocompleteSavedOC } from "../commands/slashCommands/personalCreations/adopt";

export const onInteraction = async (interaction: Interaction) => {
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "adopt") {
      await autocompleteSavedOC(interaction);
    } else {
      await interaction.respond([]);
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("adopt-oc:")) {
      await adoptOC(
        interaction,
        interaction.customId.slice("adopt-oc:".length),
      );
      return;
    }
    if (interaction.customId.startsWith("saved-prompts:")) {
      await handleSavedPromptsButton(interaction);
      return;
    }
    if (
      interaction.customId === "save-generated-prompt" ||
      interaction.customId.startsWith("save-generated-prompt:")
    ) {
      const kindValue = interaction.customId.split(":")[1];
      const kind =
        savedPromptKinds.find((candidate) => candidate === kindValue) ??
        "other";
      await saveGeneratedPrompt(interaction, kind);
      return;
    }
    if (interaction.customId.startsWith("open-saved-prompt:")) {
      await showSavedPrompt(
        interaction,
        interaction.customId.slice("open-saved-prompt:".length),
      );
      return;
    }
  }

  if (interaction.isChatInputCommand()) {
    for (const Command of CommandList) {
      if (interaction.commandName === Command.data.name) {
        await Command.run(interaction);
        break;
      }
    }
  }
};
