import { EmbedBuilder, escapeMarkdown, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";

interface UnsplashPhoto {
  urls: { regular: string };
  links: { html: string };
  user: { name: string; links: { html: string } };
}

function isUnsplashPhoto(value: unknown): value is UnsplashPhoto {
  if (!value || typeof value !== "object") return false;
  const photo = value as Record<string, unknown>;
  const urls = photo.urls as Record<string, unknown> | null;
  const links = photo.links as Record<string, unknown> | null;
  const user = photo.user as Record<string, unknown> | null;
  const userLinks = user?.links as Record<string, unknown> | null;
  return (
    typeof urls?.regular === "string" &&
    typeof links?.html === "string" &&
    typeof user?.name === "string" &&
    typeof userLinks?.html === "string"
  );
}

function attributionUrl(value: string): string {
  const url = new URL(value);
  url.searchParams.set("utm_source", "dimsum");
  url.searchParams.set("utm_medium", "referral");
  return url.toString();
}

export const pose: Command = {
  data: new SlashCommandBuilder()
    .setName("pose")
    .setDescription("Get a random pose photo for drawing reference"),
  async run(interaction) {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
      await interaction.reply({
        content:
          "Pose references are unavailable: the Unsplash access key is not configured.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    let photo: UnsplashPhoto | null;
    try {
      const url = new URL("https://api.unsplash.com/photos/random");
      url.searchParams.set("query", "pose");
      url.searchParams.set("content_filter", "high");
      const response = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
          "Accept-Version": "v1",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 404) {
        photo = null;
      } else {
        if (!response.ok)
          throw new Error(`Unsplash returned HTTP ${response.status}`);
        const data: unknown = await response.json();
        if (!isUnsplashPhoto(data))
          throw new Error("Unsplash returned an invalid response");
        photo = data;
      }
    } catch (error) {
      console.error("Could not fetch pose reference from Unsplash:", error);
      await interaction.editReply(
        "Could not fetch a pose reference from Unsplash. Please try again later.",
      );
      return;
    }

    if (!photo) {
      await interaction.editReply(
        "No pose references were found on Unsplash. Please try again later.",
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Pose reference")
      .setURL(attributionUrl(photo.links.html))
      .setImage(photo.urls.regular)
      .setDescription(
        `Photo by [${escapeMarkdown(photo.user.name)}](${attributionUrl(photo.user.links.html)}) on [Unsplash](${attributionUrl("https://unsplash.com/")}).`,
      );
    await interaction.editReply({ embeds: [embed] });
  },
};
