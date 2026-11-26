import { Sexuality } from "../../types/character/sexuality";
import { randomizeEnum } from "../../utils";

export function randomizeSexuality(): Sexuality {
  return randomizeEnum(Sexuality);
}
