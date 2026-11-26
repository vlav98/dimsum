import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { publishReactionRoleMessage } from "../../../features/reactionRoles/reactionRoles";
import { ReactionRoleMapping } from "../../../storage";

const reactionRoleCommand = new SlashCommandBuilder()
  .setName("reactionroles")
  .setDescription("Create a message that assigns roles by reaction")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Where to post the reaction-role message")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Text to post above the role reactions")
      .setMaxLength(2000)
      .setRequired(true),
  );

for (let index = 1; index <= 10; index += 1) {
  reactionRoleCommand
    .addStringOption((option) =>
      option
        .setName(`emoji_${index}`)
        .setDescription(`Reaction emoji for role mapping ${index}`)
        .setMaxLength(100)
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option
        .setName(`role_${index}`)
        .setDescription(`Role granted by reaction ${index}`)
        .setRequired(false),
    );
}

async function createReactionRoleSet(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({
      content: "Use this command in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: "You need Manage Server permission to create reaction roles.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const mappings: ReactionRoleMapping[] = [];
  for (let index = 1; index <= 10; index += 1) {
    const emoji = interaction.options.getString(`emoji_${index}`);
    const role = interaction.options.getRole(`role_${index}`);
    if (Boolean(emoji) !== Boolean(role)) {
      await interaction.reply({
        content: `Mapping ${index} needs both an emoji and a role.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (emoji && role) mappings.push({ emoji, roleId: role.id });
  }
  if (mappings.length === 0) {
    await interaction.reply({
      content: "Add at least one emoji and role pair.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const channel = interaction.options.getChannel("channel", true);
  const content = interaction.options.getString("message", true);
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    await publishReactionRoleMessage(
      interaction.client,
      interaction.guildId,
      channel.id,
      content,
      mappings,
    );
    await interaction.editReply(
      `Reaction-role message created in <#${channel.id}>.`,
    );
  } catch (error) {
    await interaction.editReply(
      error instanceof Error
        ? error.message
        : "Could not create the reaction-role message.",
    );
  }
}

export const reactionRoles: Command = {
  data: reactionRoleCommand,
  run: createReactionRoleSet,
};
