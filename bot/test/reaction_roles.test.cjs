const assert = require("node:assert/strict");
const { test } = require("node:test");

require("ts-node/register");
require("tsconfig-paths/register");

const {
  PermissionFlagsBits,
  PermissionsBitField,
} = require("discord.js");
const { canBeReactionAssigned } = require("../src/features/reactionRoles/reactionRoles");

function makeRole(rolePermissions, roleId = "role-1") {
  return {
    id: roleId,
    guild: { id: "guild-1" },
    managed: false,
    position: 2,
    permissions: new PermissionsBitField(rolePermissions),
  };
}

test("reaction roles exclude privileged roles and roles above the bot", () => {
  const normalRole = makeRole(0n);
  const administratorRole = makeRole(PermissionFlagsBits.Administrator);

  assert.equal(canBeReactionAssigned(normalRole, 3), true);
  assert.equal(canBeReactionAssigned(normalRole, 2), false);
  assert.equal(canBeReactionAssigned(administratorRole, 3), false);
  assert.equal(canBeReactionAssigned(makeRole(0n, "guild-1"), 3), false);
});
