export const nameParts = {
  fantasy: {
    first: ["Aerin", "Thalen", "Liora", "Veyra", "Kael", "Sorren"],
    last: [
      "Ashfall",
      "Moonmere",
      "Emberveil",
      "Starling",
      "Duskwood",
      "Windward",
    ],
  },
  modern: {
    first: ["Alex", "Rowan", "Jules", "Morgan", "Sasha", "Avery"],
    last: ["Reed", "Park", "Rivera", "Ellis", "Bennett", "Laurent"],
  },
  poetic: {
    first: ["Echo", "Lyric", "Sol", "Aster", "Lark", "Wren"],
    last: [
      "of the Quiet Sea",
      "After Rain",
      "Silver Dawn",
      "of Falling Stars",
      "Winterlight",
      "Soft Thunder",
    ],
  },
  mysterious: {
    first: ["Vale", "Noct", "Sable", "Rune", "Nyx", "Vesper"],
    last: ["Blackthorn", "Hollow", "Rook", "Veil", "Locke", "Greyglass"],
  },
} satisfies Record<
  (typeof nameStyles)[number],
  { first: readonly string[]; last: readonly string[] }
>;

export const nicknames = {
  fantasy: [
    "Ember",
    "Silverleaf",
    "Stargazer",
    "Wayfinder",
    "Little Comet",
    "Stormsong",
  ],
  modern: ["Ace", "Scout", "Sunny", "Sparks", "Blue", "Lucky"],
  poetic: [
    "Moonbeam",
    "Daybreak",
    "Wildflower",
    "Blue Hour",
    "Rainbird",
    "Paper Moon",
  ],
  mysterious: ["Cipher", "Ghostlight", "Rook", "Whisper", "Nightjar", "Nobody"],
} satisfies Record<(typeof nameStyles)[number], readonly string[]>;
import type { nameStyles } from "../../config/generatorOptions";
