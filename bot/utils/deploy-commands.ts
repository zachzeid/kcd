import { REST, Routes } from "discord.js";
import { config, validateConfig } from "../config.js";
import { eventStartCommand } from "../commands/event-start.js";
import { chronicleCommand } from "../commands/chronicle.js";
import { registerCommand } from "../commands/register.js";
import { rosterCommand } from "../commands/roster.js";

validateConfig();

const commands = [
  eventStartCommand().toJSON(),
  chronicleCommand().toJSON(),
  registerCommand().toJSON(),
  rosterCommand().toJSON(),
];

const rest = new REST({ version: "10" }).setToken(config.discordToken);

async function deploy() {
  try {
    console.log(`Deploying ${commands.length} commands...`);

    if (config.guildId) {
      // Guild-specific (instant, good for development)
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands },
      );
      console.log(`Deployed to guild ${config.guildId}`);
    } else {
      // Global (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands },
      );
      console.log("Deployed globally (may take up to 1 hour to propagate)");
    }
  } catch (error) {
    console.error("Failed to deploy commands:", error);
    process.exit(1);
  }
}

deploy();
