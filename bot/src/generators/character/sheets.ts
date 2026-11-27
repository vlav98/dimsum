import { EmbedBuilder } from "discord.js";
import { nameStyles, ocSections } from "../../config/generatorOptions";
import {
  personalities,
  flaws,
  phobias,
  aesthetics,
  roles,
  powers,
  secrets,
} from "../../data/generators/character";
import { choose, pick, sample } from "../random";
import { characterTraits } from "./traits";
import { parseOmittedProperties } from "./omissions";
import type { CharacterOptions } from "./types";

export function generateRandomOC(options: CharacterOptions = {}) {
  const omitted = parseOmittedProperties(options.omit, false);
  const traits = characterTraits(undefined, options);
  const fields = [
    {
      properties: ["name"],
      name: "Name",
      value: traits.name,
    },
    {
      properties: ["gender"],
      name: "Gender",
      value: traits.gender,
    },
    {
      properties: ["species"],
      name: "Species",
      value: traits.species,
    },
    {
      properties: ["sexuality"],
      name: "Sexuality",
      value: traits.sexuality,
    },
    {
      properties: ["hair_color", "hair_length"],
      name: "Hair",
      value: [
        !omitted.has("hair_color") ? `Color: ${traits.hairColor}` : null,
        !omitted.has("hair_length") ? `Length: ${traits.hairLength}` : null,
      ]
        .filter((value) => value !== null)
        .join("\n"),
    },
    {
      properties: ["eye_color", "heterochromia"],
      name: "Eyes",
      value: [
        !omitted.has("eye_color") ? `Color: ${traits.eyeColor}` : null,
        !omitted.has("heterochromia")
          ? `Heterochromia: ${traits.heterochromia}`
          : null,
      ]
        .filter((value) => value !== null)
        .join("\n"),
    },
    {
      properties: ["life_status"],
      name: "Life status",
      value: traits.lifeStatus,
    },
  ];
  return new EmbedBuilder()
    .setTitle("Random OC Generator")
    .setDescription("Here is your random OC!")
    .addFields(
      fields
        .filter(
          (field) =>
            field.value &&
            field.properties.some((property) => !omitted.has(property)),
        )
        .map(({ name, value }) => ({ name, value })),
    );
}

export function generateOC(
  styleValue?: string | null,
  sectionValue?: string | null,
  options: CharacterOptions = {},
) {
  const style = choose(nameStyles, styleValue);
  const section = sectionValue ? choose(ocSections, sectionValue) : "full";
  const omitted = parseOmittedProperties(options.omit, true);
  const traits = characterTraits(style, options);
  const fields = [
    {
      properties: ["name"],
      name: "Name",
      value: traits.name,
      section: "all",
    },
    {
      properties: ["personality"],
      name: "Personality",
      value: sample(personalities, 2).join(", "),
      section: "personality",
    },
    {
      properties: ["flaw"],
      name: "Flaw",
      value: pick(flaws),
      section: "personality",
    },
    {
      properties: ["phobia"],
      name: "Phobia",
      value: pick(phobias),
      section: "personality",
    },
    {
      properties: ["aesthetic"],
      name: "Aesthetic",
      value: pick(aesthetics),
      section: "appearance",
    },
    {
      properties: ["power_role"],
      name: "Power / role",
      value:
        style === "modern"
          ? pick(roles)
          : `${pick(roles)}. Gift: ${pick(powers)}.`,
      section: "background",
    },
    {
      properties: ["secret"],
      name: "Secret",
      value: pick(secrets),
      section: "background",
    },
    {
      properties: ["gender"],
      name: "Gender",
      value: traits.gender,
      section: "appearance",
    },
    {
      properties: ["species"],
      name: "Species",
      value: traits.species,
      section: "appearance",
    },
    {
      properties: ["sexuality"],
      name: "Sexuality",
      value: traits.sexuality,
      section: "background",
    },
    {
      properties: ["hair_color", "hair_length"],
      name: "Hair",
      value: [
        !omitted.has("hair_color") ? `Color: ${traits.hairColor}` : null,
        !omitted.has("hair_length") ? `Length: ${traits.hairLength}` : null,
      ]
        .filter((value) => value !== null)
        .join("\n"),
      section: "appearance",
    },
    {
      properties: ["eye_color", "heterochromia"],
      name: "Eyes",
      value: [
        !omitted.has("eye_color") ? `Color: ${traits.eyeColor}` : null,
        !omitted.has("heterochromia")
          ? `Heterochromia: ${traits.heterochromia}`
          : null,
      ]
        .filter((value) => value !== null)
        .join("\n"),
      section: "appearance",
    },
    {
      properties: ["life_status"],
      name: "Life status",
      value: traits.lifeStatus,
      section: "background",
    },
  ];
  const title = `${omitted.has("name") ? "" : `${traits.name} | `}${style} | ${
    section === "full" ? "Full sheet" : section
  }`;
  return new EmbedBuilder()
    .setTitle("Original character sheet")
    .setDescription(title)
    .addFields(
      fields
        .filter(
          (field) =>
            field.value &&
            field.properties.some((property) => !omitted.has(property)) &&
            (section === "full" ||
              field.section === "all" ||
              field.section === section),
        )
        .map(({ name, value }) => ({ name, value })),
    );
}
