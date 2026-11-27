export const randomOCProperties = [
  ["name", "Name"],
  ["gender", "Gender"],
  ["species", "Species"],
  ["sexuality", "Sexuality"],
  ["hair_color", "Hair color"],
  ["hair_length", "Hair length"],
  ["eye_color", "Eye color"],
  ["heterochromia", "Heterochromia"],
  ["life_status", "Life status"],
] as const;

export const fullOCProperties = [
  ...randomOCProperties,
  ["personality", "Personality"],
  ["flaw", "Flaw"],
  ["phobia", "Phobia"],
  ["aesthetic", "Aesthetic"],
  ["power_role", "Power / role"],
  ["secret", "Secret"],
] as const;

export const characterOptions = [
  ["name", "Set a name; otherwise one is generated"],
  ["gender", "Set a gender; otherwise one is randomized"],
  ["sexuality", "Set a sexuality; otherwise one is randomized"],
  ["species", "Set a species; otherwise one is randomized"],
  ["hair_color", "Set a hair color; otherwise one is randomized"],
  ["hair_length", "Set a hair length; otherwise one is randomized"],
  ["eye_color", "Set an eye color; otherwise one is randomized"],
  ["life_status", "Set a life status; otherwise one is randomized"],
] as const;
