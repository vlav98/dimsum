import {
  EyeColors,
  Heterochromia,
} from "../../types/character/eyeColors";
import { randomizeEnum } from "../../utils";

export function randomizeHeterochromia(): Heterochromia {
  return Math.random() < 0.5 ? Heterochromia.YES : Heterochromia.NO;
}

export function randomizeEyeColor(
  heterochromia: Heterochromia
): EyeColors | EyeColors[] {
  if (heterochromia === Heterochromia.YES) {
    const firstColor = randomizeEnum(EyeColors);
    let secondColor = randomizeEnum(EyeColors);
    while (secondColor === firstColor) {
      secondColor = randomizeEnum(EyeColors);
    }

    return [firstColor, secondColor];
  }

  return randomizeEnum(EyeColors);
}
