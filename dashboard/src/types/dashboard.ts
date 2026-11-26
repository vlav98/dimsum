import type { Guild } from '../lib/api';

export type User = { id: string; displayName: string; avatar: string | null };

export type DashboardData = {
  status: {
    online: boolean;
    username: string | null;
    guildCount: number;
    uptimeMs: number | null;
  };
  guilds: Guild[];
  commands: { name: string; description: string; category?: string }[];
};
