import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { startSession, getActiveSession } from "../agent/recorder.js";
import { prisma } from "../db.js";

export function eventStartCommand() {
  return new SlashCommandBuilder()
    .setName("event-start")
    .setDescription("Begin recording — automatically links to the current active event")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages); // GM/staff only
}

export async function handleEventStart(interaction: ChatInputCommandInteraction) {
  const channelId = interaction.channelId;
  const existing = getActiveSession(channelId);

  if (existing) {
    await interaction.reply({
      content: `This channel already has an active session: **${existing.eventTitle}** (started <t:${Math.floor(new Date(existing.startedAt).getTime() / 1000)}:R>). Use \`/chronicle\` to end it first.`,
      ephemeral: true,
    });
    return;
  }

  // Find the currently active event
  const activeEvent = await prisma.event.findFirst({
    where: { status: "active" },
    orderBy: { date: "desc" },
  });

  if (!activeEvent) {
    await interaction.reply({
      content: "No active event found. An event must be set to **active** status in the app before recording can begin.",
      ephemeral: true,
    });
    return;
  }

  startSession(channelId, activeEvent.name, interaction.user.id, activeEvent.id);

  const embed = new EmbedBuilder()
    .setTitle("The Chronicler Awakens")
    .setDescription(
      `Recording has begun for **${activeEvent.name}**.\n\n` +
      `All messages in this channel are now being captured. When the event concludes, a GM may use \`/chronicle\` to generate the historical record.`
    )
    .addFields(
      { name: "Event", value: activeEvent.name, inline: true },
      { name: "Date", value: `<t:${Math.floor(activeEvent.date.getTime() / 1000)}:D>`, inline: true },
    )
    .setColor(0xd4a017)
    .setFooter({ text: "K1 Chronicler" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
