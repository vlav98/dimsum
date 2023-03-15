export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_ID: string;
      GUILD_ID: string;
      DISCORD_TOKEN: string;
      PUBLIC_KEY: string;
      PREFIX: string;
    }
  }
}
