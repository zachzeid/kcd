import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { config, validateConfig } from "./config.js";
import { eventStartCommand, handleEventStart } from "./commands/event-start.js";
import { chronicleCommand, handleChronicle } from "./commands/chronicle.js";
import { registerCommand, handleRegister } from "./commands/register.js";
import { rosterCommand, handleRoster } from "./commands/roster.js";
import { recordMessage, getActiveSession } from "./agent/recorder.js";

import type { ChatInputCommandInteraction } from "discord.js";

validateConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command registry
const commands = new Collection<string, {
  data: ReturnType<typeof eventStartCommand>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}>();

commands.set("event-start", { data: eventStartCommand(), execute: handleEventStart });
commands.set("chronicle", { data: chronicleCommand(), execute: handleChronicle });
commands.set("register", { data: registerCommand(), execute: handleRegister });
commands.set("roster", { data: rosterCommand(), execute: handleRoster });

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    try {
      const reply = { content: "Something went wrong executing that command.", ephemeral: true as const };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch {
      // Interaction expired or already handled — nothing we can do
    }
  }
});

// Record messages in active event channels
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const session = getActiveSession(message.channelId);
  if (session) {
    recordMessage(message.channelId, {
      authorId: message.author.id,
      authorName: message.author.displayName,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    });
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`Chronicler bot ready as ${c.user.tag}`);
  console.log(`Watching ${c.guilds.cache.size} guild(s)`);
});

client.login(config.discordToken);

// Export commands for the deploy script
export { commands };
