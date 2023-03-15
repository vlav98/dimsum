import { HairLength } from "../../../../types/character/hair";

export function randomizeHairLength(): HairLength {
  const hairLength = Object.values(HairLength);
  const randomHairLength =
    hairLength[Math.floor(Math.random() * hairLength.length)];

  return randomHairLength;
}

console.log("What is their hair length ?", randomizeHairLength());
