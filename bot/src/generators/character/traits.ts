import {
  randomizeEyeColor,
  randomizeGender,
  randomizeHairColor,
  randomizeHairLength,
  randomizeHeterochromia,
  randomizeSexuality,
  randomizeSpecies,
} from "./index";
import { Heterochromia } from "../../types/character/eyeColors";
import { lifeStatuses } from "../../config/generatorOptions";
import { generateNames } from "../names";
import { pick } from "../random";
import type { CharacterOptions } from "./types";

export function characterTraits(
  style?: string,
  options: CharacterOptions = {},
) {
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
