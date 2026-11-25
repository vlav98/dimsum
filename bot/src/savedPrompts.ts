import { ButtonInteraction, MessageFlags } from "discord.js";
import {
  getSavedPromptForUser,
  savePrompt,
  SavedPromptKind,
} from "./storage";

export const promptKindLabels: Record<SavedPromptKind, string> = {
  random: "Random prompt",
  fanfic: "Fanfic prompt",
  otp: "OTP prompt",
  oc: "OC generator",
  other: "Other",
};

export async function saveGeneratedPrompt(
  interaction: ButtonInteraction,
  kind: SavedPromptKind,
): Promise<void> {
  const embed = interaction.message.embeds[0];
  if (!embed) {
    await interaction.reply({
      content: "This message does not contain a prompt to save.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const content = [
    embed.title,
    embed.description,
    ...embed.fields.map(({ name, value }) => `${name}: ${value}`),
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 6000);
  if (!content) {
    await interaction.reply({
      content: "This message does not contain a prompt to save.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const saved = await savePrompt({
      id: `${interaction.user.id}:${interaction.message.id}`,
      sourceMessageId: interaction.message.id,
      userId: interaction.user.id,
      username: interaction.user.username,
      displayName: interaction.user.globalName ?? interaction.user.username,
      guildId: interaction.guildId,
      guildName: interaction.guild?.name ?? null,
      kind,
      content,
      createdAt: new Date().toISOString(),
    });

    const visibility = interaction.guildId
      ? "You and this server’s admins can view it in the dashboard."
      : "Only you can view it in the dashboard.";
    await interaction.editReply(
      saved
        ? `Prompt saved. ${visibility}`
        : "You already saved this prompt.",
    );
  } catch (error) {
    console.error("Could not save generated prompt:", error);
    await interaction.editReply(
      "The prompt could not be saved. Please try again.",
    );
  }
}

export async function showSavedPrompt(
  interaction: ButtonInteraction,
  promptId: string,
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const prompt = await getSavedPromptForUser(interaction.user.id, promptId);
    if (!prompt) {
      await interaction.editReply(
        "That saved prompt could not be found in your library.",
      );
      return;
    }

    const firstChunkLength = 1800;
    const firstChunk = prompt.content.slice(0, firstChunkLength);
    const title = `${promptKindLabels[prompt.kind]} · ${new Date(
      prompt.createdAt,
    ).toLocaleDateString()}`;
    await interaction.editReply(`${title}\n\n${firstChunk}`);

    const remaining = prompt.content.slice(firstChunk.length);
    for (const chunk of splitText(remaining, 1900)) {
      await interaction.followUp({
        content: chunk,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    console.error("Could not display saved prompt:", error);
    await interaction.editReply("The saved prompt could not be displayed.");
  }
}

function splitText(text: string, limit: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + limit, text.length);
    const lastCodeUnit = text.charCodeAt(end - 1);
    if (end < text.length && lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
      end -= 1;
    }
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}
