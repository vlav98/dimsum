# DimSum

DimSum contains a Discord bot and a separate Vite-based dashboard.

## Requirements

- Node.js 22.12+ (or 20.19+)
- npm

## Install

```bash
git clone https://github.com/vlav98/dimsum.git
cd dimsum
npm install
cp bot/.env.example bot/.env
```

Edit `bot/.env` and set your Discord bot token and guild ID. `PREFIX` is
optional and defaults to `!`. To enable the dashboard, also set the Discord
application ID, OAuth client secret, callback URL, and a long random session
secret. Keep both bot and OAuth secrets private; the `.env` file is ignored by
Git.

Enable the **Message Content Intent** for the bot in the Discord Developer
Portal if you want to use prefix-based message commands.

## Start the bot

From the repository root:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

## Source organization

The `bot/` and `dashboard/` workspaces keep their own source and tests.
Dashboard routes live in `dashboard/src/pages/<PageName>/`; page-only
components belong in that page's `components/<ComponentName>/` folder.
Reusable UI belongs in `dashboard/src/components/common/<ComponentName>/`,
with component styles and tests beside it. The app shell lives in `src/app/`.

The bot keeps themed commands under `bot/src/commands/`, reusable generators
under `src/generators/`, and community services under `src/features/`.
Its dashboard API and sessions live in `src/dashboard/`, persistence in
`src/storage/`, and reusable Discord message components in `src/components/common/`.
See the workspace READMEs for details.

## Writing and community commands

Use `/help` to browse the themed command catalog. Existing commands such as
`/ocgen`, `/randomprompt`, `/fanficprompt`, and `/otpprompt` remain available.

| Theme | Commands |
| --- | --- |
| Anti-writer block | `/prompt`, `/ocgen`, `/tag`, `/twist`, `/name` |
| Productivity and sharing | `/challenge`, `/daily`, `/group-prompt` |
| Server games | `/oc-duel` (alias `/matchup`), `/roulette` |
| Personal creations | `/adopt`, `/savedprompts` |

Generators use curated local lists, with no external AI or AO3 connection.
`/daily` is shared for the UTC day. Managers can separately enable automatic
daily posts in the dashboard.
`/adopt` creates a first-claim-wins OC offer and saves the claimed sheet in its
owner's library. `/group-prompt` needs a dedicated channel set by a manager
with `/writing-channel channel:#writing` or **Commands → Productivity & sharing
→ Community writing channel** in the dashboard. The bot needs View Channel, Send Messages,
and Embed Links there. See [the command reference](bot/README.md#writing-tools)
for options and examples.

`/ocgen` accepts optional name, gender, sexuality, species, hair/eye color,
hair length, life status, and heterochromia overrides; blank properties are
randomized. Leave `style` and `section` blank for a quick random OC, or set
either to generate a styled character sheet. Set `omit:true` to open the
private multi-select panel and choose properties to leave out before
generating. `/adopt saved_oc:<your character>` lets you offer one of your saved
OCs to the server. Adoption creates a separate copy for the claimant and
leaves your saved original untouched.

## Start the live dashboard

In the Discord Developer Portal, add this redirect URL under **OAuth2 →
General → Redirects**:

```text
http://localhost:3001/api/auth/callback
```

Set `APP_ID` to your Discord application ID and `DISCORD_CLIENT_SECRET` to the
OAuth2 client secret. Generate a session secret with
`openssl rand -hex 32`, then put the result in `SESSION_SECRET`. The dashboard
uses the `identify` and `guilds` OAuth scopes; it never exposes the client
secret or bot token to the browser. OAuth credentials are separate from the
bot token.

Start the bot (which also starts the dashboard API when these OAuth settings
are present):

```bash
npm start
```

In another terminal, from the repository root, run the Vite frontend:

```bash
npm run start --workspace=dashboard
```

Open <http://localhost:5173> and choose **Continue with Discord**. The Vite
development server forwards `/api` requests to the bot API on port 3001.
`DASHBOARD_PORT` and `DASHBOARD_ORIGIN` can override those local defaults.

The dashboard's sidebar separates **Overview** (bot status and commands) from
**My servers**, which lists only servers where you have Manage Server or
Administrator permission. The entire server card opens its settings when
DimSum is present; cards without the bot are disabled. Each shared server has
separate **Bot settings**, **Commands**, and saved-prompts pages.
**Bot settings** controls the server prefix and the bot's server nickname
(requires Change Nickname permission). **Commands** has a tab per command theme.
Under **Productivity & sharing**, managers can set the community writing channel
and enable a daily story prompt or writing challenge with a channel and UTC
posting time. Schedules survive restarts; if the bot returns after today's
posting time, it sends today's missed post, not a backlog of older days.
Changing the schedule does not send a second post on a day already posted.
Under **Administration & utilities**, managers can create, edit, or delete
reaction-role messages. The channel selector supports search; the emoji picker
offers default and server emojis, and also accepts Unicode or `:emoji_name:`
codes. Editing a message keeps it in its original channel. The bot needs
Manage Roles, access to the selected text channel, and a role hierarchy above
the roles being offered. Editing also needs Read Message History.
The `/reactionroles` slash command provides the same
message-creation feature inside Discord. The bot adds a role when a member
reacts and removes it when they remove their reaction.

Generated prompts include a **Save prompt** button. Users can view their own
saved prompts in the dashboard; managers can also view prompts saved from the
server they manage. **Saved in …** has **My prompts** and **Server prompts**
tabs, both with type filters and deletion controls. Managers may delete any
save originating in that server; users may delete their own saves. DM saves
remain private and are available through **My saved prompts** in the main
navigation. OC generator results can also be saved. In Discord, use
`/savedprompts` to browse your saves, with optional `kind` and `page` filters;
the private browser shows one prompt per page, with type-filter buttons,
**Previous**/**Next** navigation, and **Delete** to remove your current save.
Deleting a save leaves the original generated message intact.
The bot privately confirms visibility when a
prompt is saved. Prefixes, reaction-role mappings, and saved prompts are stored
in the ignored `bot/data/dashboard-data.json` file.

Dashboard sessions persist in `bot/data/sessions` for 30 days of inactivity.
Signing out or revoking Discord access ends a session. The session directory
contains Discord tokens: keep it private, and keep `SESSION_SECRET` stable
across restarts. The file store supports one bot process, not multiple instances.
In production, use HTTPS and set `DISCORD_REDIRECT_URI` and `DASHBOARD_ORIGIN` to
your public HTTPS URLs and build the frontend with
`npm run build --workspace=dashboard`; the bot API serves `dashboard/dist`
when `NODE_ENV=production`.

## Run with Docker

Install Docker with the Compose plugin, then configure the bot environment:

```bash
cp bot/.env.example bot/.env
```

Set `DISCORD_TOKEN` and `GUILD_ID`. To enable the dashboard, also set the
Discord OAuth values (`APP_ID`, `DISCORD_CLIENT_SECRET`,
`DISCORD_REDIRECT_URI`, and `SESSION_SECRET`). Register
`http://localhost:3001/api/auth/callback` in the Discord Developer Portal for
local use and set `DISCORD_REDIRECT_URI` to that value. Leave
`DASHBOARD_ORIGIN` unset (or set it to `http://localhost:3001`); the
development frontend's `http://localhost:5173` is not used by Docker. For a
public deployment, set `DISCORD_REDIRECT_URI` to your public HTTPS callback URL
and `DASHBOARD_ORIGIN` to your public HTTPS dashboard URL, and register that
callback URL in the Discord Developer Portal.

Build and start the bot and production dashboard together:

```bash
docker compose up --build -d
docker compose logs -f
```

The dashboard is available at <http://localhost:3001> when its OAuth settings
are configured. Compose stores dashboard data and login sessions in the
`dimsum-data` volume, so they survive container rebuilds and restarts. Protect
the volume and do not share its session files. Stop the service with
`docker compose down`; the data volume is preserved. Keep `bot/.env` private
and do not add it to the image.

## Other checks

```bash
npm run build
npm test
npm run lint
```
