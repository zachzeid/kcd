import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { startSession, getActiveSession } from "../agent/recorder.js";

export function eventStartCommand() {
  return new SlashCommandBuilder()
    .setName("event-start")
    .setDescription("Begin recording an online RP event in this channel")
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Event title (e.g. 'The Expedition to Kar\\'dathien')").setRequired(true)
    )
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

  const title = interaction.options.getString("title", true);
  startSession(channelId, title, interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle("The Chronicler Awakens")
    .setDescription(`Recording has begun for **${title}**.\n\nAll messages in this channel are now being captured. When the event concludes, a GM may use \`/chronicle\` to generate the historical record.`)
    .setColor(0xd4a017)
    .setFooter({ text: "K1 Chronicler" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
