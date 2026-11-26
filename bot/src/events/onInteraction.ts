import { Interaction } from "discord.js";
import { CommandList } from "../commands/index";
import { saveGeneratedPrompt, showSavedPrompt } from "../features/savedPrompts/savedPrompts";
import { handleSavedPromptsButton } from "../commands/slashCommands/personalCreations/savedPrompts";
import { savedPromptKinds } from "../storage";
import { adoptOC } from "../features/adoptions/adoptions";
import { autocompleteSavedOC } from "../commands/slashCommands/personalCreations/adopt";
import {
  generateSelectedOC,
  updateOCOmissions,
} from "../commands/slashCommands/antiWriterBlock/ocGenerator/selection";

export const onInteraction = async (interaction: Interaction) => {
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "adopt") {
      await autocompleteSavedOC(interaction);
    } else if (
      interaction.commandName === "oc-duel" ||
      interaction.commandName === "matchup"
    ) {
      await autocompleteSavedOC(interaction, "saved-oc:");
    } else {
      await interaction.respond([]);
    }
    return;
  }

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId.startsWith("oc-omit:")
  ) {
    await updateOCOmissions(interaction);
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("oc-generate:")) {
      await generateSelectedOC(interaction);
      return;
    }
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
