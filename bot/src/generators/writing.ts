import { EmbedBuilder } from "discord.js";
import {
  randomizeEyeColor,
  randomizeGender,
  randomizeHairColor,
  randomizeHairLength,
  randomizeHeterochromia,
  randomizeSexuality,
  randomizeSpecies,
} from "../commands/slashCommands/antiWriterBlock/ocGenerator/utils";
import { Heterochromia } from "../types/character/eyeColors";

export function pick<T>(items: readonly T[]): T {
  if (items.length === 0)
    throw new Error("Cannot choose from an empty collection.");
  return items[Math.floor(Math.random() * items.length)];
}

export function sample<T>(items: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 1 || count > items.length) {
    throw new Error("The requested sample size is out of range.");
  }
  const pool = [...items];
  return Array.from(
    { length: count },
    () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
  );
}

export function choose<T extends string>(
  items: readonly T[],
  value?: string | null,
): T {
  if (!value) return pick(items);
  const match = items.find((item) => item === value);
  if (!match) throw new Error(`Unknown generator choice: ${value}`);
  return match;
}

const worlds = {
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
};
export const universes = [
  "fantasy",
  "modern",
  "sci-fi",
  "historical",
  "supernatural",
] as const;
export const moods = [
  "hopeful",
  "cozy",
  "mysterious",
  "dramatic",
  "adventurous",
] as const;
export const tropes = [
  "enemies to lovers",
  "hurt/comfort",
  "found family",
  "fake relationship",
  "second chances",
  "secret identity",
] as const;

const moodDirections: Record<(typeof moods)[number], string> = {
  hopeful: "Give them a small reason to believe things can change.",
  cozy: "Keep the stakes personal and let a small act of kindness matter.",
  mysterious: "Include one clue that neither character can explain.",
  dramatic: "Force them to choose between two promises they meant to keep.",
  adventurous: "Give them a deadline and an unfamiliar path to follow.",
};
const tropeDirections: Record<(typeof tropes)[number], string> = {
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

const nameParts = {
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
};
export const nameStyles = [
  "fantasy",
  "modern",
  "poetic",
  "mysterious",
] as const;
const nicknames = {
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
};

export function generateNames(
  styleValue?: string | null,
  count = 1,
  nickname = false,
) {
  const style = choose(nameStyles, styleValue);
  const parts = nameParts[style];
  const pool = nickname
    ? nicknames[style]
    : parts.first.flatMap((first) =>
        parts.last.map((last) => `${first} ${last}`),
      );
  return sample(pool, count);
}

export const ocSections = [
  "full",
  "personality",
  "appearance",
  "background",
] as const;
export const lifeStatuses = [
  "Alive",
  "Deceased",
  "Undead",
  "Missing",
  "Unknown",
] as const;
export interface CharacterOptions {
  name?: string;
  gender?: string;
  sexuality?: string;
  species?: string;
  hairColor?: string;
  hairLength?: string;
  eyeColor?: string;
  lifeStatus?: string;
  heterochromia?: boolean | null;
}
const personalities = [
  "patient",
  "curious",
  "stubborn",
  "generous",
  "observant",
  "impulsive",
  "witty",
  "idealistic",
  "reserved",
  "resourceful",
];
const flaws = [
  "Always promises more than they can deliver",
  "Confuses being needed with being loved",
  "Refuses to ask for help",
  "Treats every disagreement as a competition",
  "Cannot leave an unanswered question alone",
];
const phobias = [
  "Deep water",
  "Being forgotten",
  "Enclosed spaces",
  "Speaking before a crowd",
  "Losing control of their own choices",
];
const aesthetics = [
  "Weathered denim and pressed flowers",
  "Velvet, old keys, and candlelight",
  "Copper goggles and ink-stained sleeves",
  "Soft knitwear and storm-grey skies",
  "Bright patches on a carefully repaired coat",
];
const roles = [
  "A courier who delivers letters no one else will carry",
  "An archivist who restores damaged maps",
  "A reluctant mediator between rival neighborhoods",
  "A gardener protecting a community greenhouse",
  "A musician collecting forgotten folk songs",
];
const powers = [
  "Can hear the last promise made to an object",
  "Can borrow an animal's senses for one minute",
  "Can turn a written memory into a brief illusion",
  "Can find any lost doorway, but never the same one twice",
  "Can make one small plant grow overnight",
];
const secrets = [
  "Has been anonymously repairing an old rival's mistakes",
  "Uses a name borrowed from someone they once helped",
  "Keeps a letter addressed to their future self",
  "Knows why a local landmark disappeared",
  "Is secretly afraid their greatest success was an accident",
];

function characterTraits(style?: string, options: CharacterOptions = {}) {
  const name = options.name ?? generateNames(style)[0];
  const gender = options.gender ?? randomizeGender();
  const species =
    options.species ?? (style === "modern" ? "Human" : randomizeSpecies());
  const sexuality = options.sexuality ?? randomizeSexuality();
  const hairColor = options.hairColor ?? randomizeHairColor().join(", ");
  const hairLength = options.hairLength ?? randomizeHairLength();
  const lifeStatus = options.lifeStatus ?? pick(lifeStatuses);
  let heterochromia: Heterochromia | "Custom";
  let eyeColor: string;
  if (options.eyeColor) {
    eyeColor = options.eyeColor;
    heterochromia =
      options.heterochromia === null || options.heterochromia === undefined
        ? "Custom"
        : options.heterochromia
          ? Heterochromia.YES
          : Heterochromia.NO;
  } else {
    const eyeType =
      options.heterochromia === null || options.heterochromia === undefined
        ? randomizeHeterochromia()
        : options.heterochromia
          ? Heterochromia.YES
          : Heterochromia.NO;
    heterochromia = eyeType;
    const colors = randomizeEyeColor(eyeType);
    eyeColor = Array.isArray(colors) ? colors.join(" & ") : colors;
  }

  return {
    name,
    gender,
    species,
    sexuality,
    hairColor,
    hairLength,
    eyeColor,
    heterochromia,
    lifeStatus,
  };
}

export function generateRandomOC(options: CharacterOptions = {}) {
  const traits = characterTraits(undefined, options);
  return new EmbedBuilder()
    .setTitle("Random OC Generator")
    .setDescription("Here is your random OC!")
    .addFields(
      { name: "Name", value: traits.name },
      { name: "Gender", value: traits.gender },
      { name: "Species", value: traits.species },
      { name: "Sexuality", value: traits.sexuality },
      { name: "Hair color", value: traits.hairColor },
      { name: "Hair length", value: traits.hairLength },
      { name: "Eye color", value: traits.eyeColor },
      { name: "Heterochromia", value: traits.heterochromia },
      { name: "Life status", value: traits.lifeStatus },
    );
}

export function generateOC(
  styleValue?: string | null,
  sectionValue?: string | null,
  options: CharacterOptions = {},
) {
  const style = choose(nameStyles, styleValue);
  const section = sectionValue ? choose(ocSections, sectionValue) : "full";
  const traits = characterTraits(style, options);
  const fields = [
    { name: "Name", value: traits.name, section: "all" },
    {
      name: "Personality",
      value: sample(personalities, 2).join(", "),
      section: "personality",
    },
    { name: "Flaw", value: pick(flaws), section: "personality" },
    { name: "Phobia", value: pick(phobias), section: "personality" },
    { name: "Aesthetic", value: pick(aesthetics), section: "appearance" },
    {
      name: "Power / role",
      value:
        style === "modern"
          ? pick(roles)
          : `${pick(roles)}. Gift: ${pick(powers)}.`,
      section: "background",
    },
    { name: "Secret", value: pick(secrets), section: "background" },
    { name: "Gender", value: traits.gender, section: "appearance" },
    { name: "Species", value: traits.species, section: "appearance" },
    { name: "Sexuality", value: traits.sexuality, section: "background" },
    {
      name: "Hair color",
      value: traits.hairColor,
      section: "appearance",
    },
    {
      name: "Hair length",
      value: traits.hairLength,
      section: "appearance",
    },
    {
      name: "Eye color",
      value: traits.eyeColor,
      section: "appearance",
    },
    {
      name: "Heterochromia",
      value: traits.heterochromia,
      section: "appearance",
    },
    { name: "Life status", value: traits.lifeStatus, section: "background" },
  ];
  return new EmbedBuilder()
    .setTitle("Original character sheet")
    .setDescription(
      `${traits.name} | ${style} | ${section === "full" ? "Full sheet" : section}`,
    )
    .addFields(
      fields
        .filter(
          (field) =>
            section === "full" ||
            field.section === "all" ||
            field.section === section,
        )
        .map(({ name, value }) => ({ name, value })),
    );
}

export const keywords = [
  "late-night rain",
  "unsent letter",
  "false identity",
  "broken compass",
  "empty train station",
  "borrowed coat",
  "forgotten birthday",
  "paper stars",
  "locked greenhouse",
  "shared umbrella",
  "last voicemail",
  "a familiar stranger",
  "midnight bakery",
  "unreliable map",
  "second sunrise",
  "missing photograph",
  "a promise in pencil",
  "wrong address",
  "quiet rebellion",
  "unexpected kindness",
  "the last ticket",
  "someone else's key",
  "a room full of clocks",
  "unfinished song",
];
export const twists = [
  "The message was not sent by the person whose name appears on it; it was written by their future self.",
  "The place everyone is trying to reach has been following them.",
  "The rival has been solving a different problem with exactly the same clues.",
  "The missing object was returned yesterday, but nobody remembers receiving it.",
  "The supposed prediction describes a choice the protagonist has already made.",
  "The anonymous helper is someone the protagonist once refused to help.",
  "The secret passage leads to an ordinary room that should not exist.",
  "The plan works perfectly, revealing that its original goal was mistaken.",
];
const challenges = [
  "Write a scene in under 150 words without using any form of the verb 'to be'.",
  "Write 100 words of dialogue in which neither character answers a question directly.",
  "Describe a familiar place in 120 words using sound and touch, but not sight.",
  "Write a complete story in exactly six sentences. The last must change the meaning of the first.",
  "Write a 150-word apology that never uses the words 'sorry' or 'apologize'.",
  "Spend eight minutes writing a scene that starts with an unexpected knock.",
  "Write 100 words from the point of view of an object that has changed owners.",
  "Write a reunion in under 200 words without explaining why the characters separated.",
  "Write a scene in 12 lines of dialogue with no dialogue tags.",
  "Write a 100-word scene where the weather contradicts the character's mood.",
  "Describe a character's secret using only the contents of their bag, in under 150 words.",
  "Write two versions of the same 80-word scene: one hopeful, one mysterious.",
];
export function writingChallenge(date?: Date): string {
  if (!date) return pick(challenges);
  const day = Math.floor(date.getTime() / 86_400_000);
  if (!Number.isFinite(day)) throw new Error("A valid date is required.");
  return challenges[
    ((day % challenges.length) + challenges.length) % challenges.length
  ];
}

export function generateRoulette() {
  return new EmbedBuilder()
    .setTitle("Writing roulette")
    .addFields(
      { name: "Trope", value: pick(tropes) },
      {
        name: "Location",
        value: pick([
          "a rooftop garden",
          "a midnight laundromat",
          "an abandoned observatory",
          "a traveling bookshop",
          "a train that never stops",
        ]),
      },
      {
        name: "Object",
        value: pick([
          "a cracked teacup",
          "a suspiciously warm key",
          "an umbrella with a note",
          "a jar of tiny paper cranes",
          "a clock with thirteen hours",
        ]),
      },
      {
        name: "Absurd constraint",
        value: pick([
          "Every sentence must mention a different color.",
          "A very opinionated goose must interrupt twice.",
          "Nobody is allowed to acknowledge the floating furniture.",
          "The narrator keeps confusing metaphors with literal events.",
          "The most sensible character is a houseplant.",
        ]),
      },
    );
}

export function generateMatchup(
  first?: string | null,
  second?: string | null,
  situation?: string | null,
) {
  const names = generateNames("fantasy", 2);
  const scenario = choose(
    ["debate", "survival", "contest"] as const,
    situation,
  );
  const situations = {
    debate:
      "Convince a council of talking cats that umbrellas should be legal.",
    survival:
      "Find shelter, food, and a way home after getting lost in a forest that rearranges its paths.",
    contest:
      "Win a town festival's impossible scavenger hunt while sharing one very unreliable map.",
  };
  return new EmbedBuilder()
    .setTitle("OC matchup")
    .addFields(
      {
        name: "First OC",
        value: first || `${names[0]}: ${pick(personalities)}; ${pick(roles)}.`,
      },
      {
        name: "Second OC",
        value: second || `${names[1]}: ${pick(personalities)}; ${pick(roles)}.`,
      },
      { name: "Situation", value: situations[scenario] },
    )
    .setFooter({
      text: "No winner is chosen. Let the characters and community decide what happens.",
    });
}
