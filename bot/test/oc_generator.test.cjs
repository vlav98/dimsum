const assert = require("node:assert/strict");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const { RandomOCGenerator } = require("../src/commands/slashCommands/oc_generator/randomOCGenerator");
const { Heterochromia } = require("../src/types/character/eyeColors");
const { randomizeEyeColor } = require("../src/commands/slashCommands/oc_generator/utils/randomEyeColors");
const { randomizeSpecies } = require("../src/commands/slashCommands/oc_generator/utils/randomSpecies");

function withRandomValues(values, action) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => values[index++] ?? values.at(-1);

  try {
    return action();
  } finally {
    Math.random = originalRandom;
  }
}

test("OC generator includes every defined character trait", async () => {
  let reply;
  await RandomOCGenerator.run({
    deferReply: async () => {},
    editReply: async ({ embeds }) => {
      reply = embeds[0];
    },
  });

  assert.deepEqual(
    reply.toJSON().fields.map(({ name }) => name),
    [
      "Gender",
      "Species",
      "Sexuality",
      "Hair color",
      "Hair length",
      "Eye color",
      "Heterochromia",
    ],
  );
});

test("heterochromia generates two different eye colors", () => {
  const colors = withRandomValues(
    [0, 0, 0.99],
    () => randomizeEyeColor(Heterochromia.YES),
  );

  assert.equal(colors.length, 2);
  assert.notEqual(colors[0], colors[1]);
});

test("half-species generation chooses two distinct sub-species", () => {
  const species = withRandomValues([0.99, 0, 0, 0.99], randomizeSpecies);

  assert.equal(species, "Half Elf & Half Deity");
});
