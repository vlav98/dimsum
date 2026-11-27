import { challenges } from "../data/generators/writing";
import { pick } from "./random";

export function writingChallenge(date?: Date): string {
  if (!date) return pick(challenges);
  const day = Math.floor(date.getTime() / 86_400_000);
  if (!Number.isFinite(day)) throw new Error("A valid date is required.");
  return challenges[
    ((day % challenges.length) + challenges.length) % challenges.length
  ];
}
