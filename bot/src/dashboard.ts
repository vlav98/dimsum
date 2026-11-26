import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import express, {
  type NextFunction,
  type Request,
  type Response as ExpressResponse,
} from "express";
import session from "express-session";
import { ChannelType, Client, PermissionFlagsBits } from "discord.js";
import { DashboardSessionStore } from "./dashboardSessionStore";
import { CommandGroups } from "./commands";
import {
  CommunitySetupError,
  listWritingChannels,
  writingChannel,
} from "./community";
import {
  canBeReactionAssigned,
  deleteReactionRoleMessage,
  editReactionRoleMessage,
  publishReactionRoleMessage,
  ReactionRoleSetupError,
} from "./reactionRoles";
import { listReactionEmojis } from "./reactionEmojis";
import {
  deleteSavedPromptForGuild,
  deleteSavedPromptForUser,
  getDefaultPrefix,
  getGuildPrefix,
  listReactionRoleMessages,
  listSavedPromptsForGuild,
  listSavedPromptsForUser,
  ReactionRoleMapping,
  setGuildPrefix,
  getWritingChannel,
  setWritingChannel,
  getDailyPostSettings,
  setDailyPostSettings,
} from "./storage";

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
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    user?: DashboardUser;
  }
}

const apiBaseUrl = "https://discord.com/api/v10";
const sessionCookieName = "dimsum.sid";
const sessionMaxAgeMs = 30 * 24 * 60 * 60 * 1000;
const guildPermissionCacheMs = 30_000;

interface DiscordTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class DiscordTokenError extends Error {
  constructor(readonly status: number) {
    super(`Discord token request failed (${status}).`);
  }
}

async function requestDiscordTokens(
  parameters: URLSearchParams,
): Promise<DiscordTokens> {
  const response = await fetch(`${apiBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: parameters,
  });
  if (!response.ok) throw new DiscordTokenError(response.status);
  const payload = (await response.json()) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
  };
  if (
    typeof payload.access_token !== "string" ||
    !payload.access_token ||
    typeof payload.refresh_token !== "string" ||
    !payload.refresh_token ||
    typeof payload.expires_in !== "number" ||
    !Number.isFinite(payload.expires_in) ||
    payload.expires_in <= 0
  ) {
    throw new Error("Discord token exchange returned an invalid response.");
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };
}

class DiscordGuildListError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

const guildPermissionCache = new Map<
  string,
  { expiresAt: number; guilds: DiscordGuild[] }
>();
const guildPermissionRequests = new Map<string, Promise<DiscordGuild[]>>();

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

async function retryDelayMs(response: Response): Promise<number | null> {
  const headerValue =
    response.headers.get("retry-after") ??
    response.headers.get("x-ratelimit-reset-after");
  if (headerValue !== null) {
    const seconds = Number(headerValue);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
  }

  const payload = (await response
    .clone()
    .json()
    .catch(() => null)) as { retry_after?: unknown } | null;
  return typeof payload?.retry_after === "number" &&
    Number.isFinite(payload.retry_after) &&
    payload.retry_after >= 0
    ? payload.retry_after * 1000
    : null;
}

async function fetchGuildList(accessToken: string): Promise<DiscordGuild[]> {
  let response = await fetch(`${apiBaseUrl}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 429) {
    const delay = await retryDelayMs(response);
    if (delay === null || delay > 5000) {
      throw new DiscordGuildListError(
        "Discord is rate limiting server permissions. Retry in a few seconds.",
        429,
        delay === null ? undefined : Math.ceil(delay / 1000),
      );
    }
    await new Promise((resolve) => setTimeout(resolve, delay + 50));
    response = await fetch(`${apiBaseUrl}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  if (response.status === 429) {
    const delay = await retryDelayMs(response);
    throw new DiscordGuildListError(
      "Discord is still rate limiting server permissions. Retry in a few seconds.",
      429,
      delay === null ? undefined : Math.ceil(delay / 1000),
    );
  }
  if (!response.ok) {
    throw new DiscordGuildListError(
      `Discord server permission request failed (${response.status}).`,
      response.status,
    );
  }

  const guilds = (await response.json()) as DiscordGuild[];
  if (!Array.isArray(guilds)) {
    throw new Error("Discord server permission response was invalid.");
  }
  return guilds;
}

async function getUserGuilds(
  userId: string,
  accessToken: string,
): Promise<DiscordGuild[]> {
  const now = Date.now();
  for (const [cachedUserId, cached] of guildPermissionCache) {
    if (cached.expiresAt <= now) guildPermissionCache.delete(cachedUserId);
  }

  const cached = guildPermissionCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.guilds;

  const pending = guildPermissionRequests.get(userId);
  if (pending) return pending;

  const request = fetchGuildList(accessToken).then((guilds) => {
    guildPermissionCache.set(userId, {
      guilds,
      expiresAt: Date.now() + guildPermissionCacheMs,
    });
    return guilds;
  });
  guildPermissionRequests.set(userId, request);
  try {
    return await request;
  } finally {
    if (guildPermissionRequests.get(userId) === request) {
      guildPermissionRequests.delete(userId);
    }
  }
}

function respondToGuildListError(
  req: Request,
  res: ExpressResponse,
  error: unknown,
): boolean {
  if (!(error instanceof DiscordGuildListError)) return false;
  if (error.status === 401) {
    req.session.destroy(() => undefined);
    res.status(401).json({ error: "Discord session expired; sign in again." });
    return true;
  }
  if (error.status === 429) {
    res.status(503).json({
      error: error.message,
      retryAfterSeconds: error.retryAfterSeconds ?? null,
    });
    return true;
  }
  res.status(502).json({ error: error.message });
  return true;
}

function requireLogin(
  req: Request,
  res: ExpressResponse,
  next: NextFunction,
): void {
  if (!req.session.accessToken || !req.session.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  next();
}

async function userCanManageGuild(
  req: Request,
  res: ExpressResponse,
  guildId: string,
): Promise<boolean> {
  let guilds: DiscordGuild[];
  try {
    guilds = await getUserGuilds(
      req.session.user!.id,
      req.session.accessToken!,
    );
  } catch (error) {
    if (!respondToGuildListError(req, res, error)) throw error;
    return false;
  }
  const guild = guilds.find((entry) => entry.id === guildId);
  if (!guild) {
    res.status(403).json({ error: "You do not have access to this server." });
    return false;
  }

  const permissions = BigInt(guild.permissions);
  if (
    (permissions & PermissionFlagsBits.ManageGuild) === BigInt(0) &&
    (permissions & PermissionFlagsBits.Administrator) === BigInt(0)
  ) {
    res.status(403).json({ error: "Manage Server permission is required." });
    return false;
  }
  return true;
}

function parseMappings(value: unknown): ReactionRoleMapping[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    return null;
  }
  const mappings: ReactionRoleMapping[] = [];
  for (const entry of value) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("emoji" in entry) ||
      !("roleId" in entry) ||
      typeof entry.emoji !== "string" ||
      typeof entry.roleId !== "string"
    ) {
      return null;
    }
    mappings.push({ emoji: entry.emoji, roleId: entry.roleId });
  }
  return mappings;
}

function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value === "string") return value;
  return Array.isArray(value) ? (value[0] ?? "") : "";
}

export async function startDashboardServer(
  client: Client,
): Promise<Server | undefined> {
  const {
    APP_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    SESSION_SECRET,
  } = process.env;
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
      `Dashboard disabled; configure ${missingSettings.join(", ")} in bot/.env.`,
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
  const dashboardUrl = new URL(dashboardOrigin);
  if (
    dashboardUrl.protocol !== "https:" &&
    !(
      dashboardUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(dashboardUrl.hostname)
    )
  ) {
    throw new Error("DASHBOARD_ORIGIN must use HTTPS except on localhost.");
  }
  const secureCookie = dashboardUrl.protocol === "https:";
  const sessionDirectory = path.join(
    process.env.DIMSUM_DATA_DIR ?? path.resolve(__dirname, "../data"),
    "sessions",
  );
  const store = new DashboardSessionStore(
    sessionDirectory,
    sessionMaxAgeMs / 1000,
  );
  const refreshing = new Map<string, Promise<DiscordTokens>>();
  const app = express();
  app.set("trust proxy", secureCookie);
  app.disable("x-powered-by");
  app.use(
    session({
      name: sessionCookieName,
      secret: SESSION_SECRET!,
      store,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookie,
        maxAge: sessionMaxAgeMs,
      },
    }),
  );
  app.use(express.json({ limit: "16kb" }));

  app.use("/api", async (req, res, next) => {
    if (
      req.path.startsWith("/auth/") ||
      !req.session.user ||
      !req.session.accessToken
    ) {
      next();
      return;
    }
    if (
      req.session.accessTokenExpiresAt &&
      req.session.accessTokenExpiresAt > Date.now() + 60_000
    ) {
      next();
      return;
    }
    try {
      let refresh = refreshing.get(req.sessionID);
      if (!refresh) {
        refresh = (async () => {
          const current = await new Promise<session.SessionData | null>(
            (resolve, reject) =>
              store.get(req.sessionID, (error, data) => {
                if (
                  error &&
                  !(
                    typeof error === "object" &&
                    "code" in error &&
                    error.code === "ENOENT"
                  )
                )
                  reject(error);
                else resolve(data ?? null);
              }),
          );
          if (!current?.user || !current.refreshToken) {
            throw new DiscordTokenError(401);
          }
          if (
            current.accessToken &&
            current.accessTokenExpiresAt &&
            current.accessTokenExpiresAt > Date.now() + 60_000
          ) {
            return {
              accessToken: current.accessToken,
              refreshToken: current.refreshToken,
              expiresAt: current.accessTokenExpiresAt,
            };
          }
          const tokens = await requestDiscordTokens(
            new URLSearchParams({
              client_id: APP_ID!,
              client_secret: DISCORD_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: current.refreshToken,
            }),
          );
          req.session.accessToken = tokens.accessToken;
          req.session.refreshToken = tokens.refreshToken;
          req.session.accessTokenExpiresAt = tokens.expiresAt;
          await saveSession(req);
          guildPermissionCache.delete(req.session.user!.id);
          return tokens;
        })();
        refreshing.set(req.sessionID, refresh);
        const clearRefresh = () => refreshing.delete(req.sessionID);
        void refresh.then(clearRefresh, clearRefresh);
      }
      const tokens = await refresh;
      req.session.accessToken = tokens.accessToken;
      req.session.refreshToken = tokens.refreshToken;
      req.session.accessTokenExpiresAt = tokens.expiresAt;
      next();
    } catch (error) {
      if (
        error instanceof DiscordTokenError &&
        (error.status === 400 || error.status === 401)
      ) {
        req.session.destroy((destroyError) => {
          if (destroyError) return next(destroyError);
          res
            .status(401)
            .json({ error: "Discord session expired; sign in again." });
        });
        return;
      }
      next(error);
    }
  });

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
      res
        .status(400)
        .send("Discord sign-in could not be verified. Please retry.");
      return;
    }

    try {
      const tokens = await requestDiscordTokens(
        new URLSearchParams({
          client_id: APP_ID!,
          client_secret: DISCORD_CLIENT_SECRET!,
          grant_type: "authorization_code",
          code,
          redirect_uri: DISCORD_REDIRECT_URI!,
        }),
      );

      const userResponse = await fetch(`${apiBaseUrl}/users/@me`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!userResponse.ok) {
        throw new Error(
          `Discord profile request failed (${userResponse.status}).`,
        );
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
      req.session.accessToken = tokens.accessToken;
      req.session.refreshToken = tokens.refreshToken;
      req.session.accessTokenExpiresAt = tokens.expiresAt;
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

  app.post("/api/auth/logout", async (req, res, next) => {
    const refresh = refreshing.get(req.sessionID);
    if (refresh) {
      try {
        await refresh;
      } catch {
        // Logout must still remove the session if token renewal failed.
      }
    }
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }

      res.clearCookie(sessionCookieName, {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookie,
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
      CommandGroups.flatMap((group) =>
        group.commands.map(({ data }) => ({
          name: data.name,
          description: data.description,
          category: group.name,
        })),
      ),
    );
  });

  app.get("/api/guilds", requireLogin, async (req, res, next) => {
    try {
      const guilds = await getUserGuilds(
        req.session.user!.id,
        req.session.accessToken!,
      );

      res.json(
        guilds.map(({ id, name, icon, permissions }) => ({
          id,
          name,
          icon,
          botPresent: client.guilds.cache.has(id),
          canManage:
            (BigInt(permissions) &
              (PermissionFlagsBits.ManageGuild |
                PermissionFlagsBits.Administrator)) !==
            BigInt(0),
        })),
      );
    } catch (error) {
      if (respondToGuildListError(req, res, error)) return;
      next(error);
    }
  });

  app.get("/api/me/saved-prompts", requireLogin, async (req, res, next) => {
    try {
      res.json(await listSavedPromptsForUser(req.session.user!.id));
    } catch (error) {
      next(error);
    }
  });

  app.delete(
    "/api/me/saved-prompts/:promptId",
    requireLogin,
    async (req, res, next) => {
      try {
        const deleted = await deleteSavedPromptForUser(
          req.session.user!.id,
          getRouteParam(req, "promptId"),
        );
        if (!deleted) {
          res
            .status(404)
            .json({ error: "Saved prompt not found in your library." });
          return;
        }
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );

  app.delete(
    "/api/guilds/:guildId/saved-prompts/:promptId",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const deleted = await deleteSavedPromptForGuild(
          guildId,
          getRouteParam(req, "promptId"),
        );
        if (!deleted) {
          res
            .status(404)
            .json({ error: "Saved prompt not found in this server." });
          return;
        }
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/saved-prompts",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        res.json(await listSavedPromptsForGuild(guildId));
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/settings/nickname",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        const member = guild.members.me ?? (await guild.members.fetchMe());
        res.json({
          nickname: member.nickname,
          username: client.user?.username ?? "DimSum",
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.put(
    "/api/guilds/:guildId/settings/nickname",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const nickname: unknown = req.body?.nickname;
        if (
          nickname !== null &&
          (typeof nickname !== "string" ||
            !nickname.trim() ||
            nickname.length > 32)
        ) {
          res
            .status(400)
            .json({
              error: "Nickname must be 1–32 characters, or null to reset it.",
            });
          return;
        }
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        const member = guild.members.me ?? (await guild.members.fetchMe());
        if (!member.permissions.has(PermissionFlagsBits.ChangeNickname)) {
          res
            .status(400)
            .json({
              error: "DimSum needs Change Nickname permission in this server.",
            });
          return;
        }
        await member.setNickname(
          nickname,
          "Updated through the DimSum dashboard",
        );
        res.json({ nickname, username: client.user?.username ?? "DimSum" });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/settings/daily",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        if (!client.guilds.cache.has(guildId)) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        res.json(await getDailyPostSettings(guildId));
      } catch (error) {
        next(error);
      }
    },
  );

  app.put(
    "/api/guilds/:guildId/settings/daily",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        if (!client.guilds.cache.has(guildId)) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        const { enabled, channelId, time, kind } = req.body ?? {};
        if (
          typeof enabled !== "boolean" ||
          (channelId !== null &&
            (typeof channelId !== "string" || !channelId)) ||
          (enabled && !channelId) ||
          typeof time !== "string" ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ||
          (kind !== "prompt" && kind !== "challenge")
        ) {
          res
            .status(400)
            .json({
              error:
                "Choose an enabled status, channel, UTC time (HH:MM), and prompt or challenge.",
            });
          return;
        }
        if (enabled) await writingChannel(client, guildId, channelId);
        res.json(
          await setDailyPostSettings(guildId, {
            enabled,
            channelId,
            time,
            kind,
          }),
        );
      } catch (error) {
        if (error instanceof CommunitySetupError) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/settings/writing",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const [channelId, channels] = await Promise.all([
          getWritingChannel(guildId),
          listWritingChannels(client, guildId),
        ]);
        res.json({ channelId, channels });
      } catch (error) {
        if (error instanceof CommunitySetupError) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

  app.put(
    "/api/guilds/:guildId/settings/writing",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const channelId: unknown = req.body?.channelId;
        if (
          channelId !== null &&
          (typeof channelId !== "string" || !channelId)
        ) {
          res.status(400).json({
            error: "Choose a writing channel or null to disable posting.",
          });
          return;
        }
        if (channelId !== null)
          await writingChannel(client, guildId, channelId);
        await setWritingChannel(guildId, channelId);
        res.json({ channelId });
      } catch (error) {
        if (error instanceof CommunitySetupError) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/settings",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const customPrefix = await getGuildPrefix(guildId);
        res.json({
          prefix: customPrefix ?? getDefaultPrefix(),
          isCustom: customPrefix !== null,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.put(
    "/api/guilds/:guildId/settings/prefix",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const prefix =
          req.body && typeof req.body.prefix === "string"
            ? req.body.prefix
            : null;
        if (
          prefix === null ||
          prefix.length < 1 ||
          prefix.length > 5 ||
          /[\s@/<>]/u.test(prefix)
        ) {
          res.status(400).json({
            error:
              "Prefix must be 1–5 characters and cannot contain spaces, mentions, or slashes.",
          });
          return;
        }
        await setGuildPrefix(guildId, prefix);
        res.json({ prefix, isCustom: true });
      } catch (error) {
        next(error);
      }
    },
  );

  app.delete(
    "/api/guilds/:guildId/settings/prefix",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        await setGuildPrefix(guildId, null);
        res.json({ prefix: getDefaultPrefix(), isCustom: false });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/channels",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        const botMember = guild.members.me ?? (await guild.members.fetchMe());
        const channels = [...guild.channels.cache.values()].flatMap(
          (channel) => {
            if (
              channel.type !== ChannelType.GuildText &&
              channel.type !== ChannelType.GuildAnnouncement
            ) {
              return [];
            }
            const permissions = channel.permissionsFor(botMember);
            if (
              !permissions?.has([
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AddReactions,
              ])
            ) {
              return [];
            }
            return [
              {
                id: channel.id,
                name: channel.name,
                category: channel.parent?.name ?? null,
              },
            ];
          },
        );
        res.json(channels);
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/emojis",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        res.json(listReactionEmojis(guild));
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/roles",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
          res.status(404).json({ error: "DimSum is not in this server." });
          return;
        }
        const botMember = guild.members.me ?? (await guild.members.fetchMe());
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          res.json([]);
          return;
        }
        res.json(
          guild.roles.cache
            .filter((role) =>
              canBeReactionAssigned(role, botMember.roles.highest.position),
            )
            .sort((left, right) => right.position - left.position)
            .map((role) => ({
              id: role.id,
              name: role.name,
              color: role.hexColor,
            })),
        );
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/guilds/:guildId/reaction-roles",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        res.json(await listReactionRoleMessages(guildId));
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/guilds/:guildId/reaction-roles",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const channelId =
          req.body && typeof req.body.channelId === "string"
            ? req.body.channelId
            : "";
        const content =
          req.body && typeof req.body.content === "string"
            ? req.body.content
            : "";
        const mappings = parseMappings(req.body?.mappings);
        if (!channelId || !content || !mappings) {
          res.status(400).json({
            error:
              "Provide a channel, message text, and 1–10 emoji-role mappings.",
          });
          return;
        }
        const result = await publishReactionRoleMessage(
          client,
          guildId,
          channelId,
          content,
          mappings,
        );
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof ReactionRoleSetupError) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

  app.delete(
    "/api/guilds/:guildId/reaction-roles/:messageId",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        const messageId = getRouteParam(req, "messageId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        await deleteReactionRoleMessage(client, guildId, messageId);
        res.status(204).end();
      } catch (error) {
        if (error instanceof ReactionRoleSetupError) {
          res.status(404).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

  app.put(
    "/api/guilds/:guildId/reaction-roles/:messageId",
    requireLogin,
    async (req, res, next) => {
      try {
        const guildId = getRouteParam(req, "guildId");
        if (!(await userCanManageGuild(req, res, guildId))) return;
        const content =
          typeof req.body?.content === "string" ? req.body.content : "";
        const mappings = parseMappings(req.body?.mappings);
        if (!content || !mappings) {
          res.status(400).json({
            error: "Provide message text and 1–10 emoji-role mappings.",
          });
          return;
        }
        await editReactionRoleMessage(
          client,
          guildId,
          getRouteParam(req, "messageId"),
          content,
          mappings,
        );
        res.status(204).end();
      } catch (error) {
        if (error instanceof ReactionRoleSetupError) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    },
  );

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
    (
      error: unknown,
      _req: Request,
      res: ExpressResponse,
      next: NextFunction,
    ) => {
      if (res.headersSent) {
        next(error);
        return;
      }
      console.error("Dashboard request failed:", error);
      res.status(500).json({ error: "Dashboard request failed." });
    },
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
