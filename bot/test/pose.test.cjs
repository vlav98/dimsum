const assert = require("node:assert/strict");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const { CommandList } = require("../src/commands");

test("/pose displays an Unsplash photo and handles unavailable results", async (t) => {
  const command = CommandList.find((entry) => entry.data.name === "pose");
  assert.ok(command);
  const previousKey = process.env.UNSPLASH_ACCESS_KEY;
  const previousFetch = global.fetch;
  t.after(() => {
    if (previousKey === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
    else process.env.UNSPLASH_ACCESS_KEY = previousKey;
    global.fetch = previousFetch;
  });

  let response;
  let deferred = false;
  const interaction = {
    reply: async (value) => {
      response = value;
    },
    deferReply: async () => {
      deferred = true;
    },
    editReply: async (value) => {
      response = value;
    },
  };
  delete process.env.UNSPLASH_ACCESS_KEY;
  await command.run(interaction);
  assert.match(response.content, /access key is not configured/);
  assert.equal(response.ephemeral, true);
  assert.equal(deferred, false);

  process.env.UNSPLASH_ACCESS_KEY = "test-key";
  const photo = {
    links: { html: "https://unsplash.com/photos/example" },
    user: {
      name: "Photographer",
      links: { html: "https://unsplash.com/@photographer" },
    },
    urls: { regular: "https://images.unsplash.com/example.jpg" },
  };
  global.fetch = async (url, options) => {
    assert.equal(
      url.href,
      "https://api.unsplash.com/photos/random?query=pose&content_filter=high",
    );
    assert.equal(url.searchParams.get("query"), "pose");
    assert.equal(options.headers.Authorization, "Client-ID test-key");
    return { ok: true, json: async () => photo };
  };
  await command.run(interaction);
  assert.equal(deferred, true);
  const embed = response.embeds[0].toJSON();
  assert.equal(
    embed.url,
    "https://unsplash.com/photos/example?utm_source=dimsum&utm_medium=referral",
  );
  assert.equal(embed.image.url, photo.urls.regular);
  assert.match(
    embed.description,
    /\[Photographer\]\(https:\/\/unsplash\.com\/@photographer\?utm_source=dimsum&utm_medium=referral\)/,
  );
  assert.match(
    embed.description,
    /\[Unsplash\]\(https:\/\/unsplash\.com\/\?utm_source=dimsum&utm_medium=referral\)/,
  );

  global.fetch = async () => ({ ok: false, status: 404 });
  await command.run(interaction);
  assert.match(response, /No pose references/);

  t.mock.method(console, "error", () => {});
  global.fetch = async () => ({ ok: false, status: 429 });
  await command.run(interaction);
  assert.match(response, /Could not fetch/);

  global.fetch = async () => ({ ok: true, json: async () => ({}) });
  await command.run(interaction);
  assert.match(response, /Could not fetch/);
});
