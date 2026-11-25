const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const { startDashboardServer } = require("../src/dashboard");
const { savePrompt } = require("../src/storage");

const request = globalThis.fetch.bind(globalThis);

test("dashboard OAuth protects API data and returns manageable servers", async () => {
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
        ],
      };
    }
    throw new Error(`Unexpected Discord API request: ${url}`);
  };

  const client = {
    isReady: () => true,
    user: { username: "DimSum" },
    guilds: {
      cache: {
        size: 1,
        has: (guildId) => guildId === "guild-1",
      },
    },
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
      },
    ]);
    assert.equal((await adminPromptsResponse.json()).length, 1);
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
