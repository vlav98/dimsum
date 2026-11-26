import {
  AutocompleteInteraction,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { adoptionButton } from "../../../adoptions";
import { generateOC, nameStyles } from "../../../generators/writing";
import { promptText } from "../../../savedPrompts";
import {
  createAdoptionOffer,
  getSavedPromptForUser,
  listSavedPromptsForUser,
} from "../../../storage";

export const adopt: Command = {
  data: new SlashCommandBuilder()
    .setName("adopt")
    .setDescription("Offer a new OC for the first member to adopt")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("saved_oc")
        .setDescription("Offer one of your saved OCs instead of generating one")
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("Style for a newly generated OC")
        .addChoices(...nameStyles.map((value) => ({ name: value, value }))),
    ),
  run: async (interaction) => {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply({
        content: "Use /adopt in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply();
    try {
      const savedOCId = interaction.options.getString("saved_oc");
      const savedOC = savedOCId
        ? await getSavedPromptForUser(interaction.user.id, savedOCId)
        : null;
      if (savedOCId && (!savedOC || savedOC.kind !== "oc")) {
        await interaction.editReply(
          "That saved OC could not be found in your library. Choose one with the saved OC option.",
        );
        return;
      }

      const embed = savedOC
        ? new EmbedBuilder()
            .setTitle("An OC looking for a new story")
            .setDescription(savedOC.content)
        : generateOC(interaction.options.getString("style"));
      embed.setTitle("An OC looking for a new story").setFooter({
        text: savedOC
          ? "First claim wins. The original owner keeps their saved copy."
          : "First claim wins. Adoption saves this sheet to your OC library.",
      });
      const message = await interaction.fetchReply();
      await createAdoptionOffer({
        id: message.id,
        guildId: interaction.guildId,
        guildName: interaction.guild.name,
        content: promptText(embed.toJSON()),
        createdAt: new Date().toISOString(),
        claimedBy: null,
      });
      await interaction.editReply({
        embeds: [embed],
        components: [adoptionButton(message.id)],
      });
    } catch (error) {
      console.error("Could not create an OC adoption offer:", error);
      await interaction.editReply(
        "The adoption offer could not be created. Please try again.",
      );
    }
  },
};

export async function autocompleteSavedOC(
  interaction: AutocompleteInteraction,
  valuePrefix = "",
): Promise<void> {
  try {
    const focused = interaction.options.getFocused().toLocaleLowerCase();
    const savedOCs = await listSavedPromptsForUser(interaction.user.id, "oc");
    const choices = savedOCs
      .map((savedOC) => {
        const name = savedOC.content.match(/(?:^|\n)Name:\s*([^\n]+)/)?.[1];
        const label = name?.trim() || "Unnamed OC";
        return {
          name: `${label} · ${new Date(savedOC.createdAt).toLocaleDateString()}`.slice(
            0,
            100,
          ),
          value: `${valuePrefix}${savedOC.id}`,
          searchText: `${label}\n${savedOC.content}`.toLocaleLowerCase(),
        };
      })
      .filter((choice) => !focused || choice.searchText.includes(focused))
      .slice(0, 25)
      .map(({ name, value }) => ({ name, value }));
    await interaction.respond(choices);
  } catch (error) {
    console.error("Could not autocomplete saved OCs:", error);
    await interaction.respond([]);
  }
}
