import { Species, HalfSpecies } from '../../../../types/character/species';
import { randomizeEnum, capitalizeFirstLetter } from '../../../../utils';

export function randomizeSpecies(): string {
  const species = randomizeEnum(Species);
  const isHalf = randomizeEnum(Species) === Species.HALF;
  console.log('isHalf', isHalf, 'species', species);

  if (isHalf) {
    const halfSpecies: string[] = [];
    halfSpecies.push(randomizeEnum(HalfSpecies));
    const secondHalfSpecies = randomizeEnum(HalfSpecies);
    halfSpecies.push(
      secondHalfSpecies === halfSpecies[1]
        ? randomizeEnum(HalfSpecies)
        : randomizeEnum(HalfSpecies),
    );
    console.log('halfSpecies', halfSpecies);
    console.log('secondHalfSpecies', secondHalfSpecies);

    return halfSpecies
      .map((half) => {
        return capitalizeFirstLetter(half);
      })
      .join(' & ');
  }
  // const species = randomizeEnum(Species).toString();

  return capitalizeFirstLetter(species);
}

// console.log(randomizeSpecies());
