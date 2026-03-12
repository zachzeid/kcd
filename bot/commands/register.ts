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

  // Find the user by discordId
  const user = await prisma.user.findUnique({ where: { discordId } });

  if (!user) {
    // Not linked yet — show a hint
    await interaction.respond([
      { name: "Link your account first: provide your email option", value: "__unlinked__" },
    ]);
    return;
  }

  // Fetch this user's non-deleted characters
  const characters = await prisma.character.findMany({
    where: { userId: user.id, status: { not: "deleted" } },
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

  if (!user && email) {
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

  if (!user) {
    await interaction.reply({
      content: "Your Discord account isn't linked yet. Run `/register` with the `email` option set to your Kanar app email to link it.",
      ephemeral: true,
    });
    return;
  }

  // Step 2: Find the character — must belong to this user
  if (characterValue === "__unlinked__") {
    await interaction.reply({
      content: "Your Discord account isn't linked yet. Run `/register` with the `email` option set to your Kanar app email to link it.",
      ephemeral: true,
    });
    return;
  }

  const character = await prisma.character.findFirst({
    where: { id: characterValue, userId: user.id, status: { not: "deleted" } },
  });

  // Fallback: if they typed a name instead of using autocomplete
  let charData: { name: string; race: string; characterClass: string; level: number } | null = null;
  if (character) {
    charData = JSON.parse(character.data as string);
  } else {
    // Try name match against their own characters only
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
