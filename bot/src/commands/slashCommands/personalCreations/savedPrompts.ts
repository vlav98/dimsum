import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import {
  deleteSavedPromptForUser,
  listSavedPromptsForUser,
  SavedPromptKind,
  savedPromptKinds,
} from "../../../storage";
import { promptKindLabels } from "../../../savedPrompts";

const promptKinds = savedPromptKinds;
type PromptFilter = SavedPromptKind | "all";

const savedPromptsData = new SlashCommandBuilder()
  .setName("savedprompts")
  .setDescription("Browse, filter, and delete your saved generated prompts")
  .addStringOption((option) =>
    option
      .setName("kind")
      .setDescription("Filter by generator type")
      .addChoices(
        { name: "All kinds", value: "all" },
        ...promptKinds.map((kind) => ({
          name: promptKindLabels[kind],
          value: kind,
        })),
      )
      .setRequired(false),
  )
  .addIntegerOption((option) =>
    option
      .setName("page")
      .setDescription("Saved prompt number within this filter")
      .setMinValue(1)
      .setRequired(false),
  );

function isPromptFilter(value: string): value is PromptFilter {
  return value === "all" || promptKinds.some((kind) => kind === value);
}

async function renderSavedPrompts(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  filter: PromptFilter,
  requestedPage: number,
  notice?: string,
): Promise<void> {
  const prompts = await listSavedPromptsForUser(
    interaction.user.id,
    filter === "all" ? undefined : filter,
  );
  const pageCount = Math.max(1, prompts.length);
  const page = Math.min(requestedPage, pageCount);
  const prompt = prompts[page - 1];
  const customId = (action: string, kind: PromptFilter, targetPage: number) =>
    `saved-prompts:${action}:${interaction.user.id}:${kind}:${targetPage}`;
  const filterButtons: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let index = 0; index < promptKinds.length; index += 5) {
    filterButtons.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...promptKinds.slice(index, index + 5).map((kind) =>
          new ButtonBuilder()
            .setCustomId(customId("filter", kind, 1))
            .setLabel(
              kind === "oc"
                ? "OC"
                : kind === "otp"
                  ? "OTP"
                  : promptKindLabels[kind],
            )
            .setStyle(
              filter === kind ? ButtonStyle.Primary : ButtonStyle.Secondary,
            ),
        ),
      ),
    );
  }
  const navigation = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(customId("filter", "all", 1))
      .setLabel("All")
      .setStyle(filter === "all" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(customId("browse", filter, Math.max(1, page - 1)))
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(customId("page", filter, page))
      .setLabel(`${page} / ${pageCount}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(customId("browse", filter, page + 1))
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pageCount),
    new ButtonBuilder()
      .setCustomId(
        `${customId("delete", filter, page)}:${prompt?.sourceMessageId ?? "none"}`,
      )
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(!prompt),
  );
  // Long saves use both the message and embed so no saved text is truncated.
  const overflow = prompt && prompt.content.length > 4096;
  const splitAt =
    prompt && /[\uD800-\uDBFF]/.test(prompt.content.charAt(1949)) ? 1949 : 1950;
  const embed = new EmbedBuilder()
    .setTitle(
      filter === "all"
        ? "Your saved prompts"
        : `${promptKindLabels[filter]} saves`,
    )
    .setDescription(
      prompt
        ? prompt.content.slice(overflow ? splitAt : 0)
        : "You have no saves for this filter yet.",
    )
    .setFooter({
      text: prompt
        ? `${promptKindLabels[prompt.kind]} | Page ${page} of ${pageCount} | ${new Date(prompt.createdAt).toLocaleDateString()}`
        : "Choose another filter to browse your saves.",
    });
  await interaction.editReply({
    content: overflow ? prompt.content.slice(0, splitAt) : (notice ?? null),
    embeds: [embed],
    components: [...filterButtons, navigation],
    allowedMentions: { parse: [] },
  });
}

export async function handleSavedPromptsButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const [, action, ownerId, filter, pageValue, sourceMessageId] =
    interaction.customId.split(":");
  if (ownerId !== interaction.user.id) {
    await interaction.reply({
      content:
        "These saved prompts belong to another user. Use /savedprompts to browse your own.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const page = Number(pageValue);
  if (
    (action !== "browse" && action !== "filter" && action !== "delete") ||
    !isPromptFilter(filter) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    (action === "delete" && !sourceMessageId)
  ) {
    await interaction.reply({
      content: "This control is invalid. Run /savedprompts again.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await interaction.deferUpdate();
  try {
    let notice: string | undefined;
    if (action === "delete") {
      const deleted = await deleteSavedPromptForUser(
        interaction.user.id,
        `${interaction.user.id}:${sourceMessageId}`,
      );
      notice = deleted
        ? "Saved prompt deleted."
        : "That prompt was already deleted.";
    }
    await renderSavedPrompts(
      interaction,
      filter,
      action === "filter" ? 1 : page,
      notice,
    );
  } catch (error) {
    console.error("Could not update saved prompts:", error);
    await interaction.editReply({
      content:
        "Your saved prompts could not be updated. Please run /savedprompts again.",
      embeds: [],
      components: [],
    });
  }
}

export const savedPrompts: Command = {
  data: savedPromptsData,
  run: async (interaction) => {
    const selectedKind = interaction.options.getString("kind") ?? "all";
    const filter = isPromptFilter(selectedKind) ? selectedKind : "all";
    const page = interaction.options.getInteger("page") ?? 1;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      await renderSavedPrompts(interaction, filter, page);
    } catch (error) {
      console.error("Could not list saved prompts:", error);
      await interaction.editReply("Your saved prompts could not be loaded.");
    }
  },
};
