import {
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { generatedCommand } from "../../generatedCommand";
import { generatePrompt, writingChallenge } from "../../../generators/writing";
import { CommunitySetupError, writingChannel } from "../../../community";
import { getWritingChannel, setWritingChannel } from "../../../storage";
import { savePromptButton } from "../../../promptComponents";

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

export const writingChannelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("writing-channel")
    .setDescription("Set the dedicated community writing channel")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Where /group-prompt will publish")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    ),
  run: async (interaction) => {
    if (
      !interaction.guildId ||
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content:
          "You need Manage Server permission to configure a writing channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const channel = await writingChannel(
        interaction.client,
        interaction.guildId,
        interaction.options.getChannel("channel", true).id,
      );
      await setWritingChannel(interaction.guildId, channel.id);
      await interaction.editReply(
        `Community prompts will be posted in <#${channel.id}>.`,
      );
    } catch (error) {
      console.error("Could not configure the writing channel:", error);
      await interaction.editReply(
        error instanceof CommunitySetupError
          ? error.message
          : "The writing channel could not be saved.",
      );
    }
  },
};

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

export const productivityCommands = [challenge, daily, groupPrompt];
