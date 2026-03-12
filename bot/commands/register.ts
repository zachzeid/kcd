import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
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
      opt
        .setName("character")
        .setDescription("Select your character")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("email")
        .setDescription("Your Kanar app email (only needed on first link)")
        .setRequired(false)
    );
}

/**
 * Autocomplete handler — shows only the user's own characters.
 * Requires discordId to be linked to a User account first.
 */
export async function handleRegisterAutocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const discordId = interaction.user.id;

  // Find the user by discordId (may not be linked yet)
  const user = await prisma.user.findUnique({ where: { discordId } });

  // If linked, show only their characters; otherwise search all characters by name
  const characters = user
    ? await prisma.character.findMany({
        where: { userId: user.id, status: { not: "deleted" } },
      })
    : await prisma.character.findMany({
        where: { status: { not: "deleted" } },
      });

  const choices = characters
    .map((c) => {
      const data = JSON.parse(c.data as string);
      return {
        name: `${data.name} — ${data.race} ${data.characterClass} (Lv.${data.level})`,
        value: c.id,
      };
    })
    .filter((ch) => ch.name.toLowerCase().includes(focused))
    .slice(0, 25);

  await interaction.respond(choices);
}

export async function handleRegister(interaction: ChatInputCommandInteraction) {
  const characterValue = interaction.options.getString("character", true).trim();
  const email = interaction.options.getString("email")?.trim();
  const discordId = interaction.user.id;

  // Step 1: Ensure Discord account is linked to an app user
  let user = await prisma.user.findUnique({ where: { discordId } });

  if (!user) {
    if (!email) {
      await interaction.reply({
        content: "First-time setup: run `/register` with the `email` option set to your Kanar app login email.\nExample: `/register character:YourCharacter email:you@example.com`",
        ephemeral: true,
      });
      return;
    }
    // Try to link by email
    const byEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!byEmail) {
      await interaction.reply({
        content: `No Kanar account found for **${email}**. Make sure you use the same email as your app login.`,
        ephemeral: true,
      });
      return;
    }
    if (byEmail.discordId && byEmail.discordId !== discordId) {
      await interaction.reply({
        content: "That account is already linked to a different Discord user.",
        ephemeral: true,
      });
      return;
    }
    // Link the account
    await prisma.user.update({
      where: { id: byEmail.id },
      data: { discordId },
    });
    user = { ...byEmail, discordId };
  }

  // Step 2: Find the character — verify it belongs to this user
  const character = await prisma.character.findFirst({
    where: { id: characterValue, status: { not: "deleted" } },
  });

  let charData: { name: string; race: string; characterClass: string; level: number } | null = null;
  if (character) {
    // Verify ownership
    if (character.userId !== user.id) {
      await interaction.reply({
        content: "That character doesn't belong to your account.",
        ephemeral: true,
      });
      return;
    }
    charData = JSON.parse(character.data as string);
  } else {
    // Fallback: typed a name instead of using autocomplete — match against own characters
    const allChars = await prisma.character.findMany({
      where: { userId: user.id, status: { not: "deleted" } },
    });
    for (const c of allChars) {
      const d = JSON.parse(c.data as string);
      if (d.name.toLowerCase() === characterValue.toLowerCase()) {
        charData = d;
        break;
      }
    }
  }

  if (!charData) {
    await interaction.reply({
      content: `No character found matching **${characterValue}** on your account. Use the autocomplete dropdown to select one of your characters.`,
      ephemeral: true,
    });
    return;
  }

  // Step 3: Register in the roster
  roster.set(interaction.user.displayName, {
    characterName: charData.name,
    race: charData.race,
    characterClass: charData.characterClass,
  });

  // Step 4: Change server nickname to character name
  let nicknameChanged = false;
  try {
    const member = interaction.member;
    if (member instanceof GuildMember && interaction.guild) {
      await member.setNickname(charData.name, "Chronicler registration");
      nicknameChanged = true;
    }
  } catch {
    // Bot may lack permission to change nicknames (e.g., server owner)
  }

  const embed = new EmbedBuilder()
    .setDescription(
      `**${interaction.user.displayName}** is now linked to **${charData.name}** (${charData.race} ${charData.characterClass})` +
      (nicknameChanged ? `\n\nYour server nickname has been updated to **${charData.name}**.` : "")
    )
    .setColor(0x3498db)
    .setFooter({ text: "The Chronicler will recognize you during events" });

  await interaction.reply({ embeds: [embed] });
}
