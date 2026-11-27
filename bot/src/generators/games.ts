import { EmbedBuilder } from "discord.js";
import { matchupChoices, tropes } from "../config/generatorOptions";
import {
  rouletteLocations,
  rouletteObjects,
  rouletteConstraints,
  situations,
} from "../data/generators/games";
import { personalities, roles } from "../data/generators/character";
import { generateNames } from "./names";
import { choose, pick } from "./random";

export function generateRoulette() {
  return new EmbedBuilder().setTitle("Writing roulette").addFields(
    { name: "Trope", value: pick(tropes) },
    {
      name: "Location",
      value: pick(rouletteLocations),
    },
    {
      name: "Object",
      value: pick(rouletteObjects),
    },
    {
      name: "Absurd constraint",
      value: pick(rouletteConstraints),
    },
  );
}

export function generateMatchup(
  first?: string | null,
  second?: string | null,
  situation?: string | null,
) {
  const names = generateNames("fantasy", 2);
  const scenario = choose(
    matchupChoices.map((choice) => choice.value),
    situation,
  );

  return new EmbedBuilder()
    .setTitle("OC matchup")
    .addFields(
      {
        name: "First OC",
        value: first || `${names[0]}: ${pick(personalities)}; ${pick(roles)}.`,
      },
      {
        name: "Second OC",
        value: second || `${names[1]}: ${pick(personalities)}; ${pick(roles)}.`,
      },
      { name: "Situation", value: situations[scenario] },
    )
    .setFooter({
      text: "No winner is chosen. Let the characters and community decide what happens.",
    });
}
