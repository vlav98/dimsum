import { Command } from "../../interfaces/Command";
import { administrationAndUtilitiesCommands } from "./administrationAndUtilities";
import { antiWriterBlockCommands } from "./antiWriterBlock";
import { personalCreationsCommands } from "./personalCreations";
import { productivityAndSharingCommands } from "./productivityAndSharing";
import { serverGamesCommands } from "./serverGames";

export const CommandGroups: { name: string; commands: Command[] }[] = [
  {
    name: "Anti-writer block",
    commands: antiWriterBlockCommands,
  },
  { name: "Productivity & sharing", commands: productivityAndSharingCommands },
  { name: "Server games", commands: serverGamesCommands },
  { name: "Managing personal creations", commands: personalCreationsCommands },
  {
    name: "Administration & utilities",
    commands: administrationAndUtilitiesCommands,
  },
];

export const CommandList: Command[] = CommandGroups.flatMap(
  (group) => group.commands,
);
