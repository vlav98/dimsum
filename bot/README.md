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
The dashboard's **My servers** page lists servers where a user has Administrator
or Manage Server permission. Server-wide saved prompts and settings remain
restricted to managers. Managers may delete saves from their
own server; users may delete their own saves, including private DM saves.
Reaction-role messages can be edited in place in the dashboard. Emoji inputs
accept Unicode, custom emoji mentions, and known default/server `:name:` codes.
The bot needs Read Message History to edit existing messages.

## Writing tools

Run `/help` for commands grouped by theme. All generators use curated local
lists, not an external AI service. New generated results have a **Save prompt**
button and their own type filters in `/savedprompts` and the dashboard.

| Command | Options and behavior |
| --- | --- |
| `/prompt` | Optional `universe` (fantasy, modern, sci-fi, historical, supernatural), `mood`, and `trope`. Filters shape the scenario, rather than only adding labels. |
| `/ocgen` | Optional property overrides; leave any blank to randomize. Leave `style` and `section` blank for a quick random OC, or set either for a styled character sheet. Set `omit:true` to choose properties to leave out before generating. Life status is randomized from alive, deceased, undead, missing, or unknown. |
| `/tag` | Optional `count` from 1–5; draws distinct evocative keywords. |
| `/twist` | Draws a plot twist for a work in progress. |
| `/name` | Optional `style`, `count` from 1–5, and `nickname:true`. Returns distinct suggestions. |
| `/challenge` | Draws a fresh micro-writing task. |
| `/daily` | Everyone gets the same challenge throughout the UTC day, changing at midnight UTC. The curated challenge list cycles; this is not an automatic posting schedule. |
| `/oc-duel` or `/matchup` | Optional `first` and `second` descriptions, including autocomplete for your saved OCs; omitted characters are generated. Optional `situation`: debate, survival, or contest. Members decide the outcome; the bot never picks a winner. |
| `/adopt` | Offers a full OC in a server, optionally choosing its `style` or one of your saved OCs with `saved_oc`. The first member to click **Adopt this OC** permanently claims it. |
| `/group-prompt` | Posts one shared scenario in the server's manager-configured writing channel. |
| `/roulette` | Mixes a trope, location, object, and absurd constraint. |

Examples:

```text
/prompt universe:fantasy mood:hopeful trope:found family
/ocgen style:modern section:personality
/ocgen omit:true
/name style:mysterious count:3 nickname:true
/oc-duel first:Aster, a stubborn gardener second:Vale, a shy archivist situation:debate
```

### Community channel and adoption

A manager must run `/writing-channel channel:#writing` or choose a
**Community writing channel** in the dashboard before `/group-prompt` works.
Only text and announcement channels are supported. The bot needs View Channel,
Send Messages, and Embed Links, and the invoking member must be able to view
and send messages in that channel. Clear the dashboard's channel selection to
disable group prompts. Posting never pings everyone.

An adoption claim and its saved OC are written atomically. Claims survive bot
restarts, and deleting the saved sheet (including manager deletion) does **not**
release the claim. Offers are exclusive, but this is a community claim record,
not an intellectual-property ownership system. Find the adopted sheet through
`/savedprompts kind:oc` or the dashboard. An unclaimed offer has no ordinary
Save button.

Storage now also includes dedicated writing channels and adoption offers.
Existing version-1 and version-2 files migrate without losing prefixes,
reaction-role mappings, or saved prompts. Keep a backup of
`bot/data/dashboard-data.json`.

### Command organization

All slash commands live in camelCase theme folders under
`src/commands/slashCommands`:

| Folder | Commands |
| --- | --- |
| `antiWriterBlock/` | `/prompt`, `/tag`, `/twist`, `/name`, `/randomprompt`, `/fanficprompt`, `/otpprompt`, `/ocgen` |
| `productivityAndSharing/` | `/challenge`, `/daily`, `/group-prompt` |
| `serverGames/` | `/oc-duel`, `/matchup`, `/roulette` |
| `personalCreations/` | `/adopt`, `/savedprompts` |
| `administrationAndUtilities/` | `/writing-channel`, `/reactionroles`, `/help`, `/hello`, `/react` |

Each theme's `index.ts` exports its command list. The parent `index.ts` combines
them into `CommandGroups` and `CommandList`, used by registration, `/help`, and
dashboard categories. OC generator helpers live in
`antiWriterBlock/ocGenerator/utils`; reusable writing generation lives in
`src/generators/writing.ts`. Discord slash-command names and behavior are
unchanged.

## Random fanfic prompts

Use `/randomprompt` or `/fanficprompt`, optionally providing a ship name. Both
select a prompt, setting, genre, and trope from the bot's built-in lists, then
add three distinct AO3-inspired additional tags. Tags matching the selected
genre or trope are excluded to avoid repetition. The tags are curated locally
in `bot/src/commands/slashCommands/antiWriterBlock/fanficTags.ts`; this does not
connect to or copy data live from AO3.

Use the **Save prompt** button on generated prompt replies to save them in the
dashboard. A saved prompt from a server is visible to its author and that
server's managers; a prompt saved in a DM is visible only to its author. The
OC generator has the same save button. In Discord, `/savedprompts` privately
shows one save per page; optionally filter with `kind` (including story prompts,
tags, twists, names, challenges, group prompts, roulette, matchups, and existing
generator types) and select a `page`. Use the type buttons to switch filters and
**Previous**/**Next** to change pages without rerunning the command.
**Delete** removes only your current save, not the original generated message
or another user's saved copy. Deletions also disappear from the dashboard.
