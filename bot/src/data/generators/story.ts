import type { moods, tropes, universes } from "../../config/generatorOptions";

export const worlds = {
  fantasy: [
    "a floating city losing altitude",
    "a library whose books remember their readers",
    "a border town where magic has stopped working",
  ],
  modern: [
    "the last train home during a blackout",
    "a neighborhood cafe about to close",
    "a shared apartment on moving day",
  ],
  "sci-fi": [
    "a space station receiving tomorrow's distress calls",
    "a colony whose navigation AI has vanished",
    "a research ship orbiting an uncharted moon",
  ],
  historical: [
    "a coastal town awaiting its first railway",
    "a royal court preparing a masked celebration",
    "a remote inn during a winter storm",
  ],
  supernatural: [
    "a town where shadows arrive a day late",
    "a museum that opens only for ghosts",
    "a lighthouse that guides lost memories",
  ],
} satisfies Record<(typeof universes)[number], readonly string[]>;

export const moodDirections: Record<(typeof moods)[number], string> = {
  hopeful: "Give them a small reason to believe things can change.",
  cozy: "Keep the stakes personal and let a small act of kindness matter.",
  mysterious: "Include one clue that neither character can explain.",
  dramatic: "Force them to choose between two promises they meant to keep.",
  adventurous: "Give them a deadline and an unfamiliar path to follow.",
};

export const tropeDirections: Record<(typeof tropes)[number], string> = {
  "enemies to lovers":
    "Two rivals must cooperate, and discover that their worst assumptions about each other were wrong.",
  "hurt/comfort":
    "Someone hides a painful setback until an unlikely companion notices and offers help.",
  "found family":
    "A group of strangers must decide whether to protect one another or go their separate ways.",
  "fake relationship":
    "Two acquaintances pretend to be a couple to keep a harmless cover story alive.",
  "second chances":
    "Two former friends meet again with one unfinished promise between them.",
  "secret identity":
    "A familiar stranger leaves behind evidence of a second life.",
};
