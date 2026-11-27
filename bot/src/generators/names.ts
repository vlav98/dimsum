import { nameStyles } from "../config/generatorOptions";
import { nameParts, nicknames } from "../data/generators/names";
import { choose, sample } from "./random";

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
