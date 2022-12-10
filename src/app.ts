import "dotenv/config";
import { Client } from "discord.js";
import { IntentOptions } from "./config/intentOptions.js";
import { onInteraction } from "./events/onInteraction.js";
import { onReady } from "./events/onReady.js";

(async () => {
  const client = new Client({ intents: IntentOptions });

  client.on("ready", async () => await onReady(client));

  client.on("interactionCreate", async (interaction) => {
    await onInteraction(interaction);
  });
  await client.login(process.env.DISCORD_TOKEN);
})();

// console.log("Bot is starting...");

// client.login(token);

// console.log(client);
