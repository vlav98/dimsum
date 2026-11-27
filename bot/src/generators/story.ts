import { EmbedBuilder } from "discord.js";
import { universes, moods, tropes } from "../config/generatorOptions";
import {
  worlds,
  moodDirections,
  tropeDirections,
} from "../data/generators/story";
import { choose, pick } from "./random";

export function generatePrompt(
  filters: {
    universe?: string | null;
    mood?: string | null;
    trope?: string | null;
  } = {},
) {
  const universe = choose(universes, filters.universe);
  const mood = choose(moods, filters.mood);
  const trope = choose(tropes, filters.trope);
  const setting = pick(worlds[universe]);
  return new EmbedBuilder()
    .setTitle("Your story starts here")
    .setDescription(
      `In ${setting}, ${tropeDirections[trope][0].toLowerCase()}${tropeDirections[trope].slice(1)}\n\n${moodDirections[mood]}`,
    )
    .addFields(
      { name: "Universe", value: universe, inline: true },
      { name: "Mood", value: mood, inline: true },
      { name: "Trope", value: trope, inline: true },
    );
}
