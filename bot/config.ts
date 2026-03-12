// Bot configuration — loaded from environment variables
// Required: DISCORD_TOKEN, DISCORD_CLIENT_ID
// Optional: ANTHROPIC_API_KEY (for /chronicle), GUILD_ID (for dev command registration)

import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local since tsx doesn't auto-load it
try {
  const envPath = join(process.cwd(), ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local not found — rely on system environment variables
}

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
