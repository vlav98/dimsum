const assert = require("node:assert/strict");
const { test } = require("node:test");
const { PNG } = require("pngjs");

require("ts-node/register");
require("tsconfig-paths/register");

const { CommandList } = require("../src/commands");
const { generatePalette } = require("../src/generators/palette");

test("palettes have the requested number of distinct colors for each harmony", (t) => {
  const random = t.mock.method(Math, "random", () => 0);
  for (let count = 2; count <= 8; count++) {
    const harmonies =
      count === 2
        ? ["Monochromatic", "Complementary"]
        : [
            "Monochromatic",
            "Analogous",
            "Complementary",
            "Split-complementary",
            "Triadic",
          ];
    for (const [index, harmony] of harmonies.entries()) {
      random.mock.mockImplementation(() => (index + 0.1) / harmonies.length);
      const palette = generatePalette(count);
      assert.equal(palette.harmony, harmony);
      assert.equal(palette.colors.length, count);
      assert.equal(new Set(palette.colors).size, count);
      assert.ok(palette.colors.every((color) => /^#[0-9A-F]{6}$/.test(color)));
    }
  }
  assert.throws(() => generatePalette(1), RangeError);
  assert.throws(() => generatePalette(9), RangeError);
});

test("/palette responds with matching swatches and hex codes", async (t) => {
  const command = CommandList.find((entry) => entry.data.name === "palette");
  assert.ok(command);
  const option = command.data.toJSON().options[0];
  assert.equal(option.min_value, 2);
  assert.equal(option.max_value, 8);

  const random = t.mock.method(Math, "random", () => 0);
  for (const [count, expected, randomValue] of [
    [null, 2, 0],
    [null, 8, 0.999],
    [2, 2, 0.999],
    [8, 8, 0],
  ]) {
    random.mock.mockImplementation(() => randomValue);
    let response;
    await command.run({
      options: { getInteger: () => count },
      reply: async (value) => {
        response = value;
      },
    });
    const embed = response.embeds[0].toJSON();
    const colors = embed.description.match(/#[0-9A-F]{6}/g);
    assert.equal(colors.length, expected);
    assert.equal(embed.image.url, "attachment://palette.png");
    const image = PNG.sync.read(response.files[0].attachment);
    assert.equal(response.files[0].name, "palette.png");
    colors.forEach((color, index) => {
      const x = Math.floor(((index + 0.5) * image.width) / colors.length);
      const pixel = (Math.floor(image.height / 2) * image.width + x) * 4;
      assert.equal(
        image.data
          .subarray(pixel, pixel + 3)
          .toString("hex")
          .toUpperCase(),
        color.slice(1),
      );
    });
  }
});
