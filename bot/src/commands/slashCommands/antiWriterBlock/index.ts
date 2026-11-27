import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { generatedCommand } from "../../generatedCommand";
import { RandomOCGenerator } from "./ocGenerator/randomOCGenerator";
import { fanficPrompt, randomPrompt } from "./randomPrompt";
import { twoCharPrompt } from "./twoCharPrompt";
import {
  moods,
  nameStyles,
  tropes,
  universes,
} from "../../../config/generatorOptions";
import { keywords, twists } from "../../../data/generators/writing";
import {
  generateNames,
  generatePrompt,
  pick,
  sample,
} from "../../../generators/writing";

export const prompt = generatedCommand(
  new SlashCommandBuilder()
    .setName("prompt")
    .setDescription("Find a starting scenario with optional writing filters")
    .addStringOption((option) =>
      option
        .setName("universe")
        .setDescription("Story universe")
        .addChoices(...universes.map((value) => ({ name: value, value }))),
    )
    .addStringOption((option) =>
      option
        .setName("mood")
        .setDescription("Emotional direction")
        .addChoices(...moods.map((value) => ({ name: value, value }))),
    )
    .addStringOption((option) =>
      option
        .setName("trope")
        .setDescription("Story trope")
        .addChoices(...tropes.map((value) => ({ name: value, value }))),
    ),
  "prompt",
  (interaction) =>
    generatePrompt({
      universe: interaction.options.getString("universe"),
      mood: interaction.options.getString("mood"),
      trope: interaction.options.getString("trope"),
    }),
);

export const tag = generatedCommand(
  new SlashCommandBuilder()
    .setName("tag")
    .setDescription("Draw evocative keywords as writing constraints")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("How many distinct tags (1–5)")
        .setMinValue(1)
        .setMaxValue(5),
    ),
  "tag",
  (interaction) =>
    new EmbedBuilder().setTitle("Your writing constraints").setDescription(
      sample(keywords, interaction.options.getInteger("count") ?? 3)
        .map((value) => `• ${value}`)
        .join("\n"),
    ),
);

export const twist = generatedCommand(
  new SlashCommandBuilder()
    .setName("twist")
    .setDescription("Inject an unexpected twist into a work in progress"),
  "twist",
  () =>
    new EmbedBuilder()
      .setTitle("A change of direction")
      .setDescription(pick(twists)),
);

export const name = generatedCommand(
  new SlashCommandBuilder()
    .setName("name")
    .setDescription("Generate names or nicknames for a style")
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("Name style or vibe")
        .addChoices(...nameStyles.map((value) => ({ name: value, value }))),
    )
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("Number of distinct names (1–5)")
        .setMinValue(1)
        .setMaxValue(5),
    )
    .addBooleanOption((option) =>
      option
        .setName("nickname")
        .setDescription("Generate nicknames instead of full names"),
    ),
  "name",
  (interaction) =>
    new EmbedBuilder()
      .setTitle("Names for your next character")
      .setDescription(
        generateNames(
          interaction.options.getString("style"),
          interaction.options.getInteger("count") ?? 3,
          interaction.options.getBoolean("nickname") ?? false,
        ).join("\n"),
      ),
);

export const antiWriterBlockCommands = [
  prompt,
  tag,
  twist,
  name,
  randomPrompt,
  fanficPrompt,
  twoCharPrompt,
  RandomOCGenerator,
];
