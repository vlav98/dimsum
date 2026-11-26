import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";
import { generatedCommand } from "../../generatedCommand";
import { generateMatchup, generateRoulette } from "../../../generators/writing";
import { savePromptButton } from "../../../promptComponents";
import { getSavedPromptForUser, SavedPrompt } from "../../../storage";

const savedOCPrefix = "saved-oc:";

class SavedOCUnavailableError extends Error {}

function summarizeSavedOC(savedOC: SavedPrompt): string {
  const name = savedOC.content.match(/(?:^|\n)Name:\s*([^\n]+)/)?.[1]?.trim();
  const traits = savedOC.content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      /^(?:Personality|Flaw|Phobia|Aesthetic|Power \/ role|Secret|Gender|Species|Sexuality|Hair|Eyes|Life status):/.test(
        line,
      ),
    )
    .slice(0, 3);
  return [name || "Unnamed OC", ...traits].join(" — ").slice(0, 300);
}

async function resolveDuelCharacter(
  userId: string,
  value: string | null,
): Promise<string | null> {
  if (!value?.startsWith(savedOCPrefix)) return value;
  const savedOC = await getSavedPromptForUser(
    userId,
    value.slice(savedOCPrefix.length),
  );
  if (!savedOC || savedOC.kind !== "oc") {
    throw new SavedOCUnavailableError(
      "That saved OC could not be found in your library. Choose one from autocomplete or enter a description.",
    );
  }
  return summarizeSavedOC(savedOC);
}

function matchupCommand(commandName: string) {
  const data = new SlashCommandBuilder()
    .setName(commandName)
    .setDescription(
      "Put two OCs in a hypothetical situation; you decide the outcome",
    )
    .addStringOption((option) =>
      option
        .setName("first")
        .setDescription(
          "First OC's description or one of your saved OCs; leave blank to generate",
        )
        .setAutocomplete(true)
        .setMaxLength(300),
    )
    .addStringOption((option) =>
      option
        .setName("second")
        .setDescription(
          "Second OC's description or one of your saved OCs; leave blank to generate",
        )
        .setAutocomplete(true)
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
    );

  const command: Command = {
    data,
    run: async (interaction: ChatInputCommandInteraction) => {
      await interaction.deferReply();
      try {
        const [first, second] = await Promise.all([
          resolveDuelCharacter(
            interaction.user.id,
            interaction.options.getString("first"),
          ),
          resolveDuelCharacter(
            interaction.user.id,
            interaction.options.getString("second"),
          ),
        ]);
        await interaction.editReply({
          embeds: [
            generateMatchup(
              first,
              second,
              interaction.options.getString("situation"),
            ),
          ],
          components: [savePromptButton("matchup")],
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        if (error instanceof SavedOCUnavailableError) {
          await interaction.editReply(error.message);
          return;
        }
        console.error(`Could not run /${commandName}:`, error);
        await interaction.editReply("Generation failed. Please try again.");
      }
    },
  };
  return command;
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
