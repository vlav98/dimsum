import { Command } from "interfaces/Command";
import { Hello } from "./Hello";
import { help } from "./help";
import { RandomOCGenerator } from "./oc_generator/randomOCGenerator";
import { fanficPrompt, randomPrompt } from "./randomPrompt";
import { react } from "./react";
import { reactionRoles } from "./reactionRoles";
import { savedPrompts } from "./savedPrompts";
import { twoCharPrompt } from "./twoCharPrompt";

export const CommandList: Command[] = [
  Hello,
  help,
  twoCharPrompt,
  randomPrompt,
  fanficPrompt,
  reactionRoles,
  savedPrompts,
  react,
  RandomOCGenerator,
];
