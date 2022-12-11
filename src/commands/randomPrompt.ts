import { EmbedBuilder } from "@discordjs/builders";
import { SlashCommandBuilder } from "discord.js";
import { Command } from "src/interfaces/Command";

var phrases = new Array(
  "A stressful case/mission rattles the [characters] and/or clues them in.",

  "Absence makes the heart grow fonder",

  "Age regression/De-Aging",
  "Time Travel",

  "Amnesia",

  "Baths and water (tubs or jacuzzis; hot springs; bath houses or steam rooms; the ocean; swimming pools",

  "Body swap",

  "Body-painting or inkbrushing  on someone's skin",

  "Bonds (telepathic or empathic; psychic links; mating or soul bonds)",

  "Characters are single parents whose children are rivals in a talent show/ sports competition",
  "One character is a cuddle therapist",
  "Rebuilding/ building a home together, home improvements, nesting",
  "Greater Pacific Northwest Werewolf Symposium",
  "Grad student rivals competing for the same grant",
  "Single parents whose children are best friends",
  "Matchmaking child of one character",
  "Magical appearing baby",
  "Best friends who promised they would marry the other if still single by 30, hey guess what birthday it is",

  "Confessions (revelation of love/desire; of other secrets; truth or dare games, revealing truths when feverish)",

  "Courting and dating (courtship rituals; dating; blind dates; personal ads; traditional gestures such as flowers and chocolates; unusual gestures designed to win someone's attention; showing off or displaying prowess; rivals seeking a character's favor)",

  "Dancing",

  "Domesticity (moving in together; nesting; shopping; building a family or meeting the family; getting a cat or dog; kidfic)",

  "Enclosed spaces",

  "Enemies working together",

  "Fish out of water characters/scenarios",

  "Flirting (conscious or unconscious; with glances or touches; banter)",

  "Friction; accidental contact)",

  "Geek/jock pairings",

  "Gentleness (tenderness; kindness; concern; gentle natures; characters who display sensitivity, etc; gentle responses at unexpected moments)",
  "Getaways (romantic weekends; tropical vacations; ski chalets)",

  "Happiness (startled joy; passionate gratitude; ecstasy; comfort; happy endings)",

  "Heroic gestures (nobility; self-sacrifice; risking self to save someone's life",

  "Insomnia",

  "Intimacy",

  "Journeys (odysseys and quests; time-travel; being lost and trying to get home; road trips; pioneering and exploration, including space travel)",

  "Magical themes (love spells; magical characters or creatures; magical lands or settings; predictions; curses; possession; fairytales",

  "Established relationship when one person gets amnesia and forgets everything until just before they started dating",
  "Characters have amnesia and assume they are dating (they aren't yet)",

  "Masquerade (a character pretends to be someone else, or something they're not",
  "Massage",
  "Trapped in a time loop",

  "Music (singing; playing an instrument such as guitar or piano; composers; rock stars or bands; groupies; song lyrics)",
  "Names and address (endearments: sweetheart, honey, mine; nicknames",
  "Nautical themes: ships and the sea; desert islands and buried treasure)",

  "Orientation issues (confusion; discovery and/or coming out",
  "Our friends/coworkers are betting on us.",

  "Piercings or body jewelry",

  "Protectiveness (physically or verbally defending someone; caretaking in general; bodyguard scenarios",
  "Public displays of affection, PDAs",

  "Rescue (danger and rescue in general, e.g., abductions)",

  "Reversal of role or fortune (loss of love, power, rank, etc; hunter becomes prey etc",

  "Rogues (outlaws, highwaymen, mercenaries, pirates, gangsters, hitmen, etc; black sheep and royal bastards; Han Solo characters; tricksters",

  "Secret admirers",
  "Secret identity (superheroes, slayers, immortals, mutants, spies etc)",
  "Secrets, other (dark or criminal past; double lives; previous marriage and/or children; unspoken feelings)",

  "Independently showed up to the costume party in matching costumes",
  "On a roadtrip together",

  "Ghost investigators both looking in the same 'haunted' house, thinking the other is a ghost",

  "Shyness, embarrassment, blushing or stammering",
  "Spooning",
  "Sports rivalries",
  "Cooking for one another or cooking together",
  "Learning a hobby together",
  "One character's pet is lost and the other finds it",

  "Surprises",
  "Watching someone sleep",
  "Sharing a bed by necessity",
  "Falling asleep on the other",
  "Swords and sword-play",
  "Talking and communication issues",

  "Teasing or tickling",

  "Telepathy (also Bonds and mental abilities; Special powers and skills; sudden mutual telepathy)",
  "Temperamental personalities (driven or obsessed; hot-tempered or testy; moody; misanthropic or bitter; abrasive)",

  "Touching (stroking and caressing; cuddling or nuzzling",
  "Huddling for warmth",
  "PDA, hugging; holding hands in public; touching as UST",
  "Brief brushes of contact either deliberate or accidental; thighs brushing under a table; comic physical entanglements; someone gripping a wounded character's hand)",

  "Tragic flaws",
  "Trapped or stranded together (on another world; on a desert island; in a cave-in; in a cabin during a snowstorm; in an elevator)",

  "Trust and vows (promises are kept or broken; loyalty or betrayal",
  "Commitment or fear of commitment",
  "Truth or Dare",

  "Vulnerability",
  "Washing (washing one's partner, body or hair; bubble baths)",
  "Western scenarios (campfire and trail scenes; horses; gunslingers, lawmen, card sharps, etc; train robberies and bank hold-ups; posses; saloon brawls)",
  "Wings (wingfic)",
  "Wish-fulfillment",
  "Families, friends, or others think the characters are involved when they're really not",
  "One character worrying anxiously about another",
  "Fandom within a fandom; your characters are writers or artists and meet online",
  "Secret admirer, sending love letters or gifts anonymously",

  "Fuzzy morning after or 'do you remember what we did last night?'"
);

var setting = new Array(
  "Western AU",
  "Historical Royalty",
  "Modern Royalty",
  "Pacific Rim AU",
  "Harry Potter AU",
  "Modern AU",
  "Dystopia",
  "Post-apocalyptic",
  "Coffeeshop or cafe",
  "Restaurant",
  "College/University",
  "High School",
  "Beach",
  "Space and/or Spaceships",
  "Fairy tale",
  "Tattoo Shop and Flower Shop",
  "Club/ Bar",
  "Office",
  "Bakery",
  "Strip Club",
  "Art Gallery/Studio",
  "Animal Sanctuary",
  "Library",
  "Locker Room",
  "Aquarium",
  "Bookstore",
  "Botanical Garden",
  "Hospital",
  "Blood Bank",
  "Baseball Stadium",
  "Cabin",
  "Castle",
  "Concert Hall",
  "Cemetery",
  "Laboratory",
  "Hotel",
  "Fairground",
  "Garden",
  "Highway rest stop",
  "Lighthouse",
  "Roadside Motel",
  "Racetrack",
  "Hockey Rink",
  "Soccer Field",
  "Lacrosse Field",
  "Treehouse",
  "Zoo",
  "Museum"
);

var genre = new Array(
  "Hurt/Comfort",
  "Angst",
  "Fluff",
  "Fluff",
  "Fluff",
  "Fluff",
  "Domestic",
  "Action/Adventure",
  "Pining",
  "Slow Burn",
  "Fix-It",
  "Humor",
  "Mystery",
  "Character Study",
  "Relationship Development",
  "Angst",
  "Plot What Plot",
  "Romantic Comedy",
  "Hurt/Comfort",
  "Angst",
  "Fluff",
  "Fluff",
  "Fluff",
  "Fluff",
  "Domestic",
  "Action/Adventure",
  "Pining",
  "Slow Burn",
  "Fix-It",
  "Humor",
  "Mystery",
  "Character Study",
  "Relationship Development",
  "Angst",
  "Romantic Comedy"
);

var trope = new Array(
  "Alpha/Beta/Omega dynamics",
  "Soulmates (Names, Timers, Idenfitying Marks, etc",
  "Androids and Robots",
  "Spies and Secret Agents",
  "Sentinels and Guides",
  "Daemons or physical soul representations in forms of animals",
  "Angels and Demons",
  "Alpha/Beta/Omega dynamics",
  "Werewolves",
  "Vampires",
  "Superheroes/Superpowers",
  "Doppelgangers",
  "Parallel Universes Switching/Colliding",
  "Friends to Lovers",
  "Friends With Benefits",
  "Enemies to Friends to Lovers",
  "Geek/Jock Pairings",
  "Rivalmance",
  "Fake/Pretend Relationship",
  "Undercover Married",
  "Marriage (of arrangement, convenience, or necessity; accidental marriage; traditional marriage or partnership ceremony)",
  "Secret Identity"
);

function generatePairing() {
  var pairingPhrase = "";

  // First person
  var index2 = Math.floor(Math.random() * setting.length);
  pairingPhrase +=
    "<strong>Setting:</strong> <br/>" + setting[index2] + "<br /><br />";

  // Second person
  var index3 = Math.floor(Math.random() * genre.length);
  pairingPhrase +=
    "<strong>Genre:<br/></strong>" + genre[index2] + " <br> <br>";

  // Now the phrase
  var index4 = Math.floor(Math.random() * trope.length);
  pairingPhrase +=
    "<strong>Trope:</strong> <br>" + trope[index4] + " <br><br> ";

  // Now the phrase
  var index1 = Math.floor(Math.random() * phrases.length);
  pairingPhrase +=
    "<strong>Prompt:</strong> <br>" + phrases[index1] + " <br><br> ";

  // document.getElementById("pairingText").innerHTML = pairingPhrase;
}

function getSetting() {
  var settingIndex = Math.floor(Math.random() * setting.length);
  return setting[settingIndex];
}

function getGenre() {
  var genreIndex = Math.floor(Math.random() * genre.length);
  return genre[genreIndex];
}

function getTrope() {
  var tropeIndex = Math.floor(Math.random() * genre.length);
  return genre[tropeIndex];
}

function getPrompt() {
  var promptIndex = Math.floor(Math.random() * phrases.length);
  return phrases[promptIndex];
}

export const randomPrompt: Command = {
  data: new SlashCommandBuilder()
    .setName("randomprompt")
    .setDescription("Generates a random prompt")
    .addStringOption((option) =>
      option
        .setName("shipname")
        .setDescription("Ship name to generate a prompt for")
        .setRequired(false)
    ),
  run: async (interaction) => {
    try {
      await interaction.deferReply();

      const shipName = interaction.options.get("shipname")?.value;

      const randomPromptEmbed = new EmbedBuilder();

      const title = shipName
        ? shipName + " generated prompt"
        : "Random Prompt Generator";
      randomPromptEmbed.setTitle(title);
      randomPromptEmbed.setDescription("Generating random prompt...");

      randomPromptEmbed.addFields(
        {
          name: "Setting",
          value: getSetting(),
        },
        {
          name: "Genre",
          value: getGenre(),
        },
        {
          name: "Trope",
          value: getTrope(),
        },
        {
          name: "Prompt",
          value: getPrompt(),
        }
      );

      randomPromptEmbed.setFooter({
        text: `Version ${process.env.npm_package_version}`,
      });
      await interaction.editReply({ embeds: [randomPromptEmbed] });
      return;
    } catch (err) {
      console.log(err);
    }
  },
};
