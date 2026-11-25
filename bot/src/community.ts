import { ChannelType, Client, PermissionFlagsBits } from "discord.js";

export class CommunitySetupError extends Error {}

function isWritingChannel(channel: { type: ChannelType }) {
  return (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.GuildAnnouncement
  );
}

const writingPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

export async function listWritingChannels(client: Client, guildId: string) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new CommunitySetupError("DimSum is not in this server.");
  const member = guild.members.me ?? (await guild.members.fetchMe());
  return [...guild.channels.cache.values()].flatMap((channel) =>
    isWritingChannel(channel) &&
    "permissionsFor" in channel &&
    channel.permissionsFor(member)?.has(writingPermissions)
      ? [
          {
            id: channel.id,
            name: channel.name,
            category: channel.parent?.name ?? null,
          },
        ]
      : [],
  );
}

export async function writingChannel(
  client: Client,
  guildId: string,
  channelId: string,
) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new CommunitySetupError("DimSum is not in this server.");
  const channel = guild.channels.cache.get(channelId);
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    throw new CommunitySetupError(
      "Choose a text or announcement channel in this server.",
    );
  }
  const member = guild.members.me ?? (await guild.members.fetchMe());
  if (!channel.permissionsFor(member)?.has(writingPermissions)) {
    throw new CommunitySetupError(
      "DimSum needs View Channel, Send Messages, and Embed Links in the writing channel.",
    );
  }
  return channel;
}
