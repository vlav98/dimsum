import {
  Client,
  DiscordAPIError,
  EmbedBuilder,
  RESTJSONErrorCodes,
  ThreadChannel,
} from "discord.js";
import {
  ArtChallenge,
  listArtChallenges,
  markArtChallengeHidden,
  removeArtChallenge,
} from "../../storage";

const startingThreads = new Set<string>();
const operations = new Map<string, Promise<void>>();

export function setArtChallengeStarting(
  threadId: string,
  starting: boolean,
): void {
  if (starting) startingThreads.add(threadId);
  else startingThreads.delete(threadId);
}

async function withThreadLock<T>(
  id: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = operations.get(id) ?? Promise.resolve();
  const result = previous.then(action);
  const done = result.then(
    () => undefined,
    () => undefined,
  );
  operations.set(id, done);
  try {
    return await result;
  } finally {
    if (operations.get(id) === done) operations.delete(id);
  }
}

export class ArtChallengeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function fetchThread(
  client: Client,
  id: string,
): Promise<ThreadChannel | null> {
  try {
    const channel = await client.channels.fetch(id);
    return channel?.isThread() ? channel : null;
  } catch (error) {
    if (
      error instanceof DiscordAPIError &&
      error.code === RESTJSONErrorCodes.UnknownChannel
    )
      return null;
    throw error;
  }
}

export async function listGuildArtChallenges(
  client: Client,
  guildId: string,
): Promise<ArtChallenge[]> {
  const entries = await listArtChallenges();
  const result: ArtChallenge[] = [];
  for (const challenge of entries) {
    if (startingThreads.has(challenge.threadId)) continue;
    if (challenge.guildId === guildId) result.push(challenge);
    else if (!challenge.guildId) {
      const thread = await fetchThread(client, challenge.threadId);
      if (thread?.guildId === guildId) result.push(challenge);
    }
  }
  return result;
}

async function updateStarter(
  thread: ThreadChannel,
  hideAt?: number,
  endAt?: number,
): Promise<void> {
  const post = await thread.fetchStarterMessage();
  if (!post || !post.embeds[0])
    throw new Error("Challenge post is unavailable.");
  const embed = EmbedBuilder.from(post.embeds[0]);
  let description = embed.data.description;
  if (!description) throw new Error("Challenge post description is missing.");
  if (hideAt !== undefined) {
    const seconds = Math.floor(hideAt / 1000);
    if (!/Reference hidden: <t:\d+:F> \(<t:\d+:R>\)/.test(description))
      throw new Error("Challenge viewing timestamp is missing.");
    description = description.replace(
      /Reference hidden: <t:\d+:F> \(<t:\d+:R>\)/,
      `Reference hidden: <t:${seconds}:F> (<t:${seconds}:R>)`,
    );
  }
  if (endAt !== undefined) {
    const seconds = Math.floor(endAt / 1000);
    if (!/Submission deadline: <t:\d+:F> \(<t:\d+:R>\)/.test(description))
      throw new Error("Challenge submission timestamp is missing.");
    description = description.replace(
      /Submission deadline: <t:\d+:F> \(<t:\d+:R>\)/,
      `Submission deadline: <t:${seconds}:F> (<t:${seconds}:R>)`,
    );
  }
  await post.edit({ embeds: [embed.setDescription(description)] });
}

async function transition(
  thread: ThreadChannel,
  challenge: ArtChallenge,
  hide: boolean,
  end: boolean,
  manual: boolean,
  now: number,
): Promise<void> {
  if (hide && !challenge.hidden) {
    try {
      const reference = await thread.messages.fetch(
        challenge.referenceMessageId,
      );
      const embed = reference.embeds[0];
      if (!embed) throw new Error("Challenge reference embed is missing.");
      const endSeconds = Math.floor(
        (end && manual ? now : challenge.endAt) / 1000,
      );
      await reference.edit({
        content: `Reference viewing time is over. Submission deadline: <t:${endSeconds}:F> (<t:${endSeconds}:R>).`,
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
    if (manual) await updateStarter(thread, now, end ? now : undefined);
    await thread.send({
      content:
        end && manual
          ? "Reference viewing time is over. The challenge is ending early."
          : `Reference viewing time is over. Submit your study by <t:${Math.floor(challenge.endAt / 1000)}:F> (<t:${Math.floor(challenge.endAt / 1000)}:R>).`,
      allowedMentions: { parse: [] },
    });
    await markArtChallengeHidden(challenge.threadId);
  } else if (end && manual) {
    await updateStarter(thread, undefined, now);
    try {
      const reference = await thread.messages.fetch(
        challenge.referenceMessageId,
      );
      await reference.edit({ content: "This challenge has ended early." });
    } catch (error) {
      if (!(
        error instanceof DiscordAPIError &&
        error.code === RESTJSONErrorCodes.UnknownMessage
      ))
        throw error;
    }
  }
  if (end) {
    await thread.send({
      content: manual
        ? "A server manager ended this challenge early. Thanks for sharing your studies!"
        : "The submission deadline has passed. Thanks for sharing your studies!",
      allowedMentions: { parse: [] },
    });
    await removeArtChallenge(challenge.threadId);
  }
}

export async function manageArtChallenge(
  client: Client,
  guildId: string,
  threadId: string,
  action: "hide" | "end",
): Promise<void> {
  await withThreadLock(threadId, async () => {
    if (startingThreads.has(threadId))
      throw new ArtChallengeError("The challenge is still starting.", 409);
    const challenge = (await listArtChallenges()).find(
      (entry) => entry.threadId === threadId,
    );
    if (!challenge || (challenge.guildId && challenge.guildId !== guildId)) {
      throw new ArtChallengeError("Challenge not found.", 404);
    }
    const thread = await fetchThread(client, threadId);
    if (!thread || thread.guildId !== guildId)
      throw new ArtChallengeError("Challenge not found.", 404);
    if (action === "hide" && challenge.hidden)
      throw new ArtChallengeError("The reference is already hidden.", 409);
    await transition(
      thread,
      challenge,
      !challenge.hidden,
      action === "end",
      true,
      Date.now(),
    );
  });
}

export function createArtChallengeRunner(client: Client) {
  let running = false;
  return async (now = Date.now()): Promise<void> => {
    if (running || !client.isReady()) return;
    running = true;
    try {
      for (const entry of await listArtChallenges()) {
        if (now < entry.hideAt || startingThreads.has(entry.threadId)) continue;
        try {
          await withThreadLock(entry.threadId, async () => {
            const challenge = (await listArtChallenges()).find(
              (item) => item.threadId === entry.threadId,
            );
            if (
              !challenge ||
              now < challenge.hideAt ||
              startingThreads.has(challenge.threadId)
            )
              return;
            const thread = await fetchThread(client, challenge.threadId);
            if (!thread) {
              await removeArtChallenge(challenge.threadId);
              return;
            }
            if (challenge.guildId && thread.guildId !== challenge.guildId)
              throw new Error("Challenge server does not match thread.");
            await transition(
              thread,
              challenge,
              !challenge.hidden,
              now >= challenge.endAt,
              false,
              now,
            );
          });
        } catch (error) {
          console.error(
            `Could not update art challenge ${entry.threadId}:`,
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
