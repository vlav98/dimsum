export const emojiGenres = ["fantasy", "modern", "sci-fi", "gothic"] as const;
export type EmojiGenre = (typeof emojiGenres)[number];

type CharacterPools = {
  vibe: readonly string[];
  object: readonly string[];
  motif: readonly string[];
  mood: readonly string[];
};

export const characterEmojiPools: Record<EmojiGenre, CharacterPools> = {
  fantasy: {
    vibe: ["✨", "🌿", "🌙", "🌸", "🌈", "🌞", "🍄", "❄️", "🌊", "🔥"],
    object: ["🗡️", "🏹", "🛡️", "🪄", "📜", "🧪", "🗝️", "🔮", "👑", "⚔️"],
    motif: ["🐉", "🦄", "🦊", "🦋", "🐺", "🦌", "🦅", "🐍", "🐝", "🦉"],
    mood: ["💫", "🌟", "💚", "🌻", "🍀", "🫧", "🌧️", "🌪️", "⭐", "💎"],
  },
  modern: {
    vibe: ["🏙️", "🎨", "🎧", "☕", "🌇", "🛹", "📸", "🪴", "🎭", "🌃"],
    object: ["🎸", "📱", "🖌️", "📷", "🧥", "💼", "🧢", "🎒", "📓", "🛼"],
    motif: ["🐈", "🐕", "🐇", "🕊️", "🐢", "🦝", "🐿️", "🦔", "🐦", "🦜"],
    mood: ["💛", "💬", "💭", "💤", "💖", "💥", "🎶", "🌼", "🧡", "🎈"],
  },
  "sci-fi": {
    vibe: ["🚀", "🌌", "🪐", "🛸", "🌠", "🌐", "⚡", "☄️", "🛰️", "🔭"],
    object: ["🤖", "💻", "🔋", "📡", "🔧", "🦾", "⚙️", "🧬", "💾", "🧲"],
    motif: ["🐙", "🦑", "🪼", "🦀", "🦂", "🦎", "🪲", "🦗", "🐠", "🦈"],
    mood: ["🌀", "🧊", "💠", "🫀", "🫧", "🌡️", "💥", "🌟", "🪫", "🌪️"],
  },
  gothic: {
    vibe: ["🕯️", "🕸️", "🌑", "🥀", "🌫️", "🪦", "⛓️", "🖤", "🌒", "🌹"],
    object: ["🎻", "🪞", "📿", "🗝", "🕰️", "🪡", "🧵", "⚰️", "🪶", "📚"],
    motif: ["🦇", "🐦‍⬛", "🕷️", "🐈‍⬛", "🦢", "🦅", "🐀", "🦎", "🦗", "🐛"],
    mood: ["🌘", "💔", "🩸", "🌨️", "💜", "🕳️", "🌩️", "🪨", "🪻", "🍂"],
  },
};

export type SceneEmoji = { emoji: string; label: string };
export const sceneEmojiPools: Record<
  "setting" | "weather" | "focus",
  readonly SceneEmoji[]
> = {
  setting: [
    { emoji: "🏯", label: "a pagoda courtyard" },
    { emoji: "🏰", label: "an old castle" },
    { emoji: "🌆", label: "a city rooftop" },
    { emoji: "🏝️", label: "a remote island" },
    { emoji: "🌲", label: "a pine forest" },
    { emoji: "🏜️", label: "a desert" },
    { emoji: "🏚️", label: "an abandoned house" },
    { emoji: "🚉", label: "a train station" },
    { emoji: "🌋", label: "a volcanic landscape" },
    { emoji: "⛩️", label: "a mountain shrine" },
    { emoji: "🏖️", label: "a quiet beach" },
    { emoji: "🏛️", label: "ancient ruins" },
    { emoji: "🌉", label: "a bridge" },
    { emoji: "🎪", label: "a traveling circus" },
    { emoji: "🏞️", label: "a lakeside valley" },
  ],
  weather: [
    { emoji: "🌧️", label: "rain" },
    { emoji: "🌅", label: "sunrise" },
    { emoji: "🌇", label: "sunset" },
    { emoji: "🌨️", label: "falling snow" },
    { emoji: "🌫️", label: "thick fog" },
    { emoji: "🌩️", label: "a lightning storm" },
    { emoji: "🌙", label: "moonlight" },
    { emoji: "🌈", label: "a rainbow after rain" },
    { emoji: "🌬️", label: "a strong wind" },
    { emoji: "☀️", label: "bright midday sun" },
    { emoji: "❄️", label: "frost" },
    { emoji: "🌌", label: "a starry night" },
  ],
  focus: [
    { emoji: "🏮", label: "a paper lantern" },
    { emoji: "🚲", label: "a bicycle" },
    { emoji: "🗝️", label: "a forgotten key" },
    { emoji: "⛵", label: "a small sailboat" },
    { emoji: "🧳", label: "a suitcase" },
    { emoji: "🪑", label: "an empty chair" },
    { emoji: "🌂", label: "an umbrella" },
    { emoji: "🪁", label: "a kite" },
    { emoji: "⏳", label: "an hourglass" },
    { emoji: "🎠", label: "a carousel horse" },
    { emoji: "🧸", label: "a teddy bear" },
    { emoji: "🗺️", label: "a map" },
    { emoji: "🎐", label: "a wind chime" },
    { emoji: "📯", label: "a horn" },
    { emoji: "🪬", label: "a protective charm" },
  ],
};

export type EmojiPalette = {
  emojis: readonly [string, string];
  colors: readonly [string, string, string, string, string];
};
export const emojiPalettes: readonly EmojiPalette[] = [
  {
    emojis: ["🍑", "🌊"],
    colors: ["#F5B59E", "#E67F70", "#FFF0D9", "#176D73", "#8BCFC0"],
  },
  {
    emojis: ["🌸", "🍵"],
    colors: ["#F7D8DC", "#D98E9E", "#FFF1E9", "#54745B", "#A9BD91"],
  },
  {
    emojis: ["🌻", "🌌"],
    colors: ["#F4CA55", "#D89835", "#FFF2C9", "#25345F", "#8679A7"],
  },
  {
    emojis: ["🍓", "🌿"],
    colors: ["#D94E59", "#F28B84", "#FBE5D9", "#416C50", "#A5C494"],
  },
  {
    emojis: ["🫐", "🍋"],
    colors: ["#374B88", "#788AC3", "#DFE4F6", "#E5BC45", "#FFF0A1"],
  },
  {
    emojis: ["🕯️", "🌙"],
    colors: ["#E1B677", "#A76E45", "#F9E8C9", "#343852", "#8488A6"],
  },
  {
    emojis: ["🍊", "🌲"],
    colors: ["#E9853C", "#F4B66E", "#FBE9D3", "#315C4C", "#80A187"],
  },
  {
    emojis: ["🌋", "❄️"],
    colors: ["#A94532", "#E6784D", "#F2C2A0", "#6F9AA8", "#D9EFF0"],
  },
  {
    emojis: ["🪻", "🍯"],
    colors: ["#795B9D", "#B6A1CB", "#EEE5F1", "#B87C31", "#F0C970"],
  },
  {
    emojis: ["🐚", "🌊"],
    colors: ["#DFA99E", "#EFD1C3", "#FFF4E8", "#3B8A96", "#AAD7D0"],
  },
  {
    emojis: ["🍃", "🌅"],
    colors: ["#537E5C", "#A1C39A", "#EAF0DC", "#D88572", "#F2BF95"],
  },
  {
    emojis: ["☕", "🌹"],
    colors: ["#704A38", "#B3896C", "#F1DEC7", "#A8495D", "#E5A0A8"],
  },
];
