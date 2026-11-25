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
  let response;
  await RandomOCGenerator.run({
    deferReply: async () => {},
    editReply: async ({ embeds, components }) => {
      reply = embeds[0];
      response = { components };
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
  assert.equal(
    response.components[0].toJSON().components[0].custom_id,
    "save-generated-prompt:oc",
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
  let response;
  await randomPrompt.run({
    deferReply: async () => {},
    options: {
      getString: () => null,
    },
    editReply: async ({ embeds, components }) => {
      reply = embeds[0];
      response = { components };
    },
  });

  const fields = reply.toJSON().fields;
  const additionalTags = fields.find(
    ({ name }) => name === "Additional tags (AO3-style)",
  ).value.split(", ");

  assert.equal(additionalTags.length, 3);
  assert.equal(new Set(additionalTags).size, 3);
  assert.equal(
    response.components[0].toJSON().components[0].custom_id,
    "save-generated-prompt:random",
  );
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

test("reactionroles is registered with Discord's option limit respected", () => {
  const command = CommandList.find(({ data }) => data.name === "reactionroles");
  assert.ok(command);
  assert.ok(command.data.toJSON().options.length <= 25);
});

test("savedprompts is registered with kind filtering and pagination", () => {
  const command = CommandList.find(({ data }) => data.name === "savedprompts");
  assert.ok(command);
  assert.equal(command.data.toJSON().options.length, 2);
});
