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
optional and defaults to `!`. Keep the token private; the `.env` file is
ignored by Git.

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

## Start the dashboard

In a separate terminal, from the repository root:

```bash
npm run start --workspace=dashboard
```

Open the local URL printed by Vite (by default, <http://localhost:5173>). The
dashboard is currently a frontend scaffold and does not connect to the bot.

## Other checks

```bash
npm run build
npm test
npm run lint
```
