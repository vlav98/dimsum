import { Command } from "src/interfaces/Command";
import { Hello } from "./Hello.js";
import { help } from "./help.js";

export const CommandList: Command[] = [Hello, help];
