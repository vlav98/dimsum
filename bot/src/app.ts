import "dotenv/config";
import { Client, Events, Partials } from "discord.js";
import { IntentOptions } from "./config/intentOptions";
import { onInteraction } from "./events/onInteraction";
import { onReady } from "./events/onReady";
import { onMessageCommand } from "./events/onMessageCommand";
import { startDashboardServer } from "./dashboard/server";
import { applyReactionRole } from "./features/reactionRoles/reactionRoles";
import { startDailyPosts } from "./features/community/dailyPosts";
import { startArtChallenges } from "./features/community/artChallenges";

(async () => {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is required. Configure bot/.env first.");
  }
  if (!process.env.GUILD_ID) {
    throw new Error("GUILD_ID is required. Configure bot/.env first.");
  }

  const client = new Client({
    intents: IntentOptions,
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
  });

  client.on(Events.ClientReady, async () => await onReady(client));

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      await onInteraction(interaction);
    } catch (error) {
      console.error("Could not handle Discord interaction:", error);
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    try {
      await onMessageCommand(message);
    } catch (error) {
      console.error("Could not process message command:", error);
    }
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
      await applyReactionRole(reaction, user, true);
    } catch (error) {
      console.error("Could not assign reaction role:", error);
    }
  });

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    try {
      await applyReactionRole(reaction, user, false);
    } catch (error) {
      console.error("Could not remove reaction role:", error);
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
  startDailyPosts(client);
  startArtChallenges(client);
  await startDashboardServer(client);
})();

// console.log("Bot is starting...");

// client.login(token);

// console.log(client);
