import {
  EyeColors,
  Heterochromia,
} from "../../../../types/character/eyeColors";
import { randomizeEnum } from "../../../../utils";

const eyeColor = [
  "shades of green",
  "any but neon",
  "any but light",
  "half blind",
  "full blind",
  "any natural color",
  "any brown color",
  "any but dark",
  "any",
  "shades of purple",
  "shades of blue",
  "shandes of yellow",
  "shades of orange",
  "shades of red",
];

export function isHeterochromia(): Heterochromia {
  return Math.random() < 0.5 ? Heterochromia.YES : Heterochromia.NO;
}

const isHeterochromiaValue = isHeterochromia();
console.log("Does their eyes have heterochromia ?", isHeterochromiaValue);

export function randomizeEyeColor(
  isHeterochromia: Heterochromia
): EyeColors | EyeColors[] {
  if (isHeterochromia === Heterochromia.YES) {
    return [randomizeEnum(EyeColors), randomizeEnum(EyeColors)];
  } else {
    return randomizeEnum(EyeColors);
  }
}

console.log("What is their eyes ?", randomizeEyeColor(isHeterochromiaValue));
