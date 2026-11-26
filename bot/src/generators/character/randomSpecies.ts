import { HalfSpecies, Species } from "../../types/character/species";
import { capitalizeFirstLetter, randomizeEnum } from "../../utils";

export function randomizeSpecies(): string {
  const species = randomizeEnum(Species);
  if (species === Species.HALF) {
    const firstHalf = randomizeEnum(HalfSpecies);
    let secondHalf = randomizeEnum(HalfSpecies);
    while (secondHalf === firstHalf) {
      secondHalf = randomizeEnum(HalfSpecies);
    }

    return [firstHalf, secondHalf]
      .map(capitalizeFirstLetter)
      .join(" & ");
  }

  return capitalizeFirstLetter(species);
}
