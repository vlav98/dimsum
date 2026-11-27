# DimSum dashboard

The dashboard is a React client for the bot's Express API. Install
dependencies from the repository root with `npm install`, configure the
dashboard OAuth variables in `bot/.env` (see the root README), and start the
bot:

```bash
npm start
```

In a second terminal, start the Vite development server:

```bash
npm run start --workspace=dashboard
```

Open <http://localhost:5173> and sign in with Discord. Vite proxies `/api`
requests to the bot on port 3001. The dashboard needs OAuth `identify` and
`guilds` scopes. It does not expose OAuth secrets to the frontend.

The dark dashboard has sidebar navigation for **Overview** and **My servers**.
Overview shows bot status and commands grouped by theme. **My servers** lists only
servers where you have Administrator or Manage Server permission and indicates
whether DimSum is added. Click anywhere on an enabled server card to open its
settings; cards for servers without the bot are disabled.
Open a shared server to access its separate pages:

- **Bot settings** (Manage Server or Administrator required): change the
  prefix and the bot's server nickname.
- **Commands** (Manage Server or Administrator required): browse theme tabs
  and command options and configure their commands. The catalog is generated
  from registered slash-command definitions; restart the bot and refresh the
  dashboard after adding a command. New custom management panels still need
  to be implemented separately. Create/edit/delete reaction-role messages.
  Search for a channel,
  choose default or server emojis, or type Unicode or `:emoji_name:` codes.
  Edited messages stay in their original channels. Existing assigned roles
  are not retroactively changed, and other members' old reactions are retained.
  **Community writing channel** selects the dedicated destination for
  `/group-prompt`. Only managers can change it; select the disabled option and
  save to stop community prompt posting. The bot needs View Channel, Send
  Messages, and Embed Links in the selected channel.
  **Automatic daily posts** schedules a story prompt or writing challenge
  in a chosen channel at a UTC time.
  Under **antiArtBlock**, **Drawing challenges** lists active `/draw-this-in-palette` threads and lets
  managers edit deadlines, hide a reference, or end a challenge early. Completed
  challenges are recorded from this update onward. Participant counts include
  unique non-bot users with an attachment posted by the deadline; deleted
  messages are not counted. Ending announces the deadline but does not lock the
  thread; images already saved cannot be recalled.
- **Saved in …**: **My prompts** lists your own saves from that server;
  **Server prompts** lets managers view and delete any member's saves from that
  server. Both tabs support generator-type filters and deletion with confirmation.

**My saved prompts** in the sidebar's library section includes all your saves, including
private DM saves. Deletion removes the saved entry, not the original Discord
message or someone else's saved copy. Page links use URL hashes, so browser
Back/Forward and reloading work without extra server routing configuration.

The bot needs Manage Roles and the appropriate channel permissions to publish
reaction-role messages, plus Read Message History for editing. Its highest role must be above the offered roles;
administrator and moderation roles are excluded from self-assignment.
Per-server prefixes, reaction-role mappings, saved prompts, writing channels,
and exclusive OC adoption claims persist in
`bot/data/dashboard-data.json` (ignored by Git). Back up that file if you want
to retain the data.

Build it with `npm run build --workspace=dashboard`; with `NODE_ENV=production`,
the bot API serves the built `dashboard/dist` files. API sessions persist in
`bot/data/sessions` for 30 days of inactivity and support one bot process.
`npm test` runs the dashboard tests from the repository root.

## Source layout

```text
src/
  app/                          App shell, routing, and integration tests
    components/                 Header, sidebar, and route content
    hooks/                      Authentication/data loading and hash routing
    tests/                      Integration tests grouped by feature
  components/common/
    ChannelCombobox/            Shared searchable channel selector
  lib/                          API client
  pages/
    BotSettings/
    Commands/
      components/
        DailyPostSettings/
        EmojiInput/
    Login/
    Overview/
    SavedPrompts/
    Servers/
      components/ServerList/
  styles/                       Global base styles
  test/                         Shared test setup and dashboard API fixtures
  types/                        Shared dashboard types
```

Give each component its own named folder. Place reusable components under
`components/common/<ComponentName>/` and page-specific ones under
`pages/<PageName>/components/<ComponentName>/`. Keep component-specific styles
and unit tests alongside the component; app-wide styles stay in `app/App.css`.
Keep stateful page logic in that page's `hooks/` folder and reusable UI in
`components/common/`. Shared components include feedback, loading/retry states,
tabs, setting forms, command lists, and the channel combobox.

Dashboard palette and semantic color tokens live in `src/styles/theme.css`.
The light theme uses peach and mint surfaces, pink and teal primary accents,
and pastel highlights with dark text. Change the tokens there rather than
adding hardcoded colors to individual component styles.

UI icons use `iconoir-react`. Import icons by name and keep decorative icons
hidden from assistive technology; icon-only buttons still need an accessible label.

Every dashboard `.tsx` file, including tests, is limited to **100 lines**.
Extract coherent subcomponents or hooks rather than compressing formatting.
`npm run lint` from the repository root enforces the limit alongside bot
linting; `npm run lint --workspace=dashboard` checks just the dashboard.
