// Bot configuration — loaded from environment variables
// Required: DISCORD_TOKEN, DISCORD_CLIENT_ID
// Optional: ANTHROPIC_API_KEY (for /chronicle), GUILD_ID (for dev command registration)

export const config = {
  discordToken: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  guildId: process.env.GUILD_ID, // If set, commands register to this guild only (instant, good for dev)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
} as const;

export function validateConfig() {
  if (!config.discordToken) throw new Error("DISCORD_TOKEN is required");
  if (!config.clientId) throw new Error("DISCORD_CLIENT_ID is required");
}
