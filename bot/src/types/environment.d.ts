export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string;
      GUILD_ID: string;
      PREFIX?: string;
    }
  }
}
