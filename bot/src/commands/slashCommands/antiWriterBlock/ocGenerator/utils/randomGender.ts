import { Gender } from "../../../../../types/character/gender";
import { randomizeEnum } from "../../../../../utils";

export function randomizeGender(): Gender {
  return randomizeEnum(Gender);
}
