import { randomizeEnum } from '../../../../utils';
import { HairColours } from '../../../../types/character/hair';

export function randomizeNumberOfHairColours(): number {
  const numberOfHairColours = Math.floor(Math.random() * 3) + 1;

  return numberOfHairColours;
}

export function randomizeHairColor(): string[] {
  const numberOfHairColours = randomizeNumberOfHairColours();
  const randomHairColor: string[] = [];
  for (let i = 0; i < numberOfHairColours; i++) {
    randomHairColor.push(randomizeEnum(HairColours));
  }

  return randomHairColor;
}

const numberOfHairColours = randomizeNumberOfHairColours();
// console.log('How many hair colours do they have ?', numberOfHairColours);
// console.log('What are their hair colours ?', randomizeHairColor());
