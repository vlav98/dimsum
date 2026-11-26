import { Client, EmbedBuilder } from "discord.js";
import { writingChannel } from "./community";
import { generatePrompt, writingChallenge } from "./generators/writing";
import { savePromptButton } from "./promptComponents";
import { listDailyPostSettings, markDailyPostSent } from "./storage";

export function createDailyPostRunner(client: Client) {
  let running = false;
  return async (now = new Date()): Promise<void> => {
    if (running || !client.isReady()) return;
    running = true;
    try {
      const date = now.toISOString().slice(0, 10);
      const time = now.toISOString().slice(11, 16);
      for (const [guildId, settings] of await listDailyPostSettings()) {
        if (
          !settings.enabled ||
          !settings.channelId ||
          settings.time > time ||
          (settings.lastPostedDate !== null && settings.lastPostedDate >= date)
        )
          continue;
        try {
          const channel = await writingChannel(
            client,
            guildId,
            settings.channelId,
          );
          const embed =
            settings.kind === "challenge"
              ? new EmbedBuilder()
                  .setTitle(`Daily writing challenge | ${date} UTC`)
                  .setDescription(writingChallenge(now))
              : generatePrompt().setTitle(`Daily story prompt | ${date} UTC`);
          await channel.send({
            embeds: [embed],
            components: [
              savePromptButton(
                settings.kind === "challenge" ? "challenge" : "prompt",
              ),
            ],
            allowedMentions: { parse: [] },
          });
          await markDailyPostSent(guildId, date);
        } catch (error) {
          console.error(
            `Could not send daily post for server ${guildId}:`,
            error,
          );
        }
      }
    } finally {
      running = false;
    }
  };
}

export function startDailyPosts(client: Client): void {
  const run = createDailyPostRunner(client);
  const tick = () =>
    void run().catch((error: unknown) =>
      console.error("Could not run daily post scheduler:", error),
    );
  tick();
  setInterval(tick, 60_000).unref();
}
