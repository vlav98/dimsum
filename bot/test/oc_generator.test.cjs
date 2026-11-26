const assert = require("node:assert/strict");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const {
  RandomOCGenerator,
} = require("../src/commands/slashCommands/antiWriterBlock/ocGenerator/randomOCGenerator");
const { Heterochromia } = require("../src/types/character/eyeColors");
const {
  randomizeEyeColor,
} = require("../src/commands/slashCommands/antiWriterBlock/ocGenerator/utils/randomEyeColors");
const {
  randomizeSpecies,
} = require("../src/commands/slashCommands/antiWriterBlock/ocGenerator/utils/randomSpecies");
const { generateRandomOC } = require("../src/generators/writing");
const {
  fanficPrompt,
  randomPrompt,
} = require("../src/commands/slashCommands/antiWriterBlock/randomPrompt");
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
  const overrides = {
    name: "Mira",
    gender: "non-binary",
    life_status: "undead",
  };
  await RandomOCGenerator.run({
    deferReply: async () => {},
    options: {
      getString: (name) => overrides[name] ?? null,
      getBoolean: () => null,
    },
    editReply: async ({ embeds, components }) => {
      reply = embeds[0];
      response = { components };
    },
  });

  assert.deepEqual(
    reply.toJSON().fields.map(({ name }) => name),
    [
      "Name",
      "Gender",
      "Species",
      "Sexuality",
      "Hair color",
      "Hair length",
      "Eye color",
      "Heterochromia",
      "Life status",
    ],
  );
  assert.equal(
    response.components[0].toJSON().components[0].custom_id,
    "save-generated-prompt:oc",
  );
  const fields = Object.fromEntries(
    reply.toJSON().fields.map(({ name, value }) => [name, value]),
  );
  assert.equal(fields.Name, "Mira");
  assert.equal(fields.Gender, "non-binary");
  assert.equal(fields["Life status"], "undead");
});

test("OC generator uses supplied properties and randomizes omitted ones", () => {
  const embed = generateRandomOC({
    name: "Mira",
    gender: "non-binary",
    sexuality: "pansexual",
    hairColor: "silver",
    eyeColor: "blue and green",
    lifeStatus: "undead",
    heterochromia: true,
  }).toJSON();
  const fields = Object.fromEntries(
    embed.fields.map(({ name, value }) => [name, value]),
  );

  assert.equal(fields.Name, "Mira");
  assert.equal(fields.Gender, "non-binary");
  assert.equal(fields.Sexuality, "pansexual");
  assert.equal(fields["Hair color"], "silver");
  assert.equal(fields["Eye color"], "blue and green");
  assert.equal(fields.Heterochromia, "YES");
  assert.equal(fields["Life status"], "undead");
  assert.ok(fields.Species);
  assert.ok(fields["Hair length"]);
});

test("OC slash commands expose optional overrides and saved OC adoption autocomplete", () => {
  for (const name of ["oc", "ocgen"]) {
    const command = CommandList.find(({ data }) => data.name === name);
    assert.ok(command);
    const options = command.data.toJSON().options;
    for (const option of [
      "name",
      "gender",
      "sexuality",
      "species",
      "hair_color",
      "hair_length",
      "eye_color",
      "life_status",
      "heterochromia",
    ]) {
      assert.ok(options.some((entry) => entry.name === option));
    }
    assert.ok(options.length <= 25);
  }
  const adopt = CommandList.find(({ data }) => data.name === "adopt");
  assert.equal(
    adopt.data.toJSON().options.find(({ name }) => name === "saved_oc")
      .autocomplete,
    true,
  );
});

test("heterochromia generates two different eye colors", () => {
  const colors = withRandomValues([0, 0, 0.99], () =>
    randomizeEyeColor(Heterochromia.YES),
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
  const additionalTags = fields
    .find(({ name }) => name === "Additional tags (AO3-style)")
    .value.split(", ");

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
