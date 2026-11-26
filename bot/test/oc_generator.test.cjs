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
const { onInteraction } = require("../src/events/onInteraction");

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
  let configuration;
  let response;
  const overrides = {
    name: "Mira",
    gender: "non-binary",
    life_status: "undead",
    style: "modern",
    section: "full",
  };
  await RandomOCGenerator.run({
    deferReply: async () => {},
    options: {
      getString: (name) => overrides[name] ?? null,
      getBoolean: (name) => (name === "omit" ? true : null),
    },
    user: { id: "writer" },
    editReply: async (value) => {
      configuration = value;
    },
  });

  assert.equal(configuration.components.length, 2);
  assert.equal(
    configuration.components[0].toJSON().components[0].options.length,
    15,
  );
  const generateButton = configuration.components[1]
    .toJSON()
    .components.find((component) =>
      component.custom_id.startsWith("oc-generate:"),
    );
  await onInteraction({
    isAutocomplete: () => false,
    isStringSelectMenu: () => false,
    isButton: () => true,
    customId: generateButton.custom_id,
    user: { id: "writer" },
    update: async () => {},
    followUp: async (value) => {
      response = value;
    },
    reply: async (value) => {
      response = value;
    },
  });
  const reply = response.embeds[0];
  const fieldNames = reply.toJSON().fields.map(({ name }) => name);
  for (const field of [
    "Name",
    "Personality",
    "Flaw",
    "Phobia",
    "Aesthetic",
    "Power / role",
    "Secret",
    "Gender",
    "Species",
    "Sexuality",
    "Hair",
    "Eyes",
    "Life status",
  ]) {
    assert.ok(fieldNames.includes(field));
  }
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
  assert.match(fields.Hair, /^Color: silver\nLength: /);
  assert.equal(fields.Eyes, "Color: blue and green\nHeterochromia: YES");
  assert.equal(fields["Life status"], "undead");
  assert.ok(fields.Species);
  assert.match(fields.Hair, /Length: /);
});

test("OC generator omits selected fields while keeping other generated fields", () => {
  const embed = generateRandomOC({
    name: "Mira",
    omit: "name, sexuality, hair color",
  }).toJSON();
  const fields = embed.fields.map(({ name }) => name);

  assert.ok(!fields.includes("Name"));
  assert.ok(!fields.includes("Sexuality"));
  assert.ok(fields.includes("Gender"));
  assert.equal(
    embed.fields.find(({ name }) => name === "Hair").value.split("\n").length,
    1,
  );
  assert.match(
    embed.fields.find(({ name }) => name === "Eyes").value,
    /Color:/,
  );
  assert.ok(fields.includes("Life status"));
  assert.equal(
    generateRandomOC({ omit: "hair_color, hair_length" })
      .toJSON()
      .fields.some(({ name }) => name === "Hair"),
    false,
  );
  assert.throws(
    () => generateRandomOC({ omit: "personality" }),
    /Unknown property to omit/,
  );
});

test("OC generator multiselect omits selected properties and groups hair and eyes", async () => {
  let configuration;
  let updated;
  let result;
  await RandomOCGenerator.run({
    deferReply: async () => {},
    options: {
      getString: (name) =>
        name === "name" ? "Mira" : name === "hair_color" ? "silver" : null,
      getBoolean: (name) => (name === "omit" ? true : null),
    },
    user: { id: "writer" },
    editReply: async (value) => {
      configuration = value;
    },
  });

  const menu = configuration.components[0].toJSON().components[0];
  assert.equal(menu.options.length, 9);
  await onInteraction({
    isAutocomplete: () => false,
    isStringSelectMenu: () => true,
    customId: menu.custom_id,
    values: ["name", "sexuality", "hair_color", "heterochromia"],
    user: { id: "writer" },
    update: async (value) => {
      updated = value;
    },
    reply: async (value) => {
      updated = value;
    },
  });
  assert.ok(
    updated.components[0]
      .toJSON()
      .components[0].options.find(({ value }) => value === "name").default,
  );
  const generateButton = updated.components[1]
    .toJSON()
    .components.find((component) =>
      component.custom_id.startsWith("oc-generate:"),
    );
  await onInteraction({
    isAutocomplete: () => false,
    isStringSelectMenu: () => false,
    isButton: () => true,
    customId: generateButton.custom_id,
    user: { id: "writer" },
    update: async () => {},
    followUp: async (value) => {
      result = value;
    },
    reply: async (value) => {
      result = value;
    },
  });
  const fields = Object.fromEntries(
    result.embeds[0].toJSON().fields.map(({ name, value }) => [name, value]),
  );
  assert.ok(!Object.hasOwn(fields, "Name"));
  assert.ok(!Object.hasOwn(fields, "Sexuality"));
  assert.match(fields.Hair, /^Length: /);
  assert.match(fields.Eyes, /^Color: .+/);
});

test("OC generator exposes unified options and omission is opt-in", async () => {
  const command = CommandList.find(({ data }) => data.name === "ocgen");
  assert.ok(command);
  assert.equal(
    CommandList.some(({ data }) => data.name === "oc"),
    false,
  );
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
    "style",
    "section",
    "omit",
  ]) {
    assert.ok(options.some((entry) => entry.name === option));
  }
  assert.ok(options.length <= 25);

  let deferred = false;
  let response;
  await RandomOCGenerator.run({
    deferReply: async () => {
      deferred = true;
    },
    options: {
      getString: () => null,
      getBoolean: () => null,
    },
    reply: async (value) => {
      response = value;
    },
  });
  assert.equal(deferred, false);
  assert.equal(response.embeds[0].toJSON().title, "Random OC Generator");
  assert.equal(response.components.length, 1);

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
