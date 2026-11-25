import { Guild } from "discord.js";

const defaultEmojis = [
  ["thumbsup", "👍"],
  ["thumbsdown", "👎"],
  ["heart", "❤️"],
  ["smile", "😄"],
  ["joy", "😂"],
  ["tada", "🎉"],
  ["fire", "🔥"],
  ["star", "⭐"],
  ["white_check_mark", "✅"],
  ["x", "❌"],
  ["eyes", "👀"],
  ["wave", "👋"],
  ["sparkles", "✨"],
  ["rainbow", "🌈"],
  ["art", "🎨"],
  ["book", "📖"],
  ["video_game", "🎮"],
  ["musical_note", "🎵"],
  ["sunny", "☀️"],
  ["crescent_moon", "🌙"],
];

export function listReactionEmojis(guild: Guild) {
  return [
    ...defaultEmojis.map(([name, value]) => ({
      name,
      value,
      imageUrl: null,
      source: "default",
    })),
    ...guild.emojis.cache
      .filter((emoji) => emoji.available)
      .map((emoji) => ({
        name: emoji.name ?? emoji.id,
        value: emoji.toString(),
        imageUrl: emoji.imageURL(),
        source: "server",
      })),
  ];
}

export function resolveReactionEmoji(
  guild: Guild,
  input: string,
): string | null {
  const value = input.trim();
  const code = value.match(/^:([A-Za-z0-9_]+):$/);
  if (!code) return value;
  const matching = listReactionEmojis(guild).filter(
    (emoji) => emoji.name === code[1],
  );
  const serverMatches = matching.filter((emoji) => emoji.source === "server");
  if (serverMatches.length > 1) return null;
  const emoji = serverMatches[0] ?? matching[0];
  return emoji?.value ?? null;
}
