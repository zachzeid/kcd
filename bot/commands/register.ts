import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { prisma } from "../db.js";

// In-memory roster mapping Discord display name → character info
// Persists for the bot's lifetime; resets on restart
const roster = new Map<string, { characterName: string; race: string; characterClass: string }>();

export function getRoster() {
  return roster;
}

export function registerCommand() {
  return new SlashCommandBuilder()
    .setName("register")
    .setDescription("Link your Discord account to your Kanar character for the Chronicler")
    .addStringOption((opt) =>
      opt.setName("character").setDescription("Your character name (exact match)").setRequired(true)
    );
}

export async function handleRegister(interaction: ChatInputCommandInteraction) {
  const characterName = interaction.options.getString("character", true).trim();

  // Search for the character in the database
  const characters = await prisma.character.findMany({
    where: { status: { not: "deleted" } },
  });

  let found: { name: string; race: string; characterClass: string } | null = null;
  for (const char of characters) {
    const data = JSON.parse(char.data as string);
    if (data.name.toLowerCase() === characterName.toLowerCase()) {
      found = { name: data.name, race: data.race, characterClass: data.characterClass };
      break;
    }
  }

  if (!found) {
    await interaction.reply({
      content: `No character named **${characterName}** found. Make sure the name matches exactly as it appears on your character sheet.`,
      ephemeral: true,
    });
    return;
  }

  // Register the mapping
  roster.set(interaction.user.displayName, {
    characterName: found.name,
    race: found.race,
    characterClass: found.characterClass,
  });

  const embed = new EmbedBuilder()
    .setDescription(`**${interaction.user.displayName}** is now linked to **${found.name}** (${found.race} ${found.characterClass})`)
    .setColor(0x3498db)
    .setFooter({ text: "The Chronicler will recognize you during events" });

  await interaction.reply({ embeds: [embed] });
}
