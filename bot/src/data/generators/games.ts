export const rouletteLocations = [
  "a rooftop garden",
  "a midnight laundromat",
  "an abandoned observatory",
  "a traveling bookshop",
  "a train that never stops",
];

export const rouletteObjects = [
  "a cracked teacup",
  "a suspiciously warm key",
  "an umbrella with a note",
  "a jar of tiny paper cranes",
  "a clock with thirteen hours",
];

export const rouletteConstraints = [
  "Every sentence must mention a different color.",
  "A very opinionated goose must interrupt twice.",
  "Nobody is allowed to acknowledge the floating furniture.",
  "The narrator keeps confusing metaphors with literal events.",
  "The most sensible character is a houseplant.",
];

export const situations = {
  debate: "Convince a council of talking cats that umbrellas should be legal.",
  survival:
    "Find shelter, food, and a way home after getting lost in a forest that rearranges its paths.",
  contest:
    "Win a town festival's impossible scavenger hunt while sharing one very unreliable map.",
} satisfies Record<(typeof matchupChoices)[number]["value"], string>;
import type { matchupChoices } from "../../config/generatorOptions";
