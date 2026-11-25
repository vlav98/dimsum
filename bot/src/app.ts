import "dotenv/config";
import { Client, Events } from "discord.js";
import { IntentOptions } from "./config/intentOptions";
import { onInteraction } from "./events/onInteraction";
import { onReady } from "./events/onReady";
import { onMessageCommand } from "./events/onMessageCommand";
import { startDashboardServer } from "./dashboard";

(async () => {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is required. Configure bot/.env first.");
  }
  if (!process.env.GUILD_ID) {
    throw new Error("GUILD_ID is required. Configure bot/.env first.");
  }

  const client = new Client({ intents: IntentOptions });

  client.on(Events.ClientReady, async () => await onReady(client));

  client.on(Events.InteractionCreate, async (interaction) => {
    await onInteraction(interaction);
  });

  client.on(Events.MessageCreate, async (message) => {
    onMessageCommand(message, process.env.PREFIX ?? "!");
  });

  await client.login(process.env.DISCORD_TOKEN);
  await startDashboardServer(client);
})();

// console.log("Bot is starting...");

// client.login(token);

// console.log(client);
