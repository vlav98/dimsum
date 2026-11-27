import { additionalTags } from "../../data/generators/fanfic";

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
