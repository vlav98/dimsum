const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mkdtemp, rm, writeFile, readFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

require("ts-node/register");
require("tsconfig-paths/register");

const { ChannelType, Collection } = require("discord.js");
const { createDailyPostRunner } = require("../src/features/community/dailyPosts");
const storage = require("../src/storage");

test("daily posts migrate storage, respect schedules, and persist the last posted day", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dimsum-daily-"));
  const previous = process.env.DIMSUM_DATA_DIR;
  process.env.DIMSUM_DATA_DIR = directory;
  const sent = [];
  let canPost = true;
  const channel = {
    id: "channel",
    type: ChannelType.GuildText,
    permissionsFor: () => ({ has: () => canPost }),
    send: async (message) => {
      sent.push(message);
    },
  };
  const client = {
    isReady: () => true,
    guilds: {
      cache: new Collection([
        [
          "guild",
          {
            members: { me: {} },
            channels: { cache: new Collection([["channel", channel]]) },
          },
        ],
      ]),
    },
  };
  try {
    await writeFile(
      path.join(directory, "dashboard-data.json"),
      JSON.stringify({
        version: 3,
        guildPrefixes: { guild: "??" },
        savedPrompts: [],
        reactionRoleMessages: [],
        guildWritingChannels: { guild: "channel" },
        adoptionOffers: [],
      }),
    );
    assert.equal((await storage.getDailyPostSettings("guild")).enabled, false);
    await storage.setDailyPostSettings("guild", {
      enabled: true,
      channelId: "channel",
      time: "09:00",
      kind: "challenge",
    });
    const run = createDailyPostRunner(client);
    await run(new Date("2026-11-26T08:59:00Z"));
    assert.equal(sent.length, 0);
    await Promise.all([
      run(new Date("2026-11-26T09:00:00Z")),
      run(new Date("2026-11-26T09:00:00Z")),
    ]);
    assert.equal(sent.length, 1);
    assert.match(sent[0].embeds[0].toJSON().title, /Daily writing challenge/);
    await createDailyPostRunner(client)(new Date("2026-11-26T18:00:00Z"));
    assert.equal(sent.length, 1);
    await storage.setDailyPostSettings("guild", {
      enabled: true,
      channelId: "channel",
      time: "09:00",
      kind: "prompt",
    });
    await run(new Date("2026-11-26T19:00:00Z"));
    assert.equal(sent.length, 1);
    await run(new Date("2026-11-28T12:00:00Z"));
    assert.equal(sent.length, 2);
    await storage.setDailyPostSettings("guild", {
      enabled: true,
      channelId: "channel",
      time: "09:00",
      kind: "prompt",
    });
    canPost = false;
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => errors.push(args);
    try {
      await run(new Date("2026-11-30T12:00:00Z"));
    } finally {
      console.error = originalError;
    }
    assert.equal(errors.length, 1);
    assert.equal(sent.length, 2);
    assert.equal(
      (await storage.getDailyPostSettings("guild")).lastPostedDate,
      "2026-11-28",
    );
    canPost = true;
    await run(new Date("2026-11-30T12:01:00Z"));
    assert.equal(sent.length, 3);
    assert.match(sent[1].embeds[0].toJSON().title, /Daily story prompt/);
    assert.deepEqual(sent[1].allowedMentions, { parse: [] });
    const stored = JSON.parse(
      await readFile(path.join(directory, "dashboard-data.json"), "utf8"),
    );
    assert.equal(stored.version, 5);
    assert.equal(stored.guildPrefixes.guild, "??");
    assert.equal(stored.guildWritingChannels.guild, "channel");
    assert.equal(stored.guildDailyPosts.guild.lastPostedDate, "2026-11-30");
    await storage.setDailyPostSettings("guild", {
      enabled: false,
      channelId: null,
      time: "09:00",
      kind: "prompt",
    });
    await run(new Date("2026-12-01T12:00:00Z"));
    assert.equal(sent.length, 3);
  } finally {
    if (previous === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
