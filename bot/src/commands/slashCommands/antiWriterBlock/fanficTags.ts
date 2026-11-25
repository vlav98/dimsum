const additionalTags = [
  "Alternate Universe - Modern",
  "Alternate Universe - Coffee Shops",
  "Canon Divergence",
  "Domestic Fluff",
  "Emotional Hurt/Comfort",
  "Established Relationship",
  "First Kiss",
  "Forced Proximity",
  "Found Family",
  "Happy Ending",
  "Idiots in Love",
  "Identity Reveal",
  "Meet-Cute",
  "Missing Scene",
  "Mutual Pining",
  "Only One Bed",
  "Protective Character",
  "Road Trips",
  "Time Loop",
];

export function getRandomAdditionalTags(
  excludedTags: readonly string[] = [],
  count = 3,
): string[] {
  const availableTags = additionalTags.filter(
    (tag) => !excludedTags.includes(tag),
  );
  const selectedTags: string[] = [];

  while (selectedTags.length < count && availableTags.length > 0) {
    const index = Math.floor(Math.random() * availableTags.length);
    selectedTags.push(availableTags.splice(index, 1)[0]);
  }

  return selectedTags;
}
