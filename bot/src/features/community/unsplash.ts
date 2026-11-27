import { EmbedBuilder, escapeMarkdown } from "discord.js";

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

export async function fetchPoseReference(
  apiKey: string,
): Promise<EmbedBuilder | null> {
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
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Unsplash returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!isUnsplashPhoto(data))
    throw new Error("Unsplash returned an invalid response");
  return new EmbedBuilder()
    .setTitle("Pose reference")
    .setURL(attributionUrl(data.links.html))
    .setImage(data.urls.regular)
    .setDescription(
      `Photo by [${escapeMarkdown(data.user.name)}](${attributionUrl(data.user.links.html)}) on [Unsplash](${attributionUrl("https://unsplash.com/")}).`,
    );
}
