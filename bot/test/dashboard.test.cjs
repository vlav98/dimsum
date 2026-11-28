const assert = require("node:assert/strict");
const { mkdtemp, rm, stat } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const { startDashboardServer } = require("../src/dashboard/server");
const { DashboardSessionStore } = require("../src/dashboard/sessionStore");
const { CommandGroups } = require("../src/commands");
const {
  savePrompt,
  saveReactionRoleMessage,
  listReactionRoleMessages,
  listSavedPromptsForUser,
  saveArtChallenge,
} = require("../src/storage");
const {
  Collection,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const request = globalThis.fetch.bind(globalThis);

test("dashboard lists all user servers and scopes settings, emoji editing, and prompt deletion", async () => {
  const envKeys = [
    "APP_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
    "SESSION_SECRET",
    "DASHBOARD_PORT",
    "DASHBOARD_ORIGIN",
    "NODE_ENV",
    "DIMSUM_DATA_DIR",
  ];
  const previousEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );
  const dataDirectory = await mkdtemp(path.join(os.tmpdir(), "dimsum-api-"));
  Object.assign(process.env, {
    APP_ID: "test-app-id",
    DISCORD_CLIENT_SECRET: "test-client-secret",
    DISCORD_REDIRECT_URI: "http://localhost:3001/api/auth/callback",
    SESSION_SECRET: "test-session-secret-that-is-long-enough",
    DASHBOARD_PORT: "0",
    DASHBOARD_ORIGIN: "http://localhost:5173",
    NODE_ENV: "test",
    DIMSUM_DATA_DIR: dataDirectory,
  });

  const originalFetch = globalThis.fetch;
  let guildListRequests = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/oauth2/token")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          expires_in: 3600,
        }),
      };
    }
    if (url.endsWith("/users/@me")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: "user-1",
          username: "test-user",
          global_name: "Test User",
          avatar: null,
        }),
      };
    }
    if (url.endsWith("/users/@me/guilds")) {
      guildListRequests += 1;
      if (guildListRequests === 1) {
        return {
          ok: false,
          status: 429,
          headers: { get: () => "0" },
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "guild-1",
            name: "Managed server",
            icon: null,
            permissions: String(1n << 5n),
          },
          {
            id: "guild-2",
            name: "Unmanaged server",
            icon: null,
            permissions: "0",
          },
          {
            id: "guild-3",
            name: "Another managed server",
            icon: null,
            permissions: String(1n << 5n),
          },
        ],
      };
    }
    throw new Error(`Unexpected Discord API request: ${url}`);
  };

  const roleId = "12345678901234567";
  const emojiId = "22345678901234567";
  const botMember = {
    permissions: new PermissionsBitField([
      PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.ChangeNickname,
    ]),
    nickname: null,
    setNickname: async (nickname) => {
      botMember.nickname = nickname;
    },
    roles: { highest: { position: 5 } },
  };
  const reactions = [];
  let editedContent;
  let removedReaction = false;
  let deletedMessage = false;
  const message = {
    id: "message-roles",
    author: { id: "bot-id" },
    react: async (emoji) => {
      reactions.push(emoji);
    },
    edit: async ({ content }) => {
      editedContent = content;
    },
    delete: async () => {
      deletedMessage = true;
    },
    reactions: {
      cache: new Collection([
        [
          "old",
          {
            emoji: { id: null, name: "👍" },
            me: true,
            users: {
              remove: async () => {
                removedReaction = true;
              },
            },
          },
        ],
      ]),
    },
  };
  const channel = {
    id: "channel-1",
    name: "general",
    parent: null,
    type: ChannelType.GuildText,
    permissionsFor: () =>
      new PermissionsBitField([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
      ]),
    messages: { fetch: async () => message },
    send: async () => message,
  };
  const guild = {
    members: { me: botMember },
    channels: { cache: new Collection([["channel-1", channel]]) },
    roles: {
      cache: new Collection([
        [
          roleId,
          {
            id: roleId,
            name: "Member",
            hexColor: "#ffffff",
            managed: false,
            guild: { id: "guild-1" },
            position: 1,
            permissions: new PermissionsBitField(0n),
          },
        ],
      ]),
    },
    emojis: {
      cache: new Collection([
        [
          emojiId,
          {
            id: emojiId,
            name: "dimsum",
            available: true,
            toString: () => `<:dimsum:${emojiId}>`,
            imageURL: () => `https://cdn.discordapp.com/emojis/${emojiId}.png`,
          },
        ],
      ]),
    },
  };
  const client = {
    isReady: () => true,
    user: { id: "bot-id", username: "DimSum" },
    guilds: {
      cache: new Collection([["guild-1", guild]]),
    },
    channels: { cache: new Collection([["channel-1", channel]]) },
    uptime: 60_000,
  };

  let server;
  try {
    await savePrompt({
      id: "user-1:message-1",
      sourceMessageId: "message-1",
      userId: "user-1",
      username: "test-user",
      displayName: "Test User",
      guildId: "guild-1",
      guildName: "Managed server",
      kind: "random",
      content: "A saved prompt",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    for (const [id, guildId] of [
      ["other-user:server-save", "guild-1"],
      ["other-user:elsewhere", "guild-3"],
      ["other-user:dm", null],
    ]) {
      await savePrompt({
        id,
        sourceMessageId: id,
        guildId,
        userId: "other-user",
        username: "other",
        displayName: "Other",
        guildName: guildId,
        kind: "oc",
        content: "Someone else's save",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    }
    await saveReactionRoleMessage({
      guildId: "guild-1",
      channelId: "channel-1",
      messageId: "message-roles",
      content: "Choose your role",
      mappings: [{ emoji: "👍", roleId }],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    server = await startDashboardServer(client);
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const protectedResponse = await request(`${baseUrl}/api/status`);
    assert.equal(protectedResponse.status, 401);

    const loginResponse = await request(`${baseUrl}/api/auth/login`, {
      redirect: "manual",
    });
    assert.equal(loginResponse.status, 302);
    const authorizationUrl = new URL(loginResponse.headers.get("location"));
    assert.equal(authorizationUrl.searchParams.get("scope"), "identify guilds");
    const state = authorizationUrl.searchParams.get("state");
    assert.ok(state);
    const initialCookie = loginResponse.headers.get("set-cookie").split(";")[0];

    const callbackResponse = await request(
      `${baseUrl}/api/auth/callback?code=test-code&state=${state}`,
      { headers: { Cookie: initialCookie }, redirect: "manual" },
    );
    assert.equal(callbackResponse.status, 302);
    assert.equal(
      callbackResponse.headers.get("location"),
      "http://localhost:5173",
    );
    const authenticatedCookie = callbackResponse.headers
      .get("set-cookie")
      .split(";")[0];

    const profileResponse = await request(`${baseUrl}/api/me`, {
      headers: { Cookie: authenticatedCookie },
    });
    assert.deepEqual(await profileResponse.json(), {
      id: "user-1",
      username: "test-user",
      displayName: "Test User",
      avatar: null,
    });

    const cookieOptions = { headers: { Cookie: authenticatedCookie } };
    const [guildResponse, adminPromptsResponse, settingsResponse] =
      await Promise.all([
        request(`${baseUrl}/api/guilds`, cookieOptions),
        request(`${baseUrl}/api/guilds/guild-1/saved-prompts`, cookieOptions),
        request(`${baseUrl}/api/guilds/guild-1/settings`, cookieOptions),
      ]);
    assert.deepEqual(await guildResponse.json(), [
      {
        id: "guild-1",
        name: "Managed server",
        icon: null,
        botPresent: true,
        canManage: true,
      },
      {
        id: "guild-2",
        name: "Unmanaged server",
        icon: null,
        botPresent: false,
        canManage: false,
      },
      {
        id: "guild-3",
        name: "Another managed server",
        icon: null,
        botPresent: false,
        canManage: true,
      },
    ]);
    assert.equal((await adminPromptsResponse.json()).length, 2);
    assert.deepEqual(await settingsResponse.json(), {
      prefix: "!",
      isCustom: false,
    });
    assert.equal(guildListRequests, 2);

    const savePromptsResponse = await request(
      `${baseUrl}/api/me/saved-prompts`,
      { headers: { Cookie: authenticatedCookie } },
    );
    assert.equal((await savePromptsResponse.json()).length, 1);

    const forbiddenPromptsResponse = await request(
      `${baseUrl}/api/guilds/guild-2/saved-prompts`,
      { headers: { Cookie: authenticatedCookie } },
    );
    assert.equal(forbiddenPromptsResponse.status, 403);

    const prefixResponse = await request(
      `${baseUrl}/api/guilds/guild-1/settings/prefix`,
      {
        method: "PUT",
        headers: {
          Cookie: authenticatedCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefix: "??" }),
      },
    );
    assert.deepEqual(await prefixResponse.json(), {
      prefix: "??",
      isCustom: true,
    });

    const change = (route, method, body) =>
      request(`${baseUrl}${route}`, {
        method,
        headers: {
          Cookie: authenticatedCookie,
          "Content-Type": "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const nicknameRoute = "/api/guilds/guild-1/settings/nickname";
    assert.equal(
      (
        await change("/api/guilds/guild-2/settings/nickname", "PUT", {
          nickname: "Not allowed",
        })
      ).status,
      403,
    );
    assert.equal(
      (await change(nicknameRoute, "PUT", { nickname: "x".repeat(33) })).status,
      400,
    );
    assert.equal(
      (await change(nicknameRoute, "PUT", { nickname: "Dumpling" })).status,
      200,
    );
    assert.equal(botMember.nickname, "Dumpling");
    const nicknameReload = await request(
      `${baseUrl}${nicknameRoute}`,
      cookieOptions,
    );
    assert.equal((await nicknameReload.json()).nickname, "Dumpling");
    assert.equal(
      (await change(nicknameRoute, "PUT", { nickname: null })).status,
      200,
    );
    assert.equal(botMember.nickname, null);
    botMember.permissions.remove(PermissionFlagsBits.ChangeNickname);
    assert.equal(
      (await change(nicknameRoute, "PUT", { nickname: "Dumpling" })).status,
      400,
    );
    botMember.permissions.add(PermissionFlagsBits.ChangeNickname);

    const dailyRoute = "/api/guilds/guild-1/settings/daily";
    const schedule = {
      enabled: true,
      channelId: "channel-1",
      time: "14:30",
      kind: "prompt",
    };
    assert.equal(
      (await change("/api/guilds/guild-2/settings/daily", "PUT", schedule))
        .status,
      403,
    );
    assert.equal(
      (await change(dailyRoute, "PUT", { ...schedule, time: "25:00" })).status,
      400,
    );
    assert.equal(
      (await change(dailyRoute, "PUT", { ...schedule, channelId: null }))
        .status,
      400,
    );
    assert.equal(
      (
        await change(dailyRoute, "PUT", {
          ...schedule,
          channelId: "other-server-channel",
        })
      ).status,
      400,
    );
    assert.equal((await change(dailyRoute, "PUT", schedule)).status, 200);
    assert.deepEqual(
      await (await request(`${baseUrl}${dailyRoute}`, cookieOptions)).json(),
      { ...schedule, lastPostedDate: null },
    );
    assert.equal(
      (
        await change(dailyRoute, "PUT", {
          ...schedule,
          enabled: false,
          channelId: "deleted-channel",
        })
      ).status,
      200,
    );

    const commandResponse = await request(
      `${baseUrl}/api/commands`,
      cookieOptions,
    );
    const commands = await commandResponse.json();
    assert.ok(
      commands.some(
        (command) =>
          command.name === "prompt" && command.category === "antiArtBlock",
      ),
    );
    const paletteCommand = commands.find((command) => command.name === "palette");
    assert.equal(commands.find((command) => command.name === "draw-this-in-palette").category, "antiArtBlock");
    assert.equal(paletteCommand.options[0].name, "count");
    assert.equal(paletteCommand.options[0].min_value, 2);
    assert.equal(paletteCommand.options[0].max_value, 8);
    for (const name of ["emoji-oc", "emoji-palette", "emoji-scene"])
      assert.equal(commands.find((command) => command.name === name).category, "antiArtBlock");
    const emojiOC = commands.find((command) => command.name === "emoji-oc");
    assert.deepEqual(emojiOC.options.find((option) => option.name === "genre").choices.map((choice) => choice.value), ["fantasy", "modern", "sci-fi", "gothic"]);
    const group = CommandGroups[0];
    group.commands.push({
      data: new SlashCommandBuilder().setName("new-catalog-command")
        .setDescription("A newly registered command")
        .addIntegerOption((option) => option.setName("size").setDescription("How many").setMinValue(2).setMaxValue(8)),
      run: async () => {},
    });
    try {
      const updated = await (await request(`${baseUrl}/api/commands`, cookieOptions)).json();
      const added = updated.find((command) => command.name === "new-catalog-command");
      assert.equal(added.category, group.name);
      assert.equal(added.options[0].name, "size");
      assert.equal(added.options[0].max_value, 8);
    } finally {
      group.commands.pop();
    }

    let refEmbed = new EmbedBuilder().setImage("https://images.unsplash.com/test");
    const refMessage = {
      get embeds() { return [refEmbed]; },
      edit: async ({ embeds }) => { if (embeds) refEmbed = embeds[0]; },
    };
    let starterEmbed = new EmbedBuilder().setDescription(
      "Reference hidden: <t:2000000000:F> (<t:2000000000:R>)\nSubmission deadline: <t:2000003600:F> (<t:2000003600:R>)",
    );
    const messages = [];
    const artThread = {
      guildId: "guild-1",
      isThread: () => true,
      messages: { fetch: async () => refMessage },
      fetchStarterMessage: async () => ({
        embeds: [starterEmbed],
        edit: async ({ embeds }) => { starterEmbed = embeds[0]; },
      }),
      send: async (payload) => { messages.push(payload); },
    };
    client.channels.fetch = async () => artThread;
    await saveArtChallenge({
      guildId: "guild-1", threadId: "thread-1", referenceMessageId: "ref",
      hideAt: 2000000000000, endAt: 2000003600000, hidden: false,
    });
    await saveArtChallenge({
      guildId: "guild-2", threadId: "thread-2", referenceMessageId: "ref",
      hideAt: 2000000000000, endAt: 2000003600000, hidden: false,
    });
    const artRoute = "/api/guilds/guild-1/art-challenges";
    assert.equal((await request(`${baseUrl}${artRoute}`)).status, 401);
    assert.equal((await request(`${baseUrl}${artRoute}/history`)).status, 401);
    assert.equal((await request(`${baseUrl}${artRoute}/thread-1/participants`)).status, 401);
    assert.equal((await request(`${baseUrl}${artRoute}/thread-1/deadlines`, { method: "PUT" })).status, 401);
    assert.equal((await request(`${baseUrl}${artRoute}/thread-1/hide`, { method: "POST" })).status, 401);
    assert.equal((await request(`${baseUrl}/api/guilds/guild-2/art-challenges`, cookieOptions)).status, 403);
    assert.equal((await change("/api/guilds/guild-2/art-challenges/thread-2/end", "POST")).status, 403);
    assert.equal((await request(`${baseUrl}/api/guilds/guild-2/art-challenges/history`, cookieOptions)).status, 403);
    assert.equal((await request(`${baseUrl}/api/guilds/guild-2/art-challenges/thread-2/participants`, cookieOptions)).status, 403);
    assert.equal((await change("/api/guilds/guild-2/art-challenges/thread-2/deadlines", "PUT", { hideAt: 1, endAt: 2 })).status, 403);
    const artList = await (await request(`${baseUrl}${artRoute}`, cookieOptions)).json();
    assert.equal(artList.length, 1);
    assert.equal(artList[0].threadId, "thread-1");
    assert.equal(artList[0].referenceMessageId, undefined);
    assert.equal((await change(`${artRoute}/thread-2/hide`, "POST")).status, 404);
    assert.equal((await change(`${artRoute}/thread-1/unknown`, "POST")).status, 400);
    assert.equal((await change(`${artRoute}/thread-1/hide`, "POST")).status, 204);
    assert.equal(EmbedBuilder.from(refEmbed).toJSON().image, undefined);
    assert.equal((await change(`${artRoute}/thread-1/hide`, "POST")).status, 409);
    assert.equal((await change(`${artRoute}/thread-1/end`, "POST")).status, 204);
    assert.equal((await (await request(`${baseUrl}${artRoute}`, cookieOptions)).json()).length, 0);
    assert.match(messages.at(-1).content, /ended this challenge early/);
    const writingResponse = await request(
      `${baseUrl}/api/guilds/guild-1/settings/writing`,
      cookieOptions,
    );
    const writing = await writingResponse.json();
    assert.equal(writing.channelId, null);
    assert.equal(writing.channels[0].id, "channel-1");
    assert.equal(
      (
        await change("/api/guilds/guild-2/settings/writing", "PUT", {
          channelId: "channel-1",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await change("/api/guilds/guild-1/settings/writing", "PUT", {
          channelId: "other-server-channel",
        })
      ).status,
      400,
    );
    const writingUpdate = await change(
      "/api/guilds/guild-1/settings/writing",
      "PUT",
      { channelId: "channel-1" },
    );
    assert.equal(writingUpdate.status, 200);
    assert.deepEqual(await writingUpdate.json(), { channelId: "channel-1" });
    const writingReload = await request(
      `${baseUrl}/api/guilds/guild-1/settings/writing`,
      cookieOptions,
    );
    assert.equal((await writingReload.json()).channelId, "channel-1");
    assert.equal(
      (
        await change("/api/guilds/guild-1/settings/writing", "PUT", {
          channelId: null,
        })
      ).status,
      200,
    );
    const emojisResponse = await request(
      `${baseUrl}/api/guilds/guild-1/emojis`,
      cookieOptions,
    );
    const emojis = await emojisResponse.json();
    assert.ok(
      emojis.some((emoji) => emoji.name === "heart" && emoji.value === "❤️"),
    );
    assert.ok(
      emojis.some(
        (emoji) =>
          emoji.name === "dimsum" && emoji.value === `<:dimsum:${emojiId}>`,
      ),
    );
    assert.equal(
      (await request(`${baseUrl}/api/guilds/guild-2/emojis`, cookieOptions))
        .status,
      403,
    );
    const updateBody = {
      content: "Updated role message",
      mappings: [
        { emoji: ":heart:", roleId },
        { emoji: ":dimsum:", roleId },
      ],
    };
    assert.equal(
      (
        await change(
          "/api/guilds/guild-2/reaction-roles/message-roles",
          "PUT",
          updateBody,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-3/reaction-roles/message-roles",
          "PUT",
          updateBody,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/reaction-roles/message-roles",
          "PUT",
          { ...updateBody, mappings: [{ emoji: ":does_not_exist:", roleId }] },
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/reaction-roles/message-roles",
          "PUT",
          {
            ...updateBody,
            mappings: [
              { emoji: ":heart:", roleId },
              { emoji: "❤️", roleId },
            ],
          },
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/reaction-roles/message-roles",
          "PUT",
          updateBody,
        )
      ).status,
      204,
    );
    assert.equal(editedContent, "Updated role message");
    assert.deepEqual(reactions, ["❤️", `<:dimsum:${emojiId}>`]);
    assert.equal(removedReaction, true);
    const edited = (await listReactionRoleMessages("guild-1"))[0];
    assert.equal(edited.content, updateBody.content);
    assert.equal(edited.channelId, "channel-1");
    assert.deepEqual(
      edited.mappings.map(({ emoji }) => emoji),
      reactions,
    );

    assert.equal(
      (await change("/api/me/saved-prompts/other-user%3Aserver-save", "DELETE"))
        .status,
      404,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-2/saved-prompts/other-user%3Aserver-save",
          "DELETE",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/saved-prompts/other-user%3Aelsewhere",
          "DELETE",
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/saved-prompts/other-user%3Adm",
          "DELETE",
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/saved-prompts/other-user%3Aserver-save",
          "DELETE",
        )
      ).status,
      204,
    );
    assert.equal((await listSavedPromptsForUser("other-user")).length, 2);
    assert.equal(
      (await change("/api/me/saved-prompts/user-1%3Amessage-1", "DELETE"))
        .status,
      204,
    );
    assert.equal((await listSavedPromptsForUser("user-1")).length, 0);
    assert.equal(
      (
        await change(
          "/api/guilds/guild-1/reaction-roles/message-roles",
          "DELETE",
        )
      ).status,
      204,
    );
    assert.equal(deletedMessage, true);
    assert.deepEqual(await listReactionRoleMessages("guild-1"), []);
    assert.equal(
      (
        await change("/api/guilds/guild-1/reaction-roles", "POST", {
          channelId: "channel-1",
          content: "Published from a code",
          mappings: [{ emoji: ":dimsum:", roleId }],
        })
      ).status,
      201,
    );
    assert.equal(
      (await listReactionRoleMessages("guild-1"))[0].mappings[0].emoji,
      `<:dimsum:${emojiId}>`,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(dataDirectory, { recursive: true, force: true });
  }
});

test("dashboard sessions survive restart, refresh tokens, and end on logout", async () => {
  const keys = [
    "APP_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
    "SESSION_SECRET",
    "DASHBOARD_PORT",
    "DASHBOARD_ORIGIN",
    "NODE_ENV",
    "DIMSUM_DATA_DIR",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const directory = await mkdtemp(path.join(os.tmpdir(), "dimsum-session-"));
  Object.assign(process.env, {
    APP_ID: "test-app-id",
    DISCORD_CLIENT_SECRET: "test-client-secret",
    DISCORD_REDIRECT_URI: "http://localhost:3001/api/auth/callback",
    SESSION_SECRET: "test-session-secret-that-is-long-enough",
    DASHBOARD_PORT: "0",
    DASHBOARD_ORIGIN: "http://localhost:3001",
    NODE_ENV: "production",
    DIMSUM_DATA_DIR: directory,
  });

  const originalFetch = globalThis.fetch;
  let refreshes = 0;
  let rejectRefresh = false;
  globalThis.fetch = async (input, options) => {
    const url = String(input);
    if (url.endsWith("/oauth2/token")) {
      const refresh = options.body.get("grant_type") === "refresh_token";
      if (refresh) {
        assert.equal(options.body.get("refresh_token"), "refresh-initial");
        refreshes++;
        if (rejectRefresh) return { ok: false, status: 400 };
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      return {
        ok: true,
        json: async () => ({
          access_token: refresh ? "access-refreshed" : "access-initial",
          refresh_token: refresh ? "refresh-rotated" : "refresh-initial",
          expires_in: refresh ? 3600 : 1,
        }),
      };
    }
    if (url.endsWith("/users/@me")) {
      return {
        ok: true,
        json: async () => ({
          id: "session-user",
          username: "test",
          global_name: null,
          avatar: null,
        }),
      };
    }
    throw new Error(`Unexpected Discord API request: ${url}`);
  };
  const client = {
    isReady: () => true,
    user: { username: "DimSum" },
    guilds: { cache: new Collection() },
    uptime: 0,
  };
  let server;
  const close = async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    server = undefined;
  };
  const baseUrl = () => `http://127.0.0.1:${server.address().port}`;
  try {
    server = await startDashboardServer(client);
    assert.equal(
      (await stat(path.join(directory, "sessions"))).mode & 0o777,
      0o700,
    );
    const login = await request(`${baseUrl()}/api/auth/login`, {
      redirect: "manual",
    });
    const loginCookie = login.headers.get("set-cookie");
    assert.ok(loginCookie);
    assert.doesNotMatch(loginCookie, /;\s*secure/i);
    const expires = loginCookie.match(/expires=([^;]+)/i);
    assert.ok(expires);
    assert.ok(Date.parse(expires[1]) - Date.now() > 29 * 24 * 60 * 60 * 1000);
    const state = new URL(login.headers.get("location")).searchParams.get(
      "state",
    );
    const callback = await request(
      `${baseUrl()}/api/auth/callback?code=code&state=${state}`,
      {
        redirect: "manual",
        headers: { Cookie: loginCookie.split(";")[0] },
      },
    );
    assert.equal(callback.status, 302);
    const cookie = callback.headers.get("set-cookie").split(";")[0];
    await close();
    server = await startDashboardServer(client);

    const responses = await Promise.all(
      ["/api/me", "/api/status", "/api/commands"].map((route) =>
        request(`${baseUrl()}${route}`, { headers: { Cookie: cookie } }),
      ),
    );
    assert.deepEqual(
      responses.map((response) => response.status),
      [200, 200, 200],
    );
    assert.equal(refreshes, 1);
    await close();
    server = await startDashboardServer(client);
    const me = await request(`${baseUrl()}/api/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(me.status, 200);
    assert.equal(refreshes, 1);
    assert.equal(
      (
        await request(`${baseUrl()}/api/auth/logout`, {
          method: "POST",
          headers: { Cookie: cookie },
        })
      ).status,
      204,
    );
    assert.equal(
      (
        await request(`${baseUrl()}/api/me`, {
          headers: { Cookie: cookie },
        })
      ).status,
      401,
    );
    rejectRefresh = true;
    const newLogin = await request(`${baseUrl()}/api/auth/login`, {
      redirect: "manual",
    });
    const newState = new URL(newLogin.headers.get("location")).searchParams.get(
      "state",
    );
    const newCallback = await request(
      `${baseUrl()}/api/auth/callback?code=code&state=${newState}`,
      {
        redirect: "manual",
        headers: { Cookie: newLogin.headers.get("set-cookie").split(";")[0] },
      },
    );
    const rejectedCookie = newCallback.headers.get("set-cookie").split(";")[0];
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(`${baseUrl()}/api/me`, {
        headers: { Cookie: rejectedCookie },
      });
      assert.equal(response.status, 401);
    }
    await close();
    process.env.DASHBOARD_ORIGIN = "https://dashboard.example.com";
    server = await startDashboardServer(client);
    const secureLogin = await request(`${baseUrl()}/api/auth/login`, {
      redirect: "manual",
      headers: { "X-Forwarded-Proto": "https" },
    });
    assert.match(secureLogin.headers.get("set-cookie"), /;\s*secure/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (server) await close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("a stale request cannot restore a destroyed dashboard session", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dimsum-store-"));
  try {
    const store = new DashboardSessionStore(directory, 60);
    const set = () =>
      new Promise((resolve, reject) =>
        store.set("session-id", { cookie: {} }, (error) =>
          error ? reject(error) : resolve(),
        ),
      );
    await set();
    await new Promise((resolve, reject) =>
      store.destroy("session-id", (error) =>
        error ? reject(error) : resolve(),
      ),
    );
    await assert.rejects(set(), /destroyed dashboard session/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
