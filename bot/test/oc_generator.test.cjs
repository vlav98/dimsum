const assert = require("node:assert/strict");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const { RandomOCGenerator } = require("../src/commands/slashCommands/oc_generator/randomOCGenerator");
const { Heterochromia } = require("../src/types/character/eyeColors");
const { randomizeEyeColor } = require("../src/commands/slashCommands/oc_generator/utils/randomEyeColors");
const { randomizeSpecies } = require("../src/commands/slashCommands/oc_generator/utils/randomSpecies");
const {
  fanficPrompt,
  randomPrompt,
} = require("../src/commands/slashCommands/randomPrompt");
const { CommandList } = require("../src/commands");

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

test("random fanfic prompts include three unique AO3-style additional tags", async () => {
  let reply;
  await randomPrompt.run({
    deferReply: async () => {},
    options: {
      getString: () => null,
    },
    editReply: async ({ embeds }) => {
      reply = embeds[0];
    },
  });

  const fields = reply.toJSON().fields;
  const additionalTags = fields.find(
    ({ name }) => name === "Additional tags (AO3-style)",
  ).value.split(", ");

  assert.equal(additionalTags.length, 3);
  assert.equal(new Set(additionalTags).size, 3);
});

test("fanficprompt is registered as a separate slash command", async () => {
  assert.ok(
    CommandList.some((command) => command.data.name === "fanficprompt"),
  );

  let reply;
  await fanficPrompt.run({
    deferReply: async () => {},
    options: {
      getString: () => null,
    },
    editReply: async ({ embeds }) => {
      reply = embeds[0];
    },
  });

  assert.equal(reply.toJSON().title, "Random Fanfic Prompt Generator");
});
