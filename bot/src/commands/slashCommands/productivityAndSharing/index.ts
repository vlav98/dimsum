import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { generatedCommand } from "../../generatedCommand";
import { generatePrompt, writingChallenge } from "../../../generators/writing";
import { CommunitySetupError, writingChannel } from "../../../features/community/channels";
import { getWritingChannel } from "../../../storage";
import { savePromptButton } from "../../../components/common/promptButtons/promptButtons";
import { drawThisInPalette } from "./drawThisInPalette";

export const challenge = generatedCommand(
  new SlashCommandBuilder()
    .setName("challenge")
    .setDescription("Try a fresh micro-writing challenge"),
  "challenge",
  () =>
    new EmbedBuilder()
      .setTitle("A small challenge, a fresh start")
      .setDescription(writingChallenge()),
);

export const daily = generatedCommand(
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription(
      "Today's shared writing challenge (resets at midnight UTC)",
    ),
  "challenge",
  () => {
    const now = new Date();
    return new EmbedBuilder()
      .setTitle(
        `Daily writing challenge | ${now.toISOString().slice(0, 10)} UTC`,
      )
      .setDescription(writingChallenge(now))
      .setFooter({
        text: "The same challenge for everyone today. Changes at midnight UTC.",
      });
  },
);

export const groupPrompt: Command = {
  data: new SlashCommandBuilder()
    .setName("group-prompt")
    .setDescription(
      "Post a shared story starter in this server's configured writing channel",
    )
    .setContexts(InteractionContextType.Guild),
  run: async (interaction) => {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "Use /group-prompt in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const channelId = await getWritingChannel(interaction.guildId);
      if (!channelId) {
        await interaction.editReply(
          "Ask a server manager to set a dedicated channel using /writing-channel or the dashboard.",
        );
        return;
      }
      const channel = await writingChannel(
        interaction.client,
        interaction.guildId,
        channelId,
      );
      const member = await channel.guild.members.fetch(interaction.user.id);
      if (
        !channel
          .permissionsFor(member)
          ?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ])
      ) {
        await interaction.editReply(
          "You need access to view and send messages in the configured writing channel.",
        );
        return;
      }
      const embed = generatePrompt()
        .setTitle("One prompt, many stories")
        .setFooter({
          text: "Post your own take in this channel. There is no single correct interpretation.",
        });
      const message = await channel.send({
        embeds: [embed],
        components: [savePromptButton("group")],
        allowedMentions: { parse: [] },
      });
      await interaction.editReply(`Community prompt posted: ${message.url}`);
    } catch (error) {
      console.error("Could not publish the community prompt:", error);
      await interaction.editReply(
        error instanceof CommunitySetupError
          ? error.message
          : "The community prompt could not be posted. Ask a manager to check the channel permissions.",
      );
    }
  },
};

export const productivityAndSharingCommands = [challenge, daily, groupPrompt, drawThisInPalette];
