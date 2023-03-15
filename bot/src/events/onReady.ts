import { REST } from "@discordjs/rest";
import { Client, Routes } from "discord.js";
import { CommandList } from "../commands/index";

export const onReady = async (client: Client) => {
  if (!client.user || !client.application) return;

  console.log(`${client.user.username} is online`);

  const rest = new REST({ version: "9" }).setToken(
    process.env.DISCORD_TOKEN as string
  );

  const commandData = CommandList.map((command) => command.data.toJSON());

  // SERVER COMMANDS
  await rest.put(
    Routes.applicationGuildCommands(
      client.user?.id || "missing id",
      process.env.GUILD_ID as string
    ),
    { body: [] }
  );

  // GLOBAL COMMANDS
  await rest.put(Routes.applicationCommands(client.user?.id || "missing id"), {
    body: commandData,
  });

  console.log("Discord ready!");
};
