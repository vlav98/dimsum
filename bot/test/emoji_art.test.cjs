const assert = require("node:assert/strict");
const { test } = require("node:test");
const { PNG } = require("pngjs");

require("ts-node/register");
require("tsconfig-paths/register");

const { CommandList, CommandGroups } = require("../src/commands");
const {
  characterEmojiPools,
  emojiPalettes,
} = require("../src/data/generators/emojiArt");
const {
  generateEmojiOC,
  generateEmojiScene,
} = require("../src/generators/emojiArt");

test("emoji OC rolls distinct prompts from the selected genre", (t) => {
  const random = t.mock.method(Math, "random", () => 0);
  for (const [genre, pool] of Object.entries(characterEmojiPools)) {
    for (const count of [3, 4]) {
      for (const value of [0, 0.999]) {
        random.mock.mockImplementation(() => value);
        const result = generateEmojiOC(genre, count);
        assert.equal(result.genre, genre);
        assert.equal(result.prompts.length, count);
        assert.equal(
          new Set(result.prompts.map((item) => item.emoji)).size,
          count,
        );
        result.prompts.forEach((item, index) =>
          assert.ok(Object.values(pool)[index].includes(item.emoji)),
        );
      }
    }
  }
  random.mock.mockImplementation(() => 0);
  assert.equal(generateEmojiOC(null, null).prompts.length, 3);
  random.mock.mockImplementation(() => 0.999);
  assert.equal(generateEmojiOC(null, null).prompts.length, 4);
  assert.throws(() => generateEmojiOC("unknown", 3));
  assert.throws(() => generateEmojiOC("fantasy", 5));
});

test("emoji scene includes a concrete setting, weather, and focal object", async (t) => {
  t.mock.method(Math, "random", () => 0);
  const scene = generateEmojiScene();
  const command = CommandList.find(
    (entry) => entry.data.name === "emoji-scene",
  );
  let response;
  await command.run({
    reply: async (value) => {
      response = value;
    },
  });
  const description = response.embeds[0].toJSON().description;
  for (const item of Object.values(scene)) {
    assert.ok(description.includes(item.emoji));
    assert.ok(description.includes(item.label));
  }
});

test("emoji palette provides a matching image and distinguishes main and accent colors", async (t) => {
  const random = t.mock.method(Math, "random", () => 0);
  const command = CommandList.find(
    (entry) => entry.data.name === "emoji-palette",
  );
  for (const [index, palette] of emojiPalettes.entries()) {
    random.mock.mockImplementation(() => (index + 0.1) / emojiPalettes.length);
    let response;
    await command.run({
      reply: async (value) => {
        response = value;
      },
    });
    const embed = response.embeds[0].toJSON();
    assert.ok(palette.emojis.every((emoji) => embed.title.includes(emoji)));
    assert.deepEqual(embed.description.match(/#[0-9A-F]{6}/g), palette.colors);
    assert.match(embed.description, /70%.*30%/);
    const image = PNG.sync.read(response.files[0].attachment);
    palette.colors.forEach((color, i) => {
      const offset =
        (80 * image.width + Math.floor(((i + 0.5) * image.width) / 5)) * 4;
      assert.equal(
        image.data
          .subarray(offset, offset + 3)
          .toString("hex")
          .toUpperCase(),
        color.slice(1),
      );
    });
  }
});

test("all emoji commands are registered in antiArtBlock and OC options are exposed", async () => {
  const group = CommandGroups.find((entry) => entry.name === "antiArtBlock");
  for (const name of ["emoji-oc", "emoji-palette", "emoji-scene"])
    assert.ok(group.commands.some((command) => command.data.name === name));
  const command = group.commands.find(
    (entry) => entry.data.name === "emoji-oc",
  );
  const options = command.data.toJSON().options;
  assert.deepEqual(
    options
      .find((item) => item.name === "genre")
      .choices.map((item) => item.value),
    ["fantasy", "modern", "sci-fi", "gothic"],
  );
  let response;
  await command.run({
    options: { getString: () => "gothic", getInteger: () => 4 },
    reply: async (value) => {
      response = value;
    },
  });
  assert.match(response.embeds[0].toJSON().description, /gothic/);
  assert.match(response.embeds[0].toJSON().description, /Mood \/ wildcard/);
});
