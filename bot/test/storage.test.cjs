const assert = require("node:assert/strict");
const { mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const storage = require("../src/storage");
const { saveGeneratedPrompt, showSavedPrompt } = require("../src/savedPrompts");
const { savedPrompts } = require("../src/commands/slashCommands/savedPrompts");
const { onMessageCommand } = require("../src/events/onMessageCommand");
const { onInteraction } = require("../src/events/onInteraction");
const { ChannelType, MessageFlags } = require("discord.js");

test("per-server prefixes and saved prompts persist with private guild scoping", async () => {
  const dataDirectory = await mkdtemp(path.join(os.tmpdir(), "dimsum-store-"));
  const previousDirectory = process.env.DIMSUM_DATA_DIR;
  process.env.DIMSUM_DATA_DIR = dataDirectory;

  try {
    assert.equal(await storage.getGuildPrefix("guild-a"), null);
    await storage.setGuildPrefix("guild-a", "??");
    assert.equal(await storage.getGuildPrefix("guild-a"), "??");
    assert.equal(await storage.getGuildPrefix("guild-b"), null);

    const prompt = {
      id: "user-1:message-1",
      sourceMessageId: "message-1",
      userId: "user-1",
      username: "test-user",
      displayName: "Test User",
      guildId: "guild-a",
      guildName: "Test Server",
      kind: "random",
      content: "Prompt: write a story",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    assert.equal(await storage.savePrompt(prompt), true);
    assert.equal(await storage.savePrompt(prompt), false);
    assert.deepEqual(await storage.listSavedPromptsForUser("user-1"), [prompt]);
    assert.deepEqual(await storage.listSavedPromptsForGuild("guild-a"), [
      prompt,
    ]);
    assert.deepEqual(await storage.listSavedPromptsForGuild("guild-b"), []);

    let confirmation;
    await saveGeneratedPrompt(
      {
        message: {
          id: "message-2",
          embeds: [
            {
              title: "Fanfic prompt",
              description: "Generated prompt",
              fields: [{ name: "Trope", value: "Friends to lovers" }],
            },
          ],
        },
        user: {
          id: "user-2",
          username: "another-user",
          globalName: "Another User",
        },
        guildId: "guild-a",
        guild: { name: "Test Server" },
        deferReply: async () => {},
        editReply: async (content) => {
          confirmation = content;
        },
      },
      "fanfic",
    );
    assert.match(confirmation, /server’s admins/);
    assert.equal(
      (await storage.listSavedPromptsForUser("user-2"))[0].content,
      "Fanfic prompt\n\nGenerated prompt\n\nTrope: Friends to lovers",
    );
    assert.equal(
      (await storage.listSavedPromptsForUser("user-2", "fanfic")).length,
      1,
    );
    assert.equal(
      (await storage.listSavedPromptsForUser("user-2", "oc")).length,
      0,
    );

    let commandReply;
    await savedPrompts.run({
      user: { id: "user-2" },
      options: {
        getString: () => "fanfic",
        getInteger: () => 1,
      },
      deferReply: async () => {},
      editReply: async (reply) => {
        commandReply = reply;
      },
    });
    assert.equal(commandReply.embeds[0].toJSON().title, "Fanfic prompt saves");
    assert.equal(
      commandReply.components[0].toJSON().components[0].custom_id,
      "saved-prompts:filter:user-2:random:1",
    );

    let displayedPrompt;
    await showSavedPrompt(
      {
        user: { id: "user-2" },
        deferReply: async () => {},
        editReply: async (content) => {
          displayedPrompt = content;
        },
        followUp: async () => {},
      },
      "user-2:message-2",
    );
    assert.match(displayedPrompt, /Friends to lovers/);

    let privateResult;
    await showSavedPrompt(
      {
        user: { id: "user-3" },
        deferReply: async () => {},
        editReply: async (content) => {
          privateResult = content;
        },
        followUp: async () => {},
      },
      "user-2:message-2",
    );
    assert.match(privateResult, /could not be found/);

    await storage.setGuildPrefix("guild-a", null);
    assert.equal(await storage.getGuildPrefix("guild-a"), null);
  } finally {
    if (previousDirectory === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previousDirectory;
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

test("saved prompt buttons filter, paginate, and delete only the owner's saved copy", async () => {
  const dataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "dimsum-browser-"),
  );
  const previousDirectory = process.env.DIMSUM_DATA_DIR;
  process.env.DIMSUM_DATA_DIR = dataDirectory;

  try {
    const basePrompt = {
      userId: "owner",
      username: "test-user",
      displayName: "Test User",
      guildId: "guild-a",
      guildName: "Test Server",
    };
    for (const [sourceMessageId, kind, content, createdAt] of [
      ["older", "oc", "Older OC", "2026-01-01T00:00:00.000Z"],
      ["newer", "oc", "Newer OC", "2026-01-02T00:00:00.000Z"],
      ["fanfic", "fanfic", "A fanfic prompt", "2026-01-03T00:00:00.000Z"],
      [
        "long",
        "otp",
        `${"a".repeat(1949)}😀${"b".repeat(4049)}`,
        "2026-01-04T00:00:00.000Z",
      ],
    ]) {
      await storage.savePrompt({
        ...basePrompt,
        id: `owner:${sourceMessageId}`,
        sourceMessageId,
        kind,
        content,
        createdAt,
      });
    }
    await storage.savePrompt({
      ...basePrompt,
      userId: "someone-else",
      id: "someone-else:older",
      sourceMessageId: "older",
      kind: "oc",
      content: "Their own saved copy",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    let response;
    await savedPrompts.run({
      user: { id: "owner" },
      options: { getString: () => "oc", getInteger: () => 1 },
      deferReply: async (options) => {
        assert.equal(options.flags, MessageFlags.Ephemeral);
      },
      editReply: async (reply) => {
        response = reply;
      },
    });
    const buttons = () =>
      response.components.flatMap((row) => row.toJSON().components);
    const button = (label) => buttons().find((entry) => entry.label === label);
    assert.equal(response.embeds[0].toJSON().description, "Newer OC");
    assert.equal(button("Previous").disabled, true);
    assert.equal(button("Next").disabled, false);
    assert.equal(
      new Set(buttons().map((entry) => entry.custom_id)).size,
      buttons().length,
    );
    assert.ok(buttons().every((entry) => entry.custom_id.length <= 100));
    assert.ok(!buttons().some((entry) => entry.label.startsWith("Open")));

    const click = async (customId, userId = "owner") => {
      await onInteraction({
        customId,
        user: { id: userId },
        isButton: () => true,
        deferUpdate: async () => {},
        editReply: async (reply) => {
          response = reply;
        },
        reply: async (reply) => {
          response = reply;
        },
      });
    };
    const originalNext = button("Next").custom_id;
    await click(originalNext, "someone-else");
    assert.match(response.content, /belong to another user/);
    assert.equal(response.flags, MessageFlags.Ephemeral);
    await click(originalNext);
    assert.equal(response.embeds[0].toJSON().description, "Older OC");
    assert.equal(button("Next").disabled, true);
    const deleteOlder = button("Delete").custom_id;

    await click(button("Fanfic prompt").custom_id);
    assert.equal(response.embeds[0].toJSON().description, "A fanfic prompt");
    await click(button("Other").custom_id);
    assert.match(response.embeds[0].toJSON().description, /no saves/);
    assert.equal(button("Delete").disabled, true);
    assert.ok(button("OC"));
    await click(button("OTP").custom_id);
    const longPrompt = await storage.getSavedPromptForUser(
      "owner",
      "owner:long",
    );
    assert.equal(
      response.content + response.embeds[0].toJSON().description,
      longPrompt.content,
    );
    assert.ok(response.content.length <= 2000);
    assert.ok(response.embeds[0].toJSON().description.length <= 4096);
    assert.equal(
      response.content.charCodeAt(response.content.length - 1),
      "a".charCodeAt(0),
    );
    await click(button("OC").custom_id);
    assert.equal(response.content, null);

    assert.equal(
      await storage.deleteSavedPromptForUser("someone-else", "owner:older"),
      false,
    );
    await click(deleteOlder, "someone-else");
    assert.match(response.content, /belong to another user/);
    assert.ok(await storage.getSavedPromptForUser("owner", "owner:older"));
    await click(deleteOlder);
    assert.equal(response.content, "Saved prompt deleted.");
    assert.equal(response.embeds[0].toJSON().description, "Newer OC");
    assert.equal(button("1 / 1").disabled, true);
    assert.equal(
      await storage.getSavedPromptForUser("owner", "owner:older"),
      null,
    );
    assert.ok(
      await storage.getSavedPromptForUser("someone-else", "someone-else:older"),
    );
    assert.ok(
      !(await storage.listSavedPromptsForGuild("guild-a")).some(
        (prompt) => prompt.id === "owner:older",
      ),
    );
    await click(deleteOlder);
    assert.match(response.content, /already deleted/);
    assert.equal(response.embeds[0].toJSON().description, "Newer OC");
    await click(button("Delete").custom_id);
    assert.match(response.embeds[0].toJSON().description, /no saves/);
    assert.equal(button("Delete").disabled, true);
  } finally {
    if (previousDirectory === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previousDirectory;
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

test("migrates existing version-one saved prompts without data loss", async () => {
  const dataDirectory = await mkdtemp(
    path.join(os.tmpdir(), "dimsum-migrate-"),
  );
  const previousDirectory = process.env.DIMSUM_DATA_DIR;
  process.env.DIMSUM_DATA_DIR = dataDirectory;

  try {
    await writeFile(
      path.join(dataDirectory, "dashboard-data.json"),
      JSON.stringify({
        version: 1,
        guildPrefixes: { "guild-a": "?" },
        reactionRoleMessages: [],
        savedPrompts: [
          {
            id: "user-1:message-1",
            sourceMessageId: "message-1",
            userId: "user-1",
            username: "test-user",
            displayName: "Test User",
            guildId: "guild-a",
            guildName: "Test Server",
            content: "An older saved prompt",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );

    const prompts = await storage.listSavedPromptsForUser("user-1");
    assert.equal(prompts[0].content, "An older saved prompt");
    assert.equal(prompts[0].kind, "other");
    assert.equal(await storage.getGuildPrefix("guild-a"), "?");

    await storage.setGuildPrefix("guild-b", "!");
    const migratedData = JSON.parse(
      await readFile(path.join(dataDirectory, "dashboard-data.json"), "utf8"),
    );
    assert.equal(migratedData.version, 3);
    assert.equal(migratedData.savedPrompts[0].kind, "other");
  } finally {
    if (previousDirectory === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previousDirectory;
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

test("message commands use the configured prefix length for their server", async () => {
  const dataDirectory = await mkdtemp(path.join(os.tmpdir(), "dimsum-prefix-"));
  const previousDirectory = process.env.DIMSUM_DATA_DIR;
  process.env.DIMSUM_DATA_DIR = dataDirectory;

  try {
    await storage.setGuildPrefix("guild-a", "??");
    let response;
    const send = async (content) => {
      response = content;
    };
    const message = {
      author: { bot: false },
      guildId: "guild-a",
      content: "??ping",
      channel: { type: ChannelType.GuildText, send },
    };
    await onMessageCommand(message, "!");
    assert.equal(response, "pong!");
    response = null;
    message.content = "!ping";
    await onMessageCommand(message, "!");
    assert.equal(response, null);
    assert.equal(await storage.getGuildPrefix("guild-a"), "??");
  } finally {
    if (previousDirectory === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previousDirectory;
    await rm(dataDirectory, { recursive: true, force: true });
  }
});
