const assert = require("node:assert/strict");
const { test } = require("node:test");
const { mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

require("ts-node/register");
require("tsconfig-paths/register");

const {
  Collection,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
} = require("discord.js");
const { CommandList, CommandGroups } = require("../src/commands");
const { onInteraction } = require("../src/events/onInteraction");
const {
  generateNames,
  generateOC,
  generatePrompt,
  writingChallenge,
} = require("../src/generators/writing");
const storage = require("../src/storage");

async function invoke(name, values = {}, context = {}) {
  let response;
  const command = CommandList.find((entry) => entry.data.name === name);
  assert.ok(command, `/${name} is registered`);
  const reply = async (value) => {
    response = value;
  };
  await command.run({
    options: {
      getString: (key) => values[key] ?? null,
      getInteger: (key) => values[key] ?? null,
      getBoolean: (key) => values[key] ?? null,
      getChannel: (key) => ({ id: values[key] }),
    },
    user: { id: "writer", username: "writer", globalName: "Writer" },
    deferReply: async () => {},
    editReply: reply,
    reply,
    ...context,
  });
  return response;
}

async function withStore(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dimsum-writing-"));
  const previous = process.env.DIMSUM_DATA_DIR;
  process.env.DIMSUM_DATA_DIR = directory;
  try {
    await run(directory);
  } finally {
    if (previous === undefined) delete process.env.DIMSUM_DATA_DIR;
    else process.env.DIMSUM_DATA_DIR = previous;
    await rm(directory, { recursive: true, force: true });
  }
}

test("story filters affect scenarios and OC sections keep the requested traits", () => {
  const prompt = generatePrompt({
    universe: "modern",
    mood: "cozy",
    trope: "found family",
  }).toJSON();
  assert.match(
    prompt.description,
    /last train|neighborhood cafe|shared apartment/,
  );
  assert.match(prompt.description, /strangers/);
  assert.match(prompt.description, /small act of kindness/);
  assert.deepEqual(
    prompt.fields.map((field) => field.value),
    ["modern", "cozy", "found family"],
  );
  const full = generateOC("modern", "full").toJSON();
  for (const field of [
    "Name",
    "Personality",
    "Flaw",
    "Phobia",
    "Aesthetic",
    "Power / role",
    "Secret",
    "Eye color",
    "Hair color",
  ]) {
    assert.ok(full.fields.some((entry) => entry.name === field));
  }
  const partial = generateOC("fantasy", "personality").toJSON();
  assert.deepEqual(
    partial.fields.map((field) => field.name),
    ["Name", "Personality", "Flaw", "Phobia"],
  );
  const customized = generateOC("modern", "full", {
    name: "Mira",
    gender: "non-binary",
    sexuality: "pansexual",
    eyeColor: "blue and green",
    lifeStatus: "undead",
  }).toJSON();
  const customizedFields = Object.fromEntries(
    customized.fields.map(({ name, value }) => [name, value]),
  );
  assert.equal(customizedFields.Name, "Mira");
  assert.equal(customizedFields.Gender, "non-binary");
  assert.equal(customizedFields.Sexuality, "pansexual");
  assert.equal(customizedFields["Eye color"], "blue and green");
  assert.equal(customizedFields["Heterochromia"], "Custom");
  assert.equal(customizedFields["Life status"], "undead");
  const names = generateNames("modern", 5);
  assert.equal(new Set(names).size, 5);
  const nicknames = generateNames("poetic", 5, true);
  assert.equal(new Set(nicknames).size, 5);
});

test("new generators return saveable results and themed help fits Discord limits", async () => {
  for (const [command, options, kind] of [
    ["prompt", { universe: "fantasy" }, "prompt"],
    ["oc", { section: "background" }, "oc"],
    ["tag", { count: 5 }, "tag"],
    ["twist", {}, "twist"],
    ["name", { style: "mysterious", count: 5, nickname: true }, "name"],
    ["challenge", {}, "challenge"],
    ["daily", {}, "challenge"],
    ["roulette", {}, "roulette"],
    [
      "oc-duel",
      {
        first: "Aster the gardener",
        second: "Vale the archivist",
        situation: "debate",
      },
      "matchup",
    ],
    ["matchup", {}, "matchup"],
  ]) {
    const response = await invoke(command, options);
    assert.ok(response.embeds[0].toJSON().title);
    assert.equal(
      response.components[0].toJSON().components[0].custom_id,
      `save-generated-prompt:${kind}`,
    );
    if (command === "tag")
      assert.equal(
        new Set(response.embeds[0].toJSON().description.split("\n")).size,
        5,
      );
    if (command === "oc-duel") {
      const embed = response.embeds[0].toJSON();
      assert.equal(embed.fields[0].value, options.first);
      assert.equal(embed.fields[1].value, options.second);
      assert.match(embed.fields[2].value, /talking cats/);
      assert.match(embed.footer.text, /No winner/);
    }
  }
  const commands = CommandList.map((command) => command.data.toJSON());
  assert.equal(
    new Set(commands.map((command) => command.name)).size,
    commands.length,
  );
  assert.equal(
    CommandGroups.flatMap((group) => group.commands).length,
    CommandList.length,
  );
  const help = (await invoke("help")).embeds[0].toJSON();
  assert.ok(help.fields.every((field) => field.value.length <= 1024));
  assert.match(
    help.fields.map((field) => field.value).join("\n"),
    /\/writing-channel/,
  );
});

test("daily challenges are stable throughout a UTC day and change at its boundary", () => {
  const early = new Date("2026-11-25T00:00:00Z");
  const late = new Date("2026-11-25T23:59:59Z");
  assert.equal(writingChallenge(early), writingChallenge(late));
  assert.equal(
    writingChallenge(early),
    writingChallenge(new Date("2026-11-25T01:00:00+01:00")),
  );
  assert.notEqual(
    writingChallenge(late),
    writingChallenge(new Date("2026-11-26T00:00:00Z")),
  );
});

test("version-two data migrates and concurrent adoption claims remain exclusive after save deletion", async () => {
  await withStore(async (directory) => {
    await writeFile(
      path.join(directory, "dashboard-data.json"),
      JSON.stringify({
        version: 2,
        guildPrefixes: { guild: "??" },
        reactionRoleMessages: [],
        savedPrompts: [
          {
            id: "existing:save",
            userId: "existing",
            sourceMessageId: "save",
            username: "existing",
            displayName: "Existing",
            guildId: null,
            guildName: null,
            kind: "oc",
            content: "An existing OC",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    );
    assert.equal(await storage.getGuildPrefix("guild"), "??");
    assert.equal(
      (await storage.listSavedPromptsForUser("existing"))[0].kind,
      "oc",
    );
    const offer = {
      id: "offer",
      guildId: "guild",
      guildName: "Guild",
      content: "An OC sheet",
      createdAt: new Date().toISOString(),
      claimedBy: null,
    };
    await storage.createAdoptionOffer(offer);
    const user = (id) => ({ userId: id, username: id, displayName: id });
    assert.equal(
      (
        await storage.claimAdoption(
          "offer",
          "different-guild",
          user("outsider"),
        )
      ).status,
      "missing",
    );
    const claims = await Promise.all([
      storage.claimAdoption("offer", "guild", user("first")),
      storage.claimAdoption("offer", "guild", user("second")),
    ]);
    assert.deepEqual(
      claims.map((claim) => claim.status),
      ["claimed", "already-claimed"],
    );
    assert.equal(
      (await storage.listSavedPromptsForUser("first", "oc")).length,
      1,
    );
    assert.equal((await storage.listSavedPromptsForUser("second")).length, 0);
    await storage.deleteSavedPromptForUser("first", "first:offer");
    assert.equal(
      (await storage.claimAdoption("offer", "guild", user("second"))).status,
      "already-claimed",
    );
    const stored = JSON.parse(
      await readFile(path.join(directory, "dashboard-data.json"), "utf8"),
    );
    assert.equal(stored.adoptionOffers[0].claimedBy, "first");
    assert.equal(stored.version, 3);

    const response = await invoke("savedprompts", { kind: "tag" });
    assert.ok(response.components.length <= 5);
    assert.ok(
      response.components.every((row) => row.toJSON().components.length <= 5),
    );
    assert.ok(
      response.components
        .flatMap((row) => row.toJSON().components)
        .some((button) => button.custom_id.includes(":filter:writer:tag:")),
    );
    const tag = await invoke("tag", { count: 2 });
    await onInteraction({
      customId: "save-generated-prompt:tag",
      isAutocomplete: () => false,
      isButton: () => true,
      message: { id: "tag-message", embeds: [tag.embeds[0].toJSON()] },
      guildId: "guild",
      guild: { name: "Guild" },
      user: { id: "writer", username: "writer", globalName: null },
      deferReply: async () => {},
      editReply: async () => {},
    });
    assert.equal(
      (await storage.listSavedPromptsForUser("writer", "tag")).length,
      1,
    );
  });
});

test("adoption button routing saves the offered sheet and disables further public claims", async () => {
  await withStore(async () => {
    const response = await invoke(
      "adopt",
      { style: "fantasy" },
      {
        guildId: "guild",
        guild: { name: "Guild" },
        fetchReply: async () => ({ id: "offer-message" }),
      },
    );
    assert.equal(
      response.components[0].toJSON().components[0].custom_id,
      "adopt-oc:offer-message",
    );
    let confirmation;
    let publicUpdate;
    const click = {
      customId: "adopt-oc:offer-message",
      isAutocomplete: () => false,
      isButton: () => true,
      guildId: "guild",
      user: { id: "claimant", username: "claimant", globalName: null },
      message: {
        id: "offer-message",
        edit: async (value) => {
          publicUpdate = value;
        },
      },
      deferReply: async () => {},
      editReply: async (value) => {
        confirmation = value;
      },
    };
    await onInteraction(click);
    assert.match(confirmation, /OC adopted/);
    assert.equal(
      publicUpdate.components[0].toJSON().components[0].disabled,
      true,
    );
    const saves = await storage.listSavedPromptsForUser("claimant", "oc");
    assert.match(saves[0].content, /Personality/);
    await onInteraction({
      ...click,
      user: { id: "late", username: "late", globalName: null },
    });
    assert.match(confirmation, /Someone else/);
    assert.equal((await storage.listSavedPromptsForUser("late")).length, 0);
  });
});

test("saved OC autocomplete only offers the caller's OCs and adoption copies the sheet", async () => {
  await withStore(async () => {
    const saveOC = (userId, messageId, name) =>
      storage.savePrompt({
        id: `${userId}:${messageId}`,
        sourceMessageId: messageId,
        userId,
        username: userId,
        displayName: userId,
        guildId: null,
        guildName: null,
        kind: "oc",
        content: `Original character sheet\n\n${name} | fantasy | Full sheet\n\nName: ${name}\n\nGender: non-binary`,
        createdAt: new Date().toISOString(),
      });
    await saveOC("owner", "saved-oc", "Aurora");
    await saveOC("someone-else", "private-oc", "Aurora's twin");

    let choices;
    await onInteraction({
      isAutocomplete: () => true,
      commandName: "adopt",
      options: { getFocused: () => "aurora" },
      user: { id: "owner" },
      respond: async (value) => {
        choices = value;
      },
    });
    assert.deepEqual(
      choices.map(({ value }) => value),
      ["owner:saved-oc"],
    );

    const inaccessible = await invoke(
      "adopt",
      { saved_oc: "owner:saved-oc" },
      {
        user: { id: "someone-else", username: "someone-else" },
        guildId: "guild",
        guild: { name: "Guild" },
      },
    );
    assert.match(inaccessible, /could not be found in your library/);

    const response = await invoke(
      "adopt",
      { saved_oc: "owner:saved-oc" },
      {
        user: { id: "owner", username: "owner", globalName: "Owner" },
        guildId: "guild",
        guild: { name: "Guild" },
        fetchReply: async () => ({ id: "saved-oc-offer" }),
      },
    );
    assert.match(response.embeds[0].toJSON().description, /Name: Aurora/);
    assert.match(
      response.embeds[0].toJSON().footer.text,
      /original owner keeps their saved copy/i,
    );

    let confirmation;
    await onInteraction({
      customId: "adopt-oc:saved-oc-offer",
      isAutocomplete: () => false,
      isButton: () => true,
      guildId: "guild",
      user: { id: "adopter", username: "adopter", globalName: "Adopter" },
      message: { id: "saved-oc-offer", edit: async () => {} },
      deferReply: async () => {},
      editReply: async (value) => {
        confirmation = value;
      },
    });
    assert.match(confirmation, /OC adopted/);
    assert.match(
      (await storage.listSavedPromptsForUser("adopter", "oc"))[0].content,
      /Name: Aurora/,
    );
    assert.equal(
      (await storage.listSavedPromptsForUser("owner", "oc")).length,
      1,
    );
  });
});

test("community prompts require manager configuration and respect posting-channel access", async () => {
  await withStore(async () => {
    let posted;
    let canPost = false;
    const channel = {
      id: "writing",
      type: ChannelType.GuildText,
      guild: { members: { fetch: async () => ({ id: "writer" }) } },
      permissionsFor: (member) =>
        new PermissionsBitField(
          member.id === "bot"
            ? [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
              ]
            : canPost
              ? [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                ]
              : [],
        ),
      send: async (value) => {
        posted = value;
        return { url: "https://discord.com/channels/guild/writing/message" };
      },
    };
    const client = {
      guilds: {
        cache: new Collection([
          [
            "guild",
            {
              members: { me: { id: "bot" } },
              channels: { cache: new Collection([["writing", channel]]) },
            },
          ],
        ]),
      },
    };
    const context = {
      guildId: "guild",
      client,
      memberPermissions: new PermissionsBitField(0n),
    };
    assert.match(
      await invoke("group-prompt", {}, context),
      /dedicated channel/,
    );
    assert.equal(posted, undefined);
    const denied = await invoke(
      "writing-channel",
      { channel: "writing" },
      context,
    );
    assert.match(denied.content, /Manage Server/);
    assert.equal(await storage.getWritingChannel("guild"), null);
    await invoke(
      "writing-channel",
      { channel: "writing" },
      {
        ...context,
        memberPermissions: new PermissionsBitField(
          PermissionFlagsBits.ManageGuild,
        ),
      },
    );
    assert.equal(await storage.getWritingChannel("guild"), "writing");
    assert.match(await invoke("group-prompt", {}, context), /need access/);
    assert.equal(posted, undefined);
    canPost = true;
    assert.match(
      await invoke("group-prompt", {}, context),
      /Community prompt posted/,
    );
    assert.equal(
      posted.components[0].toJSON().components[0].custom_id,
      "save-generated-prompt:group",
    );
    assert.deepEqual(posted.allowedMentions, { parse: [] });
    await storage.setWritingChannel("guild", null);
    assert.equal(await storage.getWritingChannel("guild"), null);
  });
});
