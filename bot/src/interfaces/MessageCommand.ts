import { Message } from "discord.js";
export interface MessageCommand {
  data: { shortcut: string };
  run: (message: Message) => Promise<void>;
}
