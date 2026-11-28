import {
  characterEmojiPools,
  emojiGenres,
  emojiPalettes,
  sceneEmojiPools,
} from "../data/generators/emojiArt";
import { choose, pick } from "./random";

export function generateEmojiOC(genre: string | null, count: number | null) {
  const selectedGenre = choose(emojiGenres, genre);
  const selectedCount = count ?? (Math.random() < 0.5 ? 3 : 4);
  if (selectedCount !== 3 && selectedCount !== 4)
    throw new RangeError("Choose 3 or 4 emojis.");
  const pool = characterEmojiPools[selectedGenre];
  const categories = [
    { name: "Vibe", choices: pool.vibe },
    { name: "Object", choices: pool.object },
    { name: "Creature / motif", choices: pool.motif },
    { name: "Mood / wildcard", choices: pool.mood },
  ];
  const used = new Set<string>();
  const prompts = categories
    .slice(0, selectedCount)
    .map(({ name, choices }) => {
      const emoji = pick(choices.filter((choice) => !used.has(choice)));
      used.add(emoji);
      return { name, emoji };
    });
  return { genre: selectedGenre, prompts };
}

export function generateEmojiScene() {
  return {
    setting: pick(sceneEmojiPools.setting),
    weather: pick(sceneEmojiPools.weather),
    focus: pick(sceneEmojiPools.focus),
  };
}

export function generateEmojiPalette() {
  return pick(emojiPalettes);
}
