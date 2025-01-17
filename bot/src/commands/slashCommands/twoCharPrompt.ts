import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces/Command";

const prompts = [
  "Them resting together and talking to each other before falling asleep.",
  "Forehead touching. Forehead kisses.",
  "Them exploring each others' bodies, but not in a sexual way. Finding their different birthmarks, looking over each others' scars and sharing the stories behind them, running their hands over one another and just appreciating the feeling of the other person next to them.",
  "{A} and {B} go to a fair/amusement park and {A} wants to go on the roller coaster and {B} agrees. Later, {B} regrets their decision and ends up clinging onto {A} for dear life.",
  "They are on a ferris wheel, and everything is going great - until it gets stuck at the very top. For thirty whole minutes.",
  "{B} won't let {A} get out of bed by cuddling them. ",
  "{A} is about to leave for work. {B} asks them if they've forgotten anything, and {A} gives them a kiss. {B} turns red and opens their hand to reveal {A}'s keys/wallet/etc., saying 'I meant this, but thanks.'",
  "{A} buys a box of sweets and puts them in the cupboard. {B} spontaneously eats them all in the middle of the night and tries to keep it a secret.",
  "{A}: Is it hot in here or is it just me? <br> {B}: It's you. <br> {A}: What? <br> {B}: What?",
  "Them playing with sidewalk chalk like they're kids again.",
  "Them accidentally (or purposefully) dozing off in a hammock together as the sun sets and the air cools down.",
  "Them huddled by the fireplace at night after making snow angels in the fresh snow.",
  "Their first holiday season together.",
  "{B} wants to use their laptop on the couch, but {A} always occupies the space in their lap.",
  "{A} doesn't like talking on the phone, but {B} always calls them instead of texting. {B} admits that it's because they want to hear {A}'s voice.",
  "{A} wakes to find that it had snowed overnight and gets excited about playing in it. {B} gets excited because this means that when {B} comes inside, it will be time for cuddling by the fire.",
  "{A} and {B} reveal their tumblr blogs to each other. {B} turns out to be {A}'s #1 tumblr crush.",
  "{B} drags {A} into the freezing cold to make a snowman.",
  "{A} and {B} sending each other sexy and silly selfies.",
  "Them meeting at the age of five years old on the first day of kindergarten.",
  "Them getting a puppy/kitty, and arguing over names.",
  "{A} being careful (or not at all careful) taking off {B}'s shirt because {B} is extremely ticklish.",
  "{A} taking {B} out for Valentine's Day to cheer them up after their original plans with someone else fell through. As {A} tries their best to make {B} happy and succeeds after only a few attempts, {B} realizes they would have rather been with {A} anyways.",
  "{B} hurt their ankle and is laid up with a cast and crutches. {A} is sitting next to them, doodling little hearts on their cast to cheer them up.",
  "{B} lends their sweater to {A}. When {A} is home, they realize they still have {B}'s sweater and find {B}'s iPod. Out of curiosity, {A} looks through {B}'s music and finds a playlist titled with {A}'s name.",
  "{A} is alone in the rain because they forgot to bring an umbrella, {B} offers to share theirs.",
  "{B} telling really dumb or corny jokes to {A}, thinking they are so clever and funny. {A} just thinks {B} is adorable for thinking the jokes are funny.",
  "{A} teaching {B} how to kiss, and {B} ends up kissing {A} really quick, nervously asks 'Like that?' and leaves {A} silent and flustered for a moment.",
  "{B} absolutely loves the taste of the chap stick/lip balm {A} uses, so they keep stealing kisses from {A}.",
  "{A} and {B} falling asleep together with their heads on the other's shoulder/head in the backseat of the car while their friend is driving.",
  "{B} holding a sobbing {A}. {A} cries themselves to sleep with their face buried into {B}.",
  "{A} and {B} sleeping on top of each other (in the bed, couch, where ever you prefer) when {B} flops down on the floor.",
  "{A} seeing some of {B}'s night blogging.",
  "{B} burns their tongue on something hot, {A} kisses it better.",
  "{B} is a prince or princess, falling for {A}, the castle gardener who tends to the foliage surrounding {B}'s balcony.",
  "{A} and {B} watching a horror movie. {A} can't sleep that night and {B} comforts them in a cuddle.",
  "{B} tossing snowballs at {A}'s window, not knowing the window is open and has no screen.",
  "{A} and {B} sleeping together. {A} wakes up first and contemplates waking {B} with a kiss.{A} leans in only to hesitate centimeters away out of embarrassment. {B} opens their eyes and says, 'Well if you won't do it, I will.'",
  "{B} gets the hiccups, causing {A} to laugh every time they try to talk until {A} gets the hiccups too.",
  "{A} and {B} not speaking each other languages, falling in love and learning together.",
  "{B} and {A} break up, but they have a pet and neither of them want to give it up. Then they spend a few days each with the pet separately. But it kinda helps them get together again.",
  "{A} and {B} dancing in the moonlight.",
  "{A} and {B} at a theme park or carnival, and walking towards one of the many games to win a large stuffed animal. {A} is sure that they can win the game, but after many attempts (and a lot of cash down the drain) {A} gives up. {B}, however, tries and succeeds on their first go.",
  "{B} and {A} eating spaghetti like the lady and the tramp did in that animated film.",
  "{B} is a ghost who falls in love with {A}, but {A} can't see them. Does {B} do anything to make {A} notice them?",
  "{A} and {B} unable to sleep after watching a horror movie, but neither will admit that the movie scared them.",
  "{B} and {A} play Twister. Things get embarrassing and awkward fast.",
  "{A} trying to get something on their computer to work. While they’re getting frustrated and flipping out, {B} is sitting nearby cracking up.",
  "{B} likes stealing {A}'s phone to change {A}'s phone wallpaper into something stupid (like unattractive pictures of {A}'s face or doing something like picking their nose). {B} is doing another routine swipe of {A}'s phone, but doesn't have the heart to change it because this time because {A}'s phone wallpaper is a cute picture of the two of them (like their first date together, or the only picture they have together).",
  "{A} cuddling with a body pillow, pretending that it's {B}...",
  "{B} getting shy about being naked in front of {A} for the first time.",
  "{A} getting to go back in time and change something bad that happened in their past with {B}.",
  "{A} has amnesia and {B} is taking care of them. {B} tries their best to help {A} remember them.",
  "{B} and {A} were separated for several years for reasons they couldn't help. They finally find each other and have a heartfelt reunion.",
  "{B} and {A} stranded on a raft in the middle of a lake.",
  "{A}'s mom gives {A} and {B} very cheesy, matching shirts/sweaters/scarfs. {B} does their very best to pretend that they love it.",
  "{B} having to help {A} undress after an injury.",
  "{A} and {B} adopting an orphan.",
  "{B} snuggling up to {A} because i's cold.",
  "{A} using {B}'s lap as a pillow.",
  "{B} buying {A} a special treat when they go out shopping.",
  "{A} giving {B} a tight hug that makes them lose their breath.",
  "{A} staying up half the night to finish a game with {B}.",
  "{B} giving {A} a back massage when they flop on the couch or bed.",
  "{B} making a goofy face until {A} notices and laughs.",
  "{A} letting {B} warm their cold hands under their shirt.",
  "{B} trying their best to be quiet while {A} is taking a nap.",
  "{A} helping {B} dry and brush their hair after a shower.",
  "{B} running out in the middle of the night to get a food item that {A} is craving.",
  "{A} wrapping a blanket around {B} when they are sitting on the couch and watching a show.",
  "{B} tucking {A}'s hair behind their ear to help them get it out of their face.",
  "{A} sharing a drink with {B} from the same straw.",
  "{A} doing a chore they know {B} isn't fond of.",
  "{B} wearing clothes in {A}'s favorite color.",
  "{B} tracing their names together in the sand.",
  "{A} writing {B} name in a heart/under the love umbrella/etc. in their notebook together with their own name.",
  "{B} and {A} sharing a soft smile across a crowded room.",
  "{A} and {B} having a tickle fight until they're breathless.",
  "{B} calming {A} down when they have a bad dream.",
  "{A} playing their fingers through {B}'s hair while sitting next to them on the couch.",
  "{B} following {A}'s family traditions that they enjoy.",
  "{A} telling {B} a dumb joke just to see their smile.",
  "{A} participating in {B}'s hobby even if it doesn't personally interest them.",
  "{B} buying {A} something unrequested because it made {B} think of them.",
  "{B} lightly kissing {A} on top of a freshly formed bruise.",
  "{A} giving {B} a kiss before going to work and they are still in bed.",
  "{B} making {A} their favorite meal when they are having a hard day.",
  "{A} helping {B} dry and brush their hair after a shower.",
  "{B} traveling long distances just to see {A}.",
  "{B} tucking the sheets around {A} when they stir during the night.",
  "{B} holding {A}'s hands when they are shaking.",
  "{A} and {B} spending the night on the perfect hill for stargazing.",
  "{A} and {B} on a large field with a fresh foot of snow.",
  "{B} and {A} throwing food for the ducks at the duck pond.",
  "{B} and {A} sitting on the couch that is really soft and sinking into the cushions..",
  "{A} and {B} under a large fruit tree in the middle of summer.",
  "{B} and {A} playing games in the small arcade.",
  "{A} and {B} going to explore an abandoned house on the edge of town.",
  "{B} and {A} chilling out on beds and couches at a furniture store.",
  "{A} and {B} playing on the swings at a small playground that nobody goes to anymore.",
  "{A} and {B} lighting fall-scented candles.",
  "{B} and {A} carving faces in pumpkins.",
  "{A} and {B} making crafts.",
  "{A} and {B} decorating their house with seasonal decorations.",
  "{B} and {A} raking up leaves and jumping into them.",
  "{A} and {B} drowning in oversized sweaters during chilly days.",
  "{A} and {B} finger painting with their child.",
  "{A} and {B}'s child coming to sleep with them after having a bad dream.",
  "{A} and {B} remembering their first kiss… and they have very different takes on it.",
  "{B} hiding in a closet to jump out and surprise {A}, but {A} just keeps not going near the closet by chance.",
  "{B} and {A} making wishes.",
  "{A} and {B}  living together for the first time.",
  "{B} and {A} backpacking across the world.",
  "{B} and {A} texting. Or better yet, writing letters to each other.",
  "{A} and {B} holding hands because there's a crowd but not letting go when they get out of it.",
  "{A} having to rescue {B} from a pack of kittens/puppies.",
  "{A} and {B} meeting on a train when {B} falls asleep on {A}'s shoulder.",
  "{B} and {A} playing in water and splashing each other.",
  "{A} and {B} shopping, with one of them being way more excited about it than the other who just kinda drags around and carries their bags.",
  "They meet when {A} sees {B} walk into a street sign.",
  "{B} breaking into {A}'s room through their window.",
  "{A} and {B} cooking something without the recipe, because {B} is confident they know how to cook it from memory.",
  "{B} and {A} taking couple quizzes on the Internet.",
  "{A} is scared of the thunder and {B} tries to calm them down during an particulary heavy strom.",
  "{B} kissing away {A}'s tears.",
  "{A} and {B} sharing ice cream/cake/a dessert.",
  "{A}: guess what <br> {B}: what <br> {A}: i love you <br> {B}:  O:",
  "{A} and {B} are a pair of ghosts haunting a house, and every day they try to outcompete each other in scaring whoever comes in.",
  "{B} gets into a heated argument with someone. {B} begins threatening them, so {A}, picks up {B} and carries/drags them out of the room before anyone gets hurt.",
  "{A} and {B} becoming YouTubers/vloggers.",
  "{B} and {A} aren't together yet, but they like each other and they are mutuals on twitter/tumblr. {A} accidentally publishes a tweet/post about their crush on {B} on their main account, when they meant to put it on a private side account. {B} is too dense to realize it's obviously about them, but it still worries them enough to ask a rather mortified {A} about it.",
  "{A} is a special effects make-up artist and {B} always volunteers as their model when they want to try something new.",
  "{B} showing {A} some of their favorite viral videos/memes.",
  "{B} and {A} getting locked in a store.",
  "{B} getting up in the middle of the night to make a snack and accidentally waking up {A} because they didn't stop the microwaves obnoxious beeping in time.",
  "{A} and {B} burning something together.",
  "{B} and {A} sharing a really long scarf.",
  "{A} and {B} just booping noses.",
  "{B} and {A} each other. {A} makes a spectacular drawing and {B}'s drawing does turn out to be that good. However, {A} keeps {B}'s drawing and treasures it.",
  "{A} and {B}  reading mean tweets/comments about themselves and laughing it off.",
  "{B} and {A} getting lost in IKEA.",
  "{B} trying to mooch off of {A}'s wifi and jokingly putting their own name in as the password, then being shocked that it actually works and they're now connected to {A}'s wifi...",
  "{A} having to comfort {B} because {B} just encountered a very large, unpleasant bug outside that scared them.",
  "{B} and {A} go on a camping trip. {B} forgets to bring a sleeping bag, so they have to squeeze into {A}'s sleeping bag with them.",
  "{B} catches a cold so {A} makes them breakfast in bed.",
  "{A} falling asleep in {B}'s lap. {B} holds {A} close and doesn't move from their spot for hours.",
  "{B} making a video 'proving' that {A} is the Illuminati, complete with The X-Files theme.",
  "{A} and {B} as characters in a really crappy free-to-play MMORPG with super skimpy armor.",
  "{B} giving {A} a piggyback ride.",
  "{A} princess carrying {B}.",
  "{B} and {A} as a superhero/sidekick duo, but {B} is constantly messing up and getting in {A}'s way during their crime-fighting missions.",
  "{A} and {B} going to a drive-thru fast food place. When they get home, it is discovered that the staff did not prepare {A}'s order properly. Despite {A} insisting they don't mind, {B} drives back to the fast food place to demand a new meal be made for {A}.",
  "{B}  trying to set up their character with {B}'s character in a life simulation game. After months of trying to get the two together, they scream in triumph when it finally works.",
  "{B} screaming over a picture of {A} from long before they met. {B} describes the younger {A} as a tiny precious child, then looks at {A}, and says 'Well, you're still a tiny precious child'.",
  "{B} and {A} attending a school for kids with disabilities.",
  "{A} and {B} trying to do a three legged race.",
  "{B} holding {A} very close, close enough to smell their hair. They whisper into {A}'s ear: 'I don't like your new shampoo'",
  "A friend drawing on {A} and {B}'s faces when they sleep. They wake up to see each other faces covered in silly doodles.",
  "{B} is playing a video game/reading a book/watching a show and is talking about how they ship two of the characters together because of [insert cute reason here], and then {A} says 'that sounds like you and me right there'.",
  "{A} hogs all the blankets and {B} gets cold so they cling tightly to {A} for warmth.",
  "{B}:I'm gonna do the thing <br>{A}:That's probably a bad idea <br>{B}:*does the thing* <br>{A}:holyshit.",
  "{A} and {B} discovering a hidden treasure.",
  "{A} coming home from a cuddly date with {B} and realizing that their shirt smells like {B}. {A} pulls their shirt up to their face to smell it before it fades away.",
  "{B} giving {A} a back massage when they flop on the couch or bed.",
  "{B} falls asleep in {A}'s lap and {A} has a conversation with someone else while stroking {B}'s hair as if they were a sleeping cat.",
  "{A} and {B} and their friends end up having to all sleep in the same room.  Nobody can get any sleep because {B} is snoring incredibly loud... Except for {A}, who's completely used to it.",
  "{B} and {A} wearing matching Halloween costumes or ugly Christmas sweaters. Or any matching outfits.",
  "{A} knitting something for {B}.",
  "{B} captioning everything {A} does with 'That's hot/cute'.",
  "{A} and {B} sucking helium and talking in very high-pitched voices.",
  "{B} reading in bed while {A} rests their head on {B}'s shoulder, sleeping.",
  "{A} goes over to {B}'s home after staying up all night. Even though they do their best to stay awake, they end up falling asleep while cuddling {B}. {A} is quite embarrassed (and half-asleep) when they wake up, but {B} doesn't mind.",
  "{A}:Ah shit <br>{B}Watch your fucking language",
  "{B} and {A} struggling to find each other in a crowded place. Fortunately, {B} knows just the thing.",
  "{B} and {A} carrying around balloons so they don't get lost in the crowd.",
  "{A} posts a picture of {B} somewhere and it becomes a meme.",
  "{B}: What am I supposed to do while you're gone <br>{A}: ... What do you usually do when I'm gone <br>{B}: Wait for you to come back",
  "{A} and {B} as the main characters in the last show you watched/book you read/game you played.",
  "{B} spending all their money on {A}, who scolds them for it.",
  "{A} and {B} playing a co-op video game and {A} keeps dicking around and {B} just wants to get past the first level god dammit.",
  "{B} staring admiringly at {A} from across the room. A friend whispers into {B}'s ear: 'Why are you so thirsty?'",
  "{A} booping {B}'s nose with their finger.",
  "{A} is a genie. {B} stumbles upon {A}, and they wish for {A} to be free so they can be {B}'s new friend. This seems awkward to {A} at first, but they warm up to {B} and end up crushing on them.",
  "{A} touching {B}'s face and telling them that their face is really soft.",
  "{B} and {A} are about to kiss when instead they accidentally hit foreheads really hard and have matching bruises.",
  "{A} giving {B} a kiss before going to work and they are still in bed.",
  "{B} telling {A} a story but {A} isn't paying attention at all because they;re too busy thinking about what a cutie {B} is.",
  "{A} is the barista at a coffee shop and always screws up {B}'s name on purpose.",
  "{B} and {A} getting sick at the same time.",
  "{B} sings extremely well but has a lot of difficulty playing musical instruments and {A} can play their musical instrument very well but their singing voice is terrible.",
  "{B} and {A} haven't kissed yet. Each time {B} sees {A} they think to themselves 'I've gotta do it this time' but they keep being too shy to do anything. One day a friend asks {B} if {A} has ever tried to kiss them and {B} just screams.",
  "{A} and {B} literally sitting in a tree, kissing..",
  "Imagine {A} and {B}.",
  "{B} pressing their forehead against {A}'s forehead to check if they have a fever.",
  "{B} reminiscing about the time they first met {A}. They're still in awe of how far they've come.",
  "{A} making {B} some hot chocolate.",
  "{B} and {A} having a snowball fight.",
  "{A} and {B} spending their New Year's Eve on a party with their friends and sharing their New Year's kiss in front of everyone.",
  "{B} and {A} walking through town, holding hands while it snows.",
  "{A} and {B} trying to hide their relationship. However, it turns out everyone knows they're dating.",
];
let person1,
  person2 = "";

function fluff(character1: string, character2: string): string {
  // Get random prompt
  const R1 = Math.floor(Math.random() * prompts.length);
  const str = prompts[R1];

  // Replace {A} & {B} in prompt with OTP names
  return str.replace(/{A}/g, character1).replace(/{B}/g, character2);
}

export const twoCharPrompt: Command = {
  data: new SlashCommandBuilder()
    .setName("otpprompt")
    .setDescription("Generate a prompt between two characters")
    .addStringOption((option) =>
      option
        .setName("character1")
        .setDescription("first character name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("character2")
        .setDescription("second character name")
        .setRequired(true)
    ),
  run: async (interaction: CommandInteraction) => {
    await interaction.deferReply();

    let content = "";

    const character1 = interaction.options.get("character1")?.value as string;
    const character2 = interaction.options.get("character2")?.value as string;

    content = fluff(character1, character2);

    const randomPromptEmbed = new EmbedBuilder();
    randomPromptEmbed.setTitle("OTP Sentence Prompt");
    randomPromptEmbed.setDescription(
      "Generating your random sentence prompt..."
    );

    randomPromptEmbed.addFields({
      name: "Sentence",
      value: content,
    });

    await interaction.editReply({
      embeds: [randomPromptEmbed],
    });
  },
};
