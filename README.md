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

The dashboard is read-only. It lists servers where your account has Manage
Server or Administrator permissions, shows whether DimSum is in each server,
and displays bot connection status and slash commands. The simple in-memory
session store is intended for local/single-process use; use a persistent session
store and HTTPS for a multi-instance production deployment. In production, set
`DISCORD_REDIRECT_URI` and `DASHBOARD_ORIGIN` to your public HTTPS URLs and
build the frontend with `npm run build --workspace=dashboard`; the bot API
serves `dashboard/dist` when `NODE_ENV=production`.

## Other checks

```bash
npm run build
npm test
npm run lint
```
