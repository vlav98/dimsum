import "dotenv/config";
import { Client, Events } from "discord.js";
import { IntentOptions } from "./config/intentOptions";
import { onInteraction } from "./events/onInteraction";
import { onReady } from "./events/onReady";
import { onMessageCommand } from "events/onMessageCommand";

(async () => {
  const client = new Client({ intents: IntentOptions });

  client.on(Events.ClientReady, async () => await onReady(client));

  client.on(Events.InteractionCreate, async (interaction) => {
    await onInteraction(interaction);
  });

  client.on(Events.MessageCreate, async (message) => {
    onMessageCommand(message, process.env.PREFIX);
  });

  await client.login(process.env.DISCORD_TOKEN);
})();

// console.log("Bot is starting...");

// client.login(token);

// console.log(client);
