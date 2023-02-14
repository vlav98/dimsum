import { Command } from "src/interfaces/Command";
import { Hello } from "./Hello";
import { help } from "./help";
import { randomPrompt } from "./randomPrompt";
import { react } from "./react";
import { twoCharPrompt } from "./twoCharPrompt";

export const CommandList: Command[] = [
  Hello,
  help,
  twoCharPrompt,
  randomPrompt,
  react,
];
