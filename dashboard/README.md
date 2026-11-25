# DimSum dashboard

The dashboard is a read-only React client for the bot's Express API. Install
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

Build it with `npm run build --workspace=dashboard`; with `NODE_ENV=production`,
the bot API serves the built `dashboard/dist` files. The API's default
in-memory session store is for local/single-process use. `npm test` runs the
dashboard tests from the repository root.
