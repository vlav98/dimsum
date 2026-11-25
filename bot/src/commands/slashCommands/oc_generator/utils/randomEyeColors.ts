import {
  EyeColors,
  Heterochromia,
} from "../../../../types/character/eyeColors";
import { randomizeEnum } from "../../../../utils";

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
