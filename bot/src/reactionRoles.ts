import {
  ChannelType,
  Client,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  PermissionFlagsBits,
  Role,
  User,
} from "discord.js";
import {
  findReactionRoleMessage,
  ReactionRoleMapping,
  removeReactionRoleMessage,
  saveReactionRoleMessage,
} from "./storage";

export class ReactionRoleSetupError extends Error {}

const restrictedRolePermissions = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ViewAuditLog,
  PermissionFlagsBits.ManageNicknames,
  PermissionFlagsBits.ManageGuildExpressions,
  PermissionFlagsBits.MentionEveryone,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageEvents,
  PermissionFlagsBits.ManageThreads,
];

export function canBeReactionAssigned(
  role: Role,
  highestBotRolePosition: number,
): boolean {
  return (
    role.id !== role.guild.id &&
    !role.managed &&
    role.position < highestBotRolePosition &&
    !role.permissions.any(restrictedRolePermissions)
  );
}

export async function publishReactionRoleMessage(
  client: Client,
  guildId: string,
  channelId: string,
  content: string,
  mappings: ReactionRoleMapping[],
): Promise<{ messageId: string; channelId: string; createdAt: string }> {
  const trimmedContent = content.trim();
  if (!trimmedContent || trimmedContent.length > 2000) {
    throw new ReactionRoleSetupError(
      "Message text must be between 1 and 2000 characters.",
    );
  }
  if (mappings.length < 1 || mappings.length > 10) {
    throw new ReactionRoleSetupError(
      "Configure between 1 and 10 emoji-to-role mappings.",
    );
  }

  const normalizedMappings = mappings.map(({ emoji, roleId }) => ({
    emoji: emoji.trim(),
    roleId,
  }));
  if (
    normalizedMappings.some(
      ({ emoji, roleId }) =>
        !emoji || emoji.length > 100 || !/^\d{17,20}$/.test(roleId),
    )
  ) {
    throw new ReactionRoleSetupError("Each mapping needs a valid emoji and role.");
  }
  const emojiKeys = normalizedMappings.map(({ emoji }) => emojiKey(emoji));
  if (new Set(emojiKeys).size !== emojiKeys.length) {
    throw new ReactionRoleSetupError("Each reaction emoji must be unique.");
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    throw new ReactionRoleSetupError("The bot is not in this server.");
  }

  const channel = guild.channels.cache.get(channelId);
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    throw new ReactionRoleSetupError(
      "Choose a text or announcement channel in this server.",
    );
  }

  const botMember = guild.members.me ?? (await guild.members.fetchMe());
  const channelPermissions = channel.permissionsFor(botMember);
  if (
    !channelPermissions?.has([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.AddReactions,
    ])
  ) {
    throw new ReactionRoleSetupError(
      "The bot needs View Channel, Send Messages, and Add Reactions in that channel.",
    );
  }
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new ReactionRoleSetupError("The bot needs the Manage Roles permission.");
  }

  for (const { roleId } of normalizedMappings) {
    const role = guild.roles.cache.get(roleId);
    if (
      !role ||
      !canBeReactionAssigned(role, botMember.roles.highest.position)
    ) {
      throw new ReactionRoleSetupError(
        "Roles with administrator/moderation permissions cannot be self-assigned; other roles must be below the bot’s highest role.",
      );
    }
  }

  const message = await channel.send({
    content: trimmedContent,
    allowedMentions: { parse: [] },
  });
  try {
    for (const { emoji } of normalizedMappings) {
      await message.react(emoji);
    }
    const createdAt = new Date().toISOString();
    await saveReactionRoleMessage({
      guildId,
      channelId,
      messageId: message.id,
      content: trimmedContent,
      mappings: normalizedMappings,
      createdAt,
    });
    return { messageId: message.id, channelId, createdAt };
  } catch (error) {
    await message.delete().catch((deleteError: unknown) => {
      console.error("Could not remove incomplete reaction-role message:", deleteError);
    });
    throw error;
  }
}

export async function deleteReactionRoleMessage(
  client: Client,
  guildId: string,
  messageId: string,
): Promise<void> {
  const configured = await findReactionRoleMessage(messageId);
  if (!configured || configured.guildId !== guildId) {
    throw new ReactionRoleSetupError("Reaction-role message not found.");
  }
  const channel = client.channels.cache.get(configured.channelId);
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    await removeReactionRoleMessage(messageId);
    return;
  }

  const message = await channel.messages.fetch(messageId).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === 10008) {
      return null;
    }
    throw error;
  });
  if (message) await message.delete();
  await removeReactionRoleMessage(messageId);
}

function emojiKey(emoji: string): string {
  const customEmoji = emoji.match(/^<a?:[^:]+:(\d+)>$/);
  return customEmoji ? `custom:${customEmoji[1]}` : `unicode:${emoji}`;
}

function reactionMatches(
  configuredEmoji: string,
  reaction: MessageReaction | PartialMessageReaction,
): boolean {
  const customEmoji = configuredEmoji.match(/^<a?:[^:]+:(\d+)>$/);
  if (customEmoji) return reaction.emoji.id === customEmoji[1];
  return reaction.emoji.id === null && reaction.emoji.name === configuredEmoji;
}

export async function applyReactionRole(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  add: boolean,
): Promise<void> {
  if (user.bot) return;
  const memberUser = user.partial ? await user.fetch() : user;

  const fullReaction = reaction.partial ? await reaction.fetch() : reaction;
  const message =
    fullReaction.message.partial
      ? await fullReaction.message.fetch()
      : fullReaction.message;
  const configured = await findReactionRoleMessage(message.id);
  if (!configured) return;

  const mapping = configured.mappings.find((item) =>
    reactionMatches(item.emoji, fullReaction),
  );
  if (!mapping || !message.guild) return;

  const role =
    message.guild.roles.cache.get(mapping.roleId) ??
    (await message.guild.roles.fetch(mapping.roleId));
  if (!role || role.managed || role.id === message.guild.id) return;

  const member = await message.guild.members.fetch(memberUser.id);
  if (add) await member.roles.add(role, "Reaction role selected");
  else await member.roles.remove(role, "Reaction role deselected");
}
