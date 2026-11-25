const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const { startDashboardServer } = require("../src/dashboard");
const {
  savePrompt,
  saveReactionRoleMessage,
  listReactionRoleMessages,
  listSavedPromptsForUser,
} = require("../src/storage");
const {
  Collection,
  ChannelType,
  PermissionsBitField,
  PermissionFlagsBits,
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
        json: async () => ({ access_token: "test-access-token" }),
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
    permissions: new PermissionsBitField(PermissionFlagsBits.ManageRoles),
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
