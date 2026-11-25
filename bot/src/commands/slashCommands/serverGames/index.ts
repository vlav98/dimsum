import { SlashCommandBuilder } from "discord.js";
import { generatedCommand } from "../../generatedCommand";
import { generateMatchup, generateRoulette } from "../../../generators/writing";

function matchupCommand(commandName: string) {
  return generatedCommand(
    new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(
        "Put two OCs in a hypothetical situation; you decide the outcome",
      )
      .addStringOption((option) =>
        option
          .setName("first")
          .setDescription(
            "First OC's name and brief description; leave blank to generate",
          )
          .setMaxLength(300),
      )
      .addStringOption((option) =>
        option
          .setName("second")
          .setDescription(
            "Second OC's name and brief description; leave blank to generate",
          )
          .setMaxLength(300),
      )
      .addStringOption((option) =>
        option
          .setName("situation")
          .setDescription("Type of encounter")
          .addChoices(
            { name: "Absurd debate", value: "debate" },
            { name: "Forest survival", value: "survival" },
            { name: "Festival contest", value: "contest" },
          ),
      ),
    "matchup",
    (interaction) =>
      generateMatchup(
        interaction.options.getString("first"),
        interaction.options.getString("second"),
        interaction.options.getString("situation"),
      ),
  );
}

export const ocDuel = matchupCommand("oc-duel");
export const matchup = matchupCommand("matchup");
export const roulette = generatedCommand(
  new SlashCommandBuilder()
    .setName("roulette")
    .setDescription(
      "Mix a trope, location, object, and absurd writing constraint",
    ),
  "roulette",
  generateRoulette,
);
export const serverGamesCommands = [ocDuel, matchup, roulette];
