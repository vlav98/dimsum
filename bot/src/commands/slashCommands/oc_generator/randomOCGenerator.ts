import { EmbedBuilder } from '@discordjs/builders';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from 'src/interfaces/Command';
import {
  randomizeGender,
  randomizeHairColor,
  randomizeSexuality,
  randomizeSpecies,
} from './utils';

export const RandomOCGenerator: Command = {
  data: new SlashCommandBuilder()
    .setName('ocgen')
    .setDescription('Gives you a random OC.'),
  run: async (interaction: CommandInteraction) => {
    try {
      await interaction.deferReply();

      const randomOCEmbed = new EmbedBuilder();

      randomOCEmbed.setTitle('Random OC Generator');
      randomOCEmbed.setDescription('Here is your random OC!');

      const hairColor = randomizeHairColor();
      console.log(hairColor);
      randomOCEmbed.addFields(
        {
          name: 'Gender',
          value: randomizeGender(),
        },
        {
          name: 'Species',
          value: randomizeSpecies(),
        },
        {
          name: 'Sexuality',
          value: randomizeSexuality(),
        },
        // {
        //   name: "Hair Color",
        //   value: ,
        // }
      );
      randomOCEmbed.setFooter({
        text: "c'est un test les amis",
      });
      const text = interaction.options;
      console.log(text);

      await interaction.editReply({
        embeds: [randomOCEmbed],
        // components: [row],
      });
    } catch (error) {
      console.log(error);
    }
  },
};
