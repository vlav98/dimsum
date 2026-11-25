import { Command } from "interfaces/Command";
import { Hello } from "./Hello";
import { help } from "./help";
import { RandomOCGenerator } from "./oc_generator/randomOCGenerator";
import { fanficPrompt, randomPrompt } from "./randomPrompt";
import { react } from "./react";
import { reactionRoles } from "./reactionRoles";
import { savedPrompts } from "./savedPrompts";
import { twoCharPrompt } from "./twoCharPrompt";
import { writingCommands } from "./writing";
import { productivityCommands, writingChannelCommand } from "./productivity";
import { communityCommands } from "./community";
import { adopt } from "./creations/adopt";

export const CommandGroups: { name: string; commands: Command[] }[] = [
  {
    name: "Anti-writer block",
    commands: [
      ...writingCommands,
      randomPrompt,
      fanficPrompt,
      twoCharPrompt,
      RandomOCGenerator,
    ],
  },
  { name: "Productivity & sharing", commands: productivityCommands },
  { name: "Server games", commands: communityCommands },
  { name: "Managing personal creations", commands: [adopt, savedPrompts] },
  {
    name: "Administration & utilities",
    commands: [writingChannelCommand, reactionRoles, help, Hello, react],
  },
];

export const CommandList: Command[] = CommandGroups.flatMap(
  (group) => group.commands,
);
