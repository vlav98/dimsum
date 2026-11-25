import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { CommunitySetupError, writingChannel } from "../../../community";
import { setWritingChannel } from "../../../storage";

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
