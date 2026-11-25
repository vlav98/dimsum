import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ReactionRoleMapping {
  emoji: string;
  roleId: string;
}

export interface ReactionRoleMessage {
  guildId: string;
  channelId: string;
  messageId: string;
  content: string;
  mappings: ReactionRoleMapping[];
  createdAt: string;
}

export const savedPromptKinds = [
  "random",
  "fanfic",
  "otp",
  "oc",
  "other",
  "prompt",
  "tag",
  "twist",
  "name",
  "challenge",
  "group",
  "roulette",
  "matchup",
] as const;
export type SavedPromptKind = (typeof savedPromptKinds)[number];

export interface SavedPrompt {
  id: string;
  sourceMessageId: string;
  userId: string;
  username: string;
  displayName: string;
  guildId: string | null;
  guildName: string | null;
  kind: SavedPromptKind;
  content: string;
  createdAt: string;
}

export interface AdoptionOffer {
  id: string;
  guildId: string;
  guildName: string;
  content: string;
  createdAt: string;
  claimedBy: string | null;
}

interface StoredData {
  version: 3;
  guildPrefixes: Record<string, string>;
  reactionRoleMessages: ReactionRoleMessage[];
  savedPrompts: SavedPrompt[];
  guildWritingChannels: Record<string, string>;
  adoptionOffers: AdoptionOffer[];
}

type StoredDataV2 = Omit<
  StoredData,
  "version" | "guildWritingChannels" | "adoptionOffers"
> & { version: 2 };

interface StoredDataV1 {
  version: 1;
  guildPrefixes: Record<string, string>;
  reactionRoleMessages: ReactionRoleMessage[];
  savedPrompts: Omit<SavedPrompt, "kind">[];
}

const emptyData = (): StoredData => ({
  version: 3,
  guildPrefixes: {},
  reactionRoleMessages: [],
  savedPrompts: [],
  guildWritingChannels: {},
  adoptionOffers: [],
});

let pendingWrite: Promise<void> = Promise.resolve();

export function getDefaultPrefix(): string {
  return process.env.PREFIX?.trim() || "!";
}

function dataFilePath(): string {
  const dataDirectory =
    process.env.DIMSUM_DATA_DIR ?? path.resolve(__dirname, "../data");
  return path.join(dataDirectory, "dashboard-data.json");
}

async function readData(): Promise<StoredData> {
  try {
    const raw = await readFile(dataFilePath(), "utf8");
    const data = JSON.parse(raw) as StoredData | StoredDataV1 | StoredDataV2;
    if (
      (data.version !== 1 && data.version !== 2 && data.version !== 3) ||
      !data.guildPrefixes ||
      typeof data.guildPrefixes !== "object" ||
      Array.isArray(data.guildPrefixes) ||
      !Array.isArray(data.reactionRoleMessages) ||
      !Array.isArray(data.savedPrompts)
    ) {
      throw new Error("Dashboard data file has an unsupported format.");
    }
    if (data.version === 1) {
      return {
        ...data,
        version: 3,
        guildWritingChannels: {},
        adoptionOffers: [],
        savedPrompts: data.savedPrompts.map((prompt) => ({
          ...prompt,
          kind: "other",
        })),
      };
    }
    if (data.version === 2) {
      return {
        ...data,
        version: 3,
        guildWritingChannels: {},
        adoptionOffers: [],
      };
    }
    if (
      !data.guildWritingChannels ||
      typeof data.guildWritingChannels !== "object" ||
      Array.isArray(data.guildWritingChannels) ||
      !Array.isArray(data.adoptionOffers)
    ) {
      throw new Error("Dashboard data file has an unsupported format.");
    }
    return data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return emptyData();
    }
    throw error;
  }
}

function updateData<T>(update: (data: StoredData) => T): Promise<T> {
  const operation = pendingWrite.then(async () => {
    const data = await readData();
    const result = update(data);
    const filePath = dataFilePath();
    const directory = path.dirname(filePath);
    await mkdir(directory, { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(data, null, 2), {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, filePath);
    return result;
  });
  pendingWrite = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

async function currentData(): Promise<StoredData> {
  await pendingWrite;
  return readData();
}

export async function getGuildPrefix(guildId: string): Promise<string | null> {
  const data = await currentData();
  return data.guildPrefixes[guildId] ?? null;
}

export function setGuildPrefix(
  guildId: string,
  prefix: string | null,
): Promise<void> {
  return updateData((data) => {
    if (prefix === null) delete data.guildPrefixes[guildId];
    else data.guildPrefixes[guildId] = prefix;
  });
}

export async function listReactionRoleMessages(
  guildId: string,
): Promise<ReactionRoleMessage[]> {
  const data = await currentData();
  return data.reactionRoleMessages.filter((entry) => entry.guildId === guildId);
}

export function findReactionRoleMessage(
  messageId: string,
): Promise<ReactionRoleMessage | null> {
  return currentData().then(
    (data) =>
      data.reactionRoleMessages.find(
        (entry) => entry.messageId === messageId,
      ) ?? null,
  );
}

export function saveReactionRoleMessage(
  message: ReactionRoleMessage,
): Promise<void> {
  return updateData((data) => {
    data.reactionRoleMessages = data.reactionRoleMessages.filter(
      (entry) => entry.messageId !== message.messageId,
    );
    data.reactionRoleMessages.push(message);
  });
}

export function removeReactionRoleMessage(messageId: string): Promise<void> {
  return updateData((data) => {
    data.reactionRoleMessages = data.reactionRoleMessages.filter(
      (entry) => entry.messageId !== messageId,
    );
  });
}

export function savePrompt(prompt: SavedPrompt): Promise<boolean> {
  return updateData((data) => {
    if (data.savedPrompts.some((entry) => entry.id === prompt.id)) {
      return false;
    }
    data.savedPrompts.push(prompt);
    return true;
  });
}

export async function listSavedPromptsForUser(
  userId: string,
  kind?: SavedPromptKind,
): Promise<SavedPrompt[]> {
  const data = await currentData();
  return data.savedPrompts
    .filter(
      (prompt) =>
        prompt.userId === userId &&
        (kind === undefined || prompt.kind === kind),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getSavedPromptForUser(
  userId: string,
  promptId: string,
): Promise<SavedPrompt | null> {
  const data = await currentData();
  return (
    data.savedPrompts.find(
      (prompt) => prompt.userId === userId && prompt.id === promptId,
    ) ?? null
  );
}

export function deleteSavedPromptForUser(
  userId: string,
  promptId: string,
): Promise<boolean> {
  return updateData((data) => {
    const index = data.savedPrompts.findIndex(
      (prompt) => prompt.userId === userId && prompt.id === promptId,
    );
    if (index === -1) return false;
    data.savedPrompts.splice(index, 1);
    return true;
  });
}

export function deleteSavedPromptForGuild(
  guildId: string,
  promptId: string,
): Promise<boolean> {
  return updateData((data) => {
    const index = data.savedPrompts.findIndex(
      (prompt) => prompt.guildId === guildId && prompt.id === promptId,
    );
    if (index === -1) return false;
    data.savedPrompts.splice(index, 1);
    return true;
  });
}

export async function listSavedPromptsForGuild(
  guildId: string,
): Promise<SavedPrompt[]> {
  const data = await currentData();
  return data.savedPrompts
    .filter((prompt) => prompt.guildId === guildId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getWritingChannel(
  guildId: string,
): Promise<string | null> {
  return (await currentData()).guildWritingChannels[guildId] ?? null;
}

export function setWritingChannel(
  guildId: string,
  channelId: string | null,
): Promise<void> {
  return updateData((data) => {
    if (channelId === null) delete data.guildWritingChannels[guildId];
    else data.guildWritingChannels[guildId] = channelId;
  });
}

export function createAdoptionOffer(offer: AdoptionOffer): Promise<void> {
  return updateData((data) => {
    if (data.adoptionOffers.some((entry) => entry.id === offer.id)) {
      throw new Error("An adoption offer already exists for this message.");
    }
    data.adoptionOffers.push(offer);
  });
}

export function claimAdoption(
  offerId: string,
  guildId: string,
  user: Pick<SavedPrompt, "userId" | "username" | "displayName">,
): Promise<
  | { status: "claimed" }
  | { status: "already-claimed"; ownerId: string }
  | { status: "missing" }
> {
  return updateData((data) => {
    const offer = data.adoptionOffers.find(
      (entry) => entry.id === offerId && entry.guildId === guildId,
    );
    if (!offer) return { status: "missing" } as const;
    if (offer.claimedBy)
      return { status: "already-claimed", ownerId: offer.claimedBy } as const;
    offer.claimedBy = user.userId;
    const id = `${user.userId}:${offer.id}`;
    if (!data.savedPrompts.some((prompt) => prompt.id === id)) {
      data.savedPrompts.push({
        ...user,
        id,
        sourceMessageId: offer.id,
        guildId: offer.guildId,
        guildName: offer.guildName,
        kind: "oc",
        content: offer.content,
        createdAt: new Date().toISOString(),
      });
    }
    return { status: "claimed" } as const;
  });
}
