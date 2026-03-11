import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getRoster } from "./register.js";

export function rosterCommand() {
  return new SlashCommandBuilder()
    .setName("roster")
    .setDescription("Show which Discord users are linked to characters");
}

export async function handleRoster(interaction: ChatInputCommandInteraction) {
  const roster = getRoster();

  if (roster.size === 0) {
    await interaction.reply({
      content: "No one has registered yet. Use `/register` to link your Discord account to your character.",
      ephemeral: true,
    });
    return;
  }

  const lines = Array.from(roster.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([discord, char]) => `**${discord}** → ${char.characterName} (${char.race} ${char.characterClass})`);

  const embed = new EmbedBuilder()
    .setTitle("Registered Characters")
    .setDescription(lines.join("\n"))
    .setColor(0xd4a017)
    .setFooter({ text: `${roster.size} player(s) registered` });

  await interaction.reply({ embeds: [embed] });
}
