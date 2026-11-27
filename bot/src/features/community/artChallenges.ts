import {
  Client,
  DiscordAPIError,
  EmbedBuilder,
  RESTJSONErrorCodes,
} from "discord.js";
import {
  listArtChallenges,
  markArtChallengeHidden,
  removeArtChallenge,
} from "../../storage";

const startingThreads = new Set<string>();

export function setArtChallengeStarting(
  threadId: string,
  starting: boolean,
): void {
  if (starting) startingThreads.add(threadId);
  else startingThreads.delete(threadId);
}

export function createArtChallengeRunner(client: Client) {
  let running = false;
  return async (now = Date.now()): Promise<void> => {
    if (running || !client.isReady()) return;
    running = true;
    try {
      for (const challenge of await listArtChallenges()) {
        if (now < challenge.hideAt || startingThreads.has(challenge.threadId))
          continue;
        try {
          let thread;
          try {
            thread = await client.channels.fetch(challenge.threadId);
          } catch (error) {
            if (
              error instanceof DiscordAPIError &&
              error.code === RESTJSONErrorCodes.UnknownChannel
            ) {
              await removeArtChallenge(challenge.threadId);
              continue;
            }
            throw error;
          }
          if (!thread || !thread.isThread()) {
            await removeArtChallenge(challenge.threadId);
            continue;
          }
          if (!challenge.hidden) {
            try {
              const reference = await thread.messages.fetch(
                challenge.referenceMessageId,
              );
              const embed = reference.embeds[0];
              if (!embed)
                throw new Error("Challenge reference embed is missing.");
              await reference.edit({
                embeds: [
                  EmbedBuilder.from(embed)
                    .setTitle("Reference viewing period ended")
                    .setImage(null),
                ],
              });
            } catch (error) {
              if (!(
                error instanceof DiscordAPIError &&
                error.code === RESTJSONErrorCodes.UnknownMessage
              ))
                throw error;
            }
            await thread.send({
              content: `Reference viewing time is over. Submit your study by <t:${Math.floor(challenge.endAt / 1000)}:F> (<t:${Math.floor(challenge.endAt / 1000)}:R>).`,
              allowedMentions: { parse: [] },
            });
            await markArtChallengeHidden(challenge.threadId);
          }
          if (now >= challenge.endAt) {
            await thread.send({
              content:
                "The submission deadline has passed. Thanks for sharing your studies!",
              allowedMentions: { parse: [] },
            });
            await removeArtChallenge(challenge.threadId);
          }
        } catch (error) {
          console.error(
            `Could not update art challenge ${challenge.threadId}:`,
            error,
          );
        }
      }
    } finally {
      running = false;
    }
  };
}

export function startArtChallenges(client: Client): void {
  const run = createArtChallengeRunner(client);
  const tick = () =>
    void run().catch((error: unknown) =>
      console.error("Could not run art challenge scheduler:", error),
    );
  tick();
  setInterval(tick, 5000).unref();
}
