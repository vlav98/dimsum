import { Command } from "src/interfaces/Command";
import { Hello } from "./Hello.js";
import { help } from "./help.js";
import { randomPrompt } from "./randomPrompt.js";
import { twoCharPrompt } from "./twoCharPrompt.js";

export const CommandList: Command[] = [
  Hello,
  help,
  twoCharPrompt,
  randomPrompt,
];
