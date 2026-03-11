import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { endSession, getActiveSession } from "../agent/recorder.js";
import { synthesize, type ChronicleResult } from "../agent/chronicler.js";
import { getRoster } from "./register.js";
import { prisma } from "../db.js";

export function chronicleCommand() {
  return new SlashCommandBuilder()
    .setName("chronicle")
    .setDescription("End recording and generate the historical chronicle for this event")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
}

export async function handleChronicle(interaction: ChatInputCommandInteraction) {
  const channelId = interaction.channelId;
  const session = getActiveSession(channelId);

  if (!session) {
    await interaction.reply({
      content: "No active recording session in this channel. Use `/event-start` to begin one.",
      ephemeral: true,
    });
    return;
  }

  if (session.messages.length === 0) {
    await interaction.reply({
      content: "No messages were recorded in this session. Nothing to chronicle.",
      ephemeral: true,
    });
    return;
  }

  // Defer — Claude synthesis takes time
  await interaction.deferReply();

  try {
    const roster = getRoster();
    const result = await synthesize(session, roster);

    // Build preview embeds for GM approval
    const previewEmbed = buildPreviewEmbed(session.eventTitle, session.messages.length, result);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("chronicle_approve")
        .setLabel("Approve & Save")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("chronicle_discard")
        .setLabel("Discard")
        .setStyle(ButtonStyle.Danger),
    );

    const response = await interaction.editReply({
      content: "**Chronicle Draft** — Review before saving to the permanent record:",
      embeds: [previewEmbed],
      components: [row],
    });

    // Wait for GM to approve or discard (5 minute timeout)
    try {
      const confirm = await response.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 300_000,
      });

      if (confirm.customId === "chronicle_approve") {
        await confirm.deferUpdate();
        const saved = await saveChronicle(session.eventTitle, result);

        const savedEmbed = new EmbedBuilder()
          .setTitle("Chronicle Recorded")
          .setDescription(result.recap)
          .addFields(
            { name: "Characters Updated", value: String(saved.charactersUpdated), inline: true },
            { name: "Lore Entries Created", value: String(saved.loreEntriesCreated), inline: true },
            { name: "Messages Chronicled", value: String(session.messages.length), inline: true },
          )
          .setColor(0x2ecc71)
          .setFooter({ text: "K1 Chronicler — this event is now part of world history" })
          .setTimestamp();

        endSession(channelId);
        await interaction.editReply({ content: null, embeds: [savedEmbed], components: [] });
      } else {
        endSession(channelId);
        await confirm.update({
          content: "Chronicle discarded. The recording session has ended.",
          embeds: [],
          components: [],
        });
      }
    } catch {
      // Timeout — don't end the session, let the GM try again
      await interaction.editReply({
        content: "Approval timed out. The session is still active — run `/chronicle` again when ready.",
        components: [],
      });
    }
  } catch (error) {
    console.error("Chronicle synthesis failed:", error);
    await interaction.editReply({
      content: `Synthesis failed: ${error instanceof Error ? error.message : "Unknown error"}. The session is still active — try again.`,
    });
  }
}

function buildPreviewEmbed(eventTitle: string, messageCount: number, result: ChronicleResult): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Chronicle: ${eventTitle}`)
    .setDescription(result.recap)
    .setColor(0xd4a017);

  // Character updates preview
  if (result.characterUpdates.length > 0) {
    const charPreview = result.characterUpdates
      .map((u) => `**${u.characterName}**: ${u.historyEntry.slice(0, 120)}${u.historyEntry.length > 120 ? "..." : ""}`)
      .join("\n\n");
    embed.addFields({ name: `Character Updates (${result.characterUpdates.length})`, value: charPreview.slice(0, 1024) });
  }

  // Lore entries preview
  if (result.loreEntries.length > 0) {
    const lorePreview = result.loreEntries
      .map((l) => `**${l.title}**\n${l.summary}`)
      .join("\n\n");
    embed.addFields({ name: `Lore Entries (${result.loreEntries.length})`, value: lorePreview.slice(0, 1024) });
  }

  embed.setFooter({ text: `Based on ${messageCount} messages` });
  return embed;
}

async function saveChronicle(
  eventTitle: string,
  result: ChronicleResult
): Promise<{ charactersUpdated: number; loreEntriesCreated: number }> {
  let charactersUpdated = 0;

  // Update character histories
  for (const update of result.characterUpdates) {
    const characters = await prisma.character.findMany({
      where: { status: { not: "deleted" } },
    });

    // Find character by name match in the JSON data blob
    for (const char of characters) {
      const data = JSON.parse(char.data as string);
      if (data.name === update.characterName) {
        // Append to history with a clear event delimiter
        const existingHistory = data.history || "";
        const timestamp = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const entry = `\n\n--- ${eventTitle} (${timestamp}) ---\n${update.historyEntry}`;
        data.history = existingHistory + entry;

        await prisma.character.update({
          where: { id: char.id },
          data: { data: JSON.stringify(data) },
        });
        charactersUpdated++;
        break;
      }
    }
  }

  // Create lore entries
  for (const lore of result.loreEntries) {
    await prisma.loreEntry.create({
      data: {
        title: lore.title,
        content: lore.content,
        summary: lore.summary,
        source: `Online Event — ${eventTitle}`,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        locations: JSON.stringify(lore.locations),
        characters: JSON.stringify(lore.characters),
        tags: JSON.stringify(lore.tags),
        category: "recap",
      },
    });
  }

  return { charactersUpdated, loreEntriesCreated: result.loreEntries.length };
}
