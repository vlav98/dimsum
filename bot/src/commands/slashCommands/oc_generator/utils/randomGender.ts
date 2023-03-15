import { Gender } from "../../../../types/character/gender";
import { randomizeEnum } from "../../../../utils";

const gender = [
  "other",
  "gendeless",
  "intersex",
  "trans (mtf)",
  "trans (ftm)",
  "trans (any)",
  "non-binary",
  "male",
  "female",
];

export function randomizeGender(): Gender {
  return randomizeEnum(Gender);
}

console.log("What are their gender ?", randomizeGender());
