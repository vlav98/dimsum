import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import { Client, PermissionFlagsBits } from "discord.js";
import { CommandList } from "./commands";

interface DashboardUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
}

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    accessToken?: string;
    user?: DashboardUser;
  }
}

const apiBaseUrl = "https://discord.com/api/v10";
const sessionCookieName = "dimsum.sid";
const sessionMaxAgeMs = 8 * 60 * 60 * 1000;

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function requireLogin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.accessToken || !req.session.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  next();
}

export async function startDashboardServer(
  client: Client
): Promise<Server | undefined> {
  const { APP_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, SESSION_SECRET } =
    process.env;
  const missingSettings = [
    ["APP_ID", APP_ID],
    ["DISCORD_CLIENT_SECRET", DISCORD_CLIENT_SECRET],
    ["DISCORD_REDIRECT_URI", DISCORD_REDIRECT_URI],
    ["SESSION_SECRET", SESSION_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingSettings.length > 0) {
    console.warn(
      `Dashboard disabled; configure ${missingSettings.join(", ")} in bot/.env.`
    );
    return;
  }

  const port = Number(process.env.DASHBOARD_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("DASHBOARD_PORT must be a valid TCP port.");
  }

  const dashboardOrigin =
    process.env.DASHBOARD_ORIGIN ??
    (process.env.NODE_ENV === "production"
      ? `http://localhost:${port}`
      : "http://localhost:5173");
  const isProduction = process.env.NODE_ENV === "production";
  const app = express();
  app.set("trust proxy", isProduction);
  app.disable("x-powered-by");
  app.use(
    session({
      name: sessionCookieName,
      secret: SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: sessionMaxAgeMs,
      },
    })
  );

  app.get("/api/auth/login", async (req, res, next) => {
    try {
      const state = randomBytes(32).toString("hex");
      req.session.oauthState = state;
      await saveSession(req);

      const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
      authorizeUrl.search = new URLSearchParams({
        client_id: APP_ID!,
        redirect_uri: DISCORD_REDIRECT_URI!,
        response_type: "code",
        scope: "identify guilds",
        state,
      }).toString();
      res.redirect(authorizeUrl.toString());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/callback", async (req, res, next) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!state || state !== req.session.oauthState || !code) {
      res.status(400).send("Discord sign-in could not be verified. Please retry.");
      return;
    }

    try {
      const tokenResponse = await fetch(`${apiBaseUrl}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: APP_ID!,
          client_secret: DISCORD_CLIENT_SECRET!,
          grant_type: "authorization_code",
          code,
          redirect_uri: DISCORD_REDIRECT_URI!,
        }),
      });
      if (!tokenResponse.ok) {
        throw new Error(`Discord token exchange failed (${tokenResponse.status}).`);
      }

      const tokenPayload = (await tokenResponse.json()) as {
        access_token?: unknown;
      };
      if (typeof tokenPayload.access_token !== "string") {
        throw new Error("Discord token exchange returned an invalid response.");
      }

      const userResponse = await fetch(`${apiBaseUrl}/users/@me`, {
        headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      });
      if (!userResponse.ok) {
        throw new Error(`Discord profile request failed (${userResponse.status}).`);
      }

      const profile = (await userResponse.json()) as {
        id?: unknown;
        username?: unknown;
        global_name?: unknown;
        avatar?: unknown;
      };
      if (
        typeof profile.id !== "string" ||
        typeof profile.username !== "string"
      ) {
        throw new Error("Discord profile response was invalid.");
      }

      await regenerateSession(req);
      req.session.accessToken = tokenPayload.access_token;
      req.session.user = {
        id: profile.id,
        username: profile.username,
        displayName:
          typeof profile.global_name === "string"
            ? profile.global_name
            : profile.username,
        avatar: typeof profile.avatar === "string" ? profile.avatar : null,
      };
      await saveSession(req);
      res.redirect(dashboardOrigin);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }

      res.clearCookie(sessionCookieName, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
      });
      res.status(204).end();
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.session.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    res.json(req.session.user);
  });

  app.get("/api/status", requireLogin, (_req, res) => {
    res.json({
      online: client.isReady(),
      username: client.user?.username ?? null,
      guildCount: client.guilds.cache.size,
      uptimeMs: client.uptime,
    });
  });

  app.get("/api/commands", requireLogin, (_req, res) => {
    res.json(
      CommandList.map(({ data }) => ({
        name: data.name,
        description: data.description,
      }))
    );
  });

  app.get("/api/guilds", requireLogin, async (req, res, next) => {
    try {
      const guildResponse = await fetch(`${apiBaseUrl}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${req.session.accessToken}` },
      });
      if (guildResponse.status === 401) {
        req.session.destroy(() => undefined);
        res.status(401).json({ error: "Discord session expired; sign in again." });
        return;
      }
      if (!guildResponse.ok) {
        throw new Error(`Discord server list request failed (${guildResponse.status}).`);
      }

      const guilds = (await guildResponse.json()) as DiscordGuild[];
      if (!Array.isArray(guilds)) {
        throw new Error("Discord server list response was invalid.");
      }

      res.json(
        guilds
          .filter((guild) => {
            const permissions = BigInt(guild.permissions);
            const noPermissions = BigInt(0);
            return (
              (permissions & BigInt(PermissionFlagsBits.ManageGuild)) !==
                noPermissions ||
              (permissions & BigInt(PermissionFlagsBits.Administrator)) !==
                noPermissions
            );
          })
          .map(({ id, name, icon }) => ({
            id,
            name,
            icon,
            botPresent: client.guilds.cache.has(id),
          }))
      );
    } catch (error) {
      next(error);
    }
  });

  if (isProduction) {
    const dashboardDist = path.resolve(__dirname, "../../dashboard/dist");
    const dashboardIndex = path.join(dashboardDist, "index.html");
    if (existsSync(dashboardIndex)) {
      app.use(express.static(dashboardDist));
      app.use((req, res, next) => {
        if (
          req.method === "GET" &&
          !req.path.startsWith("/api/") &&
          !path.extname(req.path)
        ) {
          res.sendFile(dashboardIndex);
          return;
        }
        next();
      });
    }
  }

  app.use(
    (error: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) {
        next(error);
        return;
      }
      console.error("Dashboard request failed:", error);
      res.status(500).json({ error: "Dashboard request failed." });
    }
  );

  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, () => {
      const address = server.address();
      const listeningPort =
        address && typeof address === "object" ? address.port : port;
      console.log(`Dashboard API listening on port ${listeningPort}`);
      resolve(server);
    });
    server.once("error", reject);
  });
}
