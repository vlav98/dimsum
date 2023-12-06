import { Sexuality } from '../../../../types/character/sexuality';
import { randomizeEnum } from '../../../../utils';

export function randomizeSexuality(): string {
  return randomizeEnum(Sexuality);
}

// console.log('What is their sexuality ?', randomizeSexuality());
