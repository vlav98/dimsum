import { Command } from "interfaces/Command";
import { Hello } from "./Hello";
import { help } from "./help";
import { RandomOCGenerator } from "./oc_generator/randomOCGenerator";
import { randomPrompt } from "./randomPrompt";
import { react } from "./react";
import { twoCharPrompt } from "./twoCharPrompt";

export const CommandList: Command[] = [
  Hello,
  help,
  twoCharPrompt,
  randomPrompt,
  react,
  RandomOCGenerator,
];
