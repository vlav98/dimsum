# DimSum Discord bot

Install dependencies from the repository root with `npm install`. Copy
`bot/.env.example` to `bot/.env` and set:

- `DISCORD_TOKEN`: the bot token from the Discord Developer Portal
- `GUILD_ID`: the development server ID used for guild command registration
- `PREFIX`: optional message-command prefix; defaults to `!`
- `APP_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, and
  `SESSION_SECRET`: required to enable the optional Discord dashboard
- `DASHBOARD_PORT` and `DASHBOARD_ORIGIN`: optional dashboard settings

Keep the bot token private. Start the bot from the repository root with
`npm start`; use `npm run dev` for automatic restarts while developing.

When dashboard OAuth settings are present, the bot also starts an Express API.
Register the callback URL shown in the root README in the Discord Developer
Portal. Without those settings, the bot still runs and logs that the dashboard
is disabled. See the root README for dashboard startup, feature permissions,
and deployment details.

The dashboard stores per-server prefixes, reaction-role message mappings, and
saved prompts in `bot/data/dashboard-data.json`. Keep this file private and
back it up if you need to preserve those settings. Manage Server permission is
required to change a server's dashboard settings.

## Random fanfic prompts

Use `/randomprompt` or `/fanficprompt`, optionally providing a ship name. Both
select a prompt, setting, genre, and trope from the bot's built-in lists, then
add three distinct AO3-inspired additional tags. Tags matching the selected
genre or trope are excluded to avoid repetition. The tags are curated locally
in `bot/src/commands/slashCommands/fanficTags.ts`; this does not connect to or
copy data live from AO3.

Use the **Save prompt** button on generated prompt replies to save them in the
dashboard. A saved prompt from a server is visible to its author and that
server's managers; a prompt saved in a DM is visible only to its author. The
OC generator has the same save button. In Discord, `/savedprompts` privately
shows one save per page; optionally filter with `kind` (random, fanfic, OTP, OC,
or other) and select a `page`. Use the type buttons to switch filters and
**Previous**/**Next** to change pages without rerunning the command.
**Delete** removes only your current save, not the original generated message
or another user's saved copy. Deletions also disappear from the dashboard.
