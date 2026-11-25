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

When dashboard OAuth settings are present, the bot also starts a read-only
Express API. Register the callback URL shown in the root README in the Discord
Developer Portal. Without those settings, the bot still runs and logs that the
dashboard is disabled. See the root README for dashboard startup and deployment
details.

## Random fanfic prompts

Use `/randomprompt` or `/fanficprompt`, optionally providing a ship name. Both
select a prompt, setting, genre, and trope from the bot's built-in lists, then
add three distinct AO3-inspired additional tags. Tags matching the selected
genre or trope are excluded to avoid repetition. The tags are curated locally
in `bot/src/commands/slashCommands/fanficTags.ts`; this does not connect to or
copy data live from AO3.
