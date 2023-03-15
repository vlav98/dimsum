import { Colours } from "../colours";

export enum HairLength {
  SHORT = "SHORT",
  MEDIUM = "MEDIUM",
  LONG = "LONG",
  MIXED = "MIXED",
  ANY = "ANY",
}

export enum BasicHairColours {
  BLACK = "BLACK",
  WHITE = "WHITE",
  ANY = "ANY",
}

export const HairColours = {
  ...Colours,
  ...BasicHairColours,
};

export type HairColours = typeof HairColours;
