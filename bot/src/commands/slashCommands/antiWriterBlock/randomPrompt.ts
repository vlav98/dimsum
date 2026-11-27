import {
  phrases,
  setting,
  genre,
  trope,
} from "../../../data/generators/fanfic";
import { EmbedBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../../../interfaces/Command";
import { getRandomAdditionalTags } from "../../../generators/fanfic/tags";
import { savePromptButton } from "../../../components/common/promptButtons/promptButtons";

function getSetting() {
  var settingIndex = Math.floor(Math.random() * setting.length);
  return setting[settingIndex];
}

function getGenre() {
  var genreIndex = Math.floor(Math.random() * genre.length);
  return genre[genreIndex];
}

function getTrope() {
  var tropeIndex = Math.floor(Math.random() * trope.length);
  return trope[tropeIndex];
}

function getPrompt() {
  var promptIndex = Math.floor(Math.random() * phrases.length);
  return phrases[promptIndex];
}

async function runPromptGenerator(
  interaction: ChatInputCommandInteraction,
  defaultTitle: string,
  kind: "random" | "fanfic",
): Promise<void> {
  try {
    await interaction.deferReply();

    const shipName = interaction.options.getString("shipname");
    const genre = getGenre();
    const trope = getTrope();
    const additionalTags = getRandomAdditionalTags([genre, trope]);
    const promptEmbed = new EmbedBuilder();

    promptEmbed.setTitle(
      shipName ? `${shipName} generated prompt` : defaultTitle,
    );
    promptEmbed.setDescription("Generating random prompt...");
    promptEmbed.addFields(
      {
        name: "Setting",
        value: getSetting(),
      },
      {
        name: "Genre",
        value: genre,
      },
      {
        name: "Trope",
        value: trope,
      },
      {
        name: "Additional tags (AO3-style)",
        value: additionalTags.join(", "),
      },
      {
        name: "Prompt",
        value: getPrompt(),
      },
    );
    promptEmbed.setFooter({
      text: `Version ${process.env.npm_package_version}`,
    });

    await interaction.editReply({
      embeds: [promptEmbed],
      components: [savePromptButton(kind)],
    });
  } catch (error) {
    console.error(error);
  }
}

function createPromptCommand(
  name: string,
  description: string,
  defaultTitle: string,
  kind: "random" | "fanfic",
): Command {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .addStringOption((option) =>
        option
          .setName("shipname")
          .setDescription("Ship name to generate a prompt for")
          .setRequired(false),
      ),
    run: (interaction) => runPromptGenerator(interaction, defaultTitle, kind),
  };
}

export const randomPrompt = createPromptCommand(
  "randomprompt",
  "Generates a random prompt",
  "Random Prompt Generator",
  "random",
);

export const fanficPrompt = createPromptCommand(
  "fanficprompt",
  "Generates a fanfic prompt with AO3-style tags",
  "Random Fanfic Prompt Generator",
  "fanfic",
);
