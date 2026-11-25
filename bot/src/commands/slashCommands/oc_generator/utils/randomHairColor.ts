import {
  HairColour,
  HairColours,
} from "../../../../types/character/hair";
import { randomizeEnum } from "../../../../utils";

export function randomizeNumberOfHairColours(): number {
  const numberOfHairColours = Math.floor(Math.random() * 3) + 1;

  return numberOfHairColours;
}

export function randomizeHairColor(): HairColour[] {
  const numberOfHairColours = randomizeNumberOfHairColours();
  const randomHairColor: HairColour[] = [];
  for (let i = 0; i < numberOfHairColours; i++) {
    randomHairColor.push(randomizeEnum(HairColours));
  }

  return randomHairColor;
}
