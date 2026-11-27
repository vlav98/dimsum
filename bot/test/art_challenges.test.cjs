const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mkdtemp, rm, writeFile } = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { ChannelType, EmbedBuilder } = require("discord.js");

require("ts-node/register");
require("tsconfig-paths/register");

const { CommandList } = require("../src/commands");
const {
  createArtChallengeRunner,
} = require("../src/features/community/artChallenges");
const storage = require("../src/storage");

test("OC art vibe includes a concept, palette and usable color script", async () => {
  const command = CommandList.find((item) => item.data.name === "oc-art-vibe");
  assert.ok(command);
  let reply;
  await command.run({
    reply: async (value) => {
      reply = value;
    },
  });
  const embed = reply.embeds[0].toJSON();
  for (const name of ["Name", "Aesthetic", "Power / role", "Color script"]) {
    assert.ok(embed.fields.find((field) => field.name === name));
  }
  const palette = embed.fields.find((field) => field.name.endsWith("palette"));
  const colors = palette.value.match(/#[0-9A-F]{6}/g);
  assert.ok(colors.length >= 3 && colors.length <= 6);
  const script = embed.fields.find(
    (field) => field.name === "Color script",
  ).value;
  assert.ok(script.includes(colors[0]));
  assert.ok(script.includes(colors.at(-1)));
  assert.equal(embed.image.url, "attachment://palette.png");
  assert.equal(reply.files[0].name, "palette.png");
});

test("drawing challenge persists its deadlines and hides only the reference", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dimsum-art-"));
  const previousDirectory = process.env.DIMSUM_DATA_DIR;
  const previousKey = process.env.UNSPLASH_ACCESS_KEY;
  const previousFetch = global.fetch;
  t.after(async () => {
    if (previousDirectory === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previousDirectory;
    if (previousKey === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
    else process.env.UNSPLASH_ACCESS_KEY = previousKey;
    global.fetch = previousFetch;
    await rm(directory, { recursive: true, force: true });
  });
  process.env.DIMSUM_DATA_DIR = directory;
  process.env.UNSPLASH_ACCESS_KEY = "test-key";
  await writeFile(
    path.join(directory, "dashboard-data.json"),
    JSON.stringify({
      version: 4,
      guildPrefixes: { guild: "??" },
      reactionRoleMessages: [],
      savedPrompts: [],
      guildWritingChannels: {},
      adoptionOffers: [],
      guildDailyPosts: {},
    }),
  );
  const now = 1800000000000;
  t.mock.method(Date, "now", () => now);
  global.fetch = async (url) => {
    assert.equal(url.searchParams.get("content_filter"), "high");
    return {
      ok: true,
      json: async () => ({
        urls: { regular: "https://images.unsplash.com/example" },
        links: { html: "https://unsplash.com/photos/example" },
        user: {
          name: "Artist",
          links: { html: "https://unsplash.com/@artist" },
        },
      }),
    };
  };
  const notifications = [];
  let published;
  let postUpdate;
  let referenceEmbed;
  const referenceMessage = {
    id: "reference",
    get embeds() {
      return [referenceEmbed];
    },
    edit: async ({ embeds }) => {
      assert.equal((await storage.listArtChallenges()).length, 1);
      referenceEmbed = embeds[0];
    },
  };
  const thread = {
    id: "thread",
    url: "https://discord.com/channels/guild/channel/thread",
    isThread: () => true,
    messages: {
      fetch: async (id) => {
        assert.equal(id, "reference");
        return referenceMessage;
      },
    },
    send: async (payload) => {
      if (payload.embeds) {
        referenceEmbed = payload.embeds[0];
        return referenceMessage;
      }
      notifications.push(payload);
    },
  };
  const channel = {
    type: ChannelType.GuildText,
    send: async (payload) => {
      published = payload;
      return {
        startThread: async () => thread,
        edit: async (payload) => {
          postUpdate = payload;
        },
      };
    },
  };
  let reply;
  const interaction = {
    guildId: "guild",
    channel,
    appPermissions: { has: () => true },
    options: {
      getInteger: (key) => ({ view_minutes: 2, submit_minutes: 3 })[key],
    },
    deferReply: async () => {},
    editReply: async (value) => {
      reply = value;
    },
    reply: async (value) => {
      reply = value;
    },
  };
  const command = CommandList.find(
    (item) => item.data.name === "draw-this-in-palette",
  );
  assert.ok(command);
  await command.run(interaction);
  assert.match(reply, /Challenge started/);
  assert.match(postUpdate.content, /Challenge started/);
  assert.equal(
    published.embeds[0].toJSON().image.url,
    "attachment://palette.png",
  );
  assert.equal(
    referenceEmbed.toJSON().image.url,
    "https://images.unsplash.com/example",
  );
  const [record] = await storage.listArtChallenges();
  assert.equal(record.hideAt, now + 120000);
  assert.equal(record.endAt, now + 300000);
  assert.equal(await storage.getGuildPrefix("guild"), "??");
  assert.match(
    published.embeds[0].toJSON().description,
    new RegExp(`<t:${Math.floor(record.hideAt / 1000)}:R>`),
  );
  assert.match(
    published.embeds[0].toJSON().description,
    new RegExp(`<t:${Math.floor(record.endAt / 1000)}:R>`),
  );
  const client = {
    isReady: () => true,
    channels: { fetch: async () => thread },
  };
  await createArtChallengeRunner(client)(record.hideAt - 1);
  assert.equal(notifications.length, 0);
  await createArtChallengeRunner(client)(record.hideAt);
  const hidden = EmbedBuilder.from(referenceEmbed).toJSON();
  assert.equal(hidden.image, undefined);
  assert.match(hidden.description, /Artist/);
  assert.match(notifications[0].content, /viewing time is over/);
  assert.deepEqual(notifications[0].allowedMentions, { parse: [] });
  assert.equal((await storage.listArtChallenges())[0].hidden, true);
  await createArtChallengeRunner(client)(record.endAt);
  assert.match(notifications[1].content, /deadline has passed/);
  assert.equal((await storage.listArtChallenges()).length, 0);
  await createArtChallengeRunner(client)(record.endAt + 5000);
  assert.equal(notifications.length, 2);

  referenceEmbed = new EmbedBuilder()
    .setTitle("Pose reference")
    .setImage("https://images.unsplash.com/example");
  await storage.saveArtChallenge({
    ...record,
    threadId: "retry",
    hidden: false,
  });
  const originalSend = thread.send;
  thread.send = async () => {
    throw new Error("temporary Discord outage");
  };
  t.mock.method(console, "error", () => {});
  await createArtChallengeRunner(client)(record.endAt);
  assert.equal(EmbedBuilder.from(referenceEmbed).toJSON().image, undefined);
  assert.equal((await storage.listArtChallenges())[0].hidden, false);
  thread.send = originalSend;
  await createArtChallengeRunner(client)(record.endAt);
  assert.equal((await storage.listArtChallenges()).length, 0);
  assert.equal(notifications.length, 4);

  interaction.options.getInteger = () => null;
  await command.run(interaction);
  const [defaults] = await storage.listArtChallenges();
  assert.equal(defaults.hideAt, now + 10 * 60000);
  assert.equal(defaults.endAt, now + 70 * 60000);
});

test("drawing challenge rejects unsupported channels and missing permissions", async () => {
  const command = CommandList.find(
    (item) => item.data.name === "draw-this-in-palette",
  );
  let response;
  const interaction = {
    guildId: "guild",
    channel: { type: ChannelType.PublicThread },
    reply: async (value) => {
      response = value;
    },
  };
  await command.run(interaction);
  assert.match(response.content, /server text or announcement/);
  interaction.channel.type = ChannelType.GuildText;
  interaction.appPermissions = { has: () => false };
  await command.run(interaction);
  assert.match(response.content, /permission/);
});
