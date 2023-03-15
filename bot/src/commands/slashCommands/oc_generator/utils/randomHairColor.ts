import { HairColours } from "../../../../types/character/hair";
import { randomizeEnum } from "../../../../utils";

export function randomizeNumberOfHairColours(): number {
  const numberOfHairColours = Math.floor(Math.random() * 3) + 1;

  return numberOfHairColours;
}

export function randomizeHairColor(): HairColours[] {
  const numberOfHairColours = randomizeNumberOfHairColours();
  const randomHairColor: HairColours[] = [];
  for (let i = 0; i < numberOfHairColours; i++) {
    randomHairColor.push(randomizeEnum(HairColours));
  }

  return randomHairColor;
}

const numberOfHairColours = randomizeNumberOfHairColours();
console.log("How many hair colours do they have ?", numberOfHairColours);
console.log("What are their hair colours ?", randomizeHairColor());
