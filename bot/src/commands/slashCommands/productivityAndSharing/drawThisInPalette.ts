import {
  AttachmentBuilder,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  Message,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../../interfaces/Command";
import { fetchPoseReference } from "../../../features/community/unsplash";
import { generatePalette, renderPalette } from "../../../generators/palette";
import { saveArtChallenge } from "../../../storage";
import { setArtChallengeStarting } from "../../../features/community/artChallenges";

export const drawThisInPalette: Command = {
  data: new SlashCommandBuilder()
    .setName("draw-this-in-palette")
    .setDescription("Start a timed community drawing challenge in a thread")
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((option) =>
      option
        .setName("view_minutes")
        .setDescription("Reference viewing time in minutes (default 10)")
        .setMinValue(1)
        .setMaxValue(720),
    )
    .addIntegerOption((option) =>
      option
        .setName("submit_minutes")
        .setDescription("Submission time after viewing ends (default 60)")
        .setMinValue(1)
        .setMaxValue(720),
    ),
  async run(interaction) {
    const channel = interaction.channel;
    if (
      !interaction.guildId ||
      !channel ||
      (channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildAnnouncement)
    ) {
      await interaction.reply({
        content: "Use this command in a server text or announcement channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (
      !interaction.appPermissions?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
      ])
    ) {
      await interaction.reply({
        content:
          "DimSum needs permission to view and send messages, create public threads, send messages in threads, read message history, embed links, and attach files in this channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
      await interaction.reply({
        content: "The Unsplash access key is not configured.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let post: Message | undefined;
    try {
      const reference = await fetchPoseReference(apiKey);
      if (!reference) {
        await interaction.editReply(
          "No pose references were found on Unsplash. Please try again later.",
        );
        return;
      }
      const { harmony, colors } = generatePalette(
        2 + Math.floor(Math.random() * 7),
      );
      const hideAt =
        Date.now() +
        (interaction.options.getInteger("view_minutes") ?? 10) * 60_000;
      const endAt =
        hideAt +
        (interaction.options.getInteger("submit_minutes") ?? 60) * 60_000;
      const hideSeconds = Math.floor(hideAt / 1000);
      const endSeconds = Math.floor(endAt / 1000);
      const challenge = new EmbedBuilder()
        .setTitle("Draw this in a palette")
        .setDescription(
          `Create a study using this ${harmony.toLowerCase()} palette and the reference in the thread.\n\nReference hidden: <t:${hideSeconds}:F> (<t:${hideSeconds}:R>)\nSubmission deadline: <t:${endSeconds}:F> (<t:${endSeconds}:R>)\nPost your work in the thread any time before the deadline.`,
        )
        .addFields({
          name: "Colors",
          value: colors.map((color) => `\`${color}\``).join("  "),
        })
        .setColor(parseInt(colors[0].slice(1), 16))
        .setImage("attachment://palette.png");
      post = await channel.send({
        content: "Preparing the challenge; please wait for it to start.",
        embeds: [challenge],
        files: [
          new AttachmentBuilder(renderPalette(colors), { name: "palette.png" }),
        ],
        allowedMentions: { parse: [] },
      });
      const thread = await post.startThread({
        name: "Draw this in a palette",
        autoArchiveDuration: 1440,
      });
      const referenceMessage = await thread.send({
        content: `Reference visible until <t:${hideSeconds}:F> (<t:${hideSeconds}:R>). Submit your study by <t:${endSeconds}:F> (<t:${endSeconds}:R>).`,
        embeds: [new EmbedBuilder().setTitle("Preparing reference")],
        allowedMentions: { parse: [] },
      });
      setArtChallengeStarting(thread.id, true);
      try {
        await saveArtChallenge({
          threadId: thread.id,
          referenceMessageId: referenceMessage.id,
          hideAt,
          endAt,
          hidden: false,
        });
        if (Date.now() >= hideAt) {
          await post.edit({
            content:
              "The challenge could not start before the viewing time expired.",
            allowedMentions: { parse: [] },
          });
          await interaction.editReply(
            `The reference viewing time elapsed before the challenge could start: ${thread.url}`,
          );
          return;
        }
        await referenceMessage.edit({ embeds: [reference] });
      } finally {
        setArtChallengeStarting(thread.id, false);
      }
      await post.edit({
        content:
          "Challenge started. Join the thread to view the reference and share your study.",
        allowedMentions: { parse: [] },
      });
      await interaction.editReply(`Challenge started: ${thread.url}`);
    } catch (error) {
      console.error("Could not start drawing challenge:", error);
      if (post) {
        try {
          await post.edit({
            content: "The challenge could not be fully started.",
            allowedMentions: { parse: [] },
          });
        } catch (editError) {
          console.error(
            "Could not update the drawing challenge post:",
            editError,
          );
        }
      }
      await interaction.editReply(
        "The drawing challenge could not be started. Check Unsplash and the bot's channel permissions.",
      );
    }
  },
};
