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

  // Defer immediately — Claude synthesis takes 5-30 seconds
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

    await interaction.editReply({
      content: "**Chronicle Draft** — Review before saving to the permanent record:",
      embeds: [previewEmbed],
      components: [row],
    });

    // Fetch the reply as a Message so we can attach a collector
    const message = await interaction.fetchReply();

    // Wait for GM to approve or discard (5 minute timeout)
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 300_000,
      max: 1,
    });

    collector.on("collect", async (confirm) => {
      if (confirm.customId === "chronicle_approve") {
        try {
          await confirm.deferUpdate();
        } catch (err) {
          console.error("Failed to defer button update:", err);
          return;
        }

        try {
          const saved = await saveChronicle(session, result, interaction.user.id);

          const savedEmbed = new EmbedBuilder()
            .setTitle("Chronicle Recorded")
            .setDescription(result.recap)
            .addFields(
              { name: "Event", value: session.eventTitle, inline: true },
              { name: "Characters", value: String(saved.charactersLinked), inline: true },
              { name: "Messages", value: String(session.messages.length), inline: true },
            )
            .setColor(0x2ecc71)
            .setFooter({ text: "K1 Chronicler — this event is now part of world history" })
            .setTimestamp();

          endSession(channelId);
          await interaction.editReply({ content: null, embeds: [savedEmbed], components: [] });
        } catch (err) {
          console.error("Chronicle save failed:", err);
          endSession(channelId);
          await interaction.editReply({
            content: `Save failed: ${err instanceof Error ? err.message : "Unknown error"}. Session ended.`,
            embeds: [],
            components: [],
          });
        }
      } else {
        try {
          endSession(channelId);
          await confirm.update({
            content: "Chronicle discarded. The recording session has ended.",
            embeds: [],
            components: [],
          });
        } catch (err) {
          console.error("Chronicle discard failed:", err);
        }
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        // Timeout — don't end the session, let the GM try again
        await interaction.editReply({
          content: "Approval timed out. The session is still active — run `/chronicle` again when ready.",
          components: [],
        });
      }
    });
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

  // Lore preview
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
  session: { eventId: string; eventTitle: string; messages: { length: number } },
  result: ChronicleResult,
  chronicledBy: string
): Promise<{ charactersLinked: number }> {
  // Combine all lore entries into one narrative for the EventChronicle
  const narrative = result.loreEntries
    .map((l) => `## ${l.title}\n\n${l.content}`)
    .join("\n\n---\n\n");

  const allLocations = [...new Set(result.loreEntries.flatMap((l) => l.locations))];
  const allTags = [...new Set(result.loreEntries.flatMap((l) => l.tags))];

  // Create the EventChronicle
  const chronicle = await prisma.eventChronicle.create({
    data: {
      eventId: session.eventId,
      title: result.loreEntries[0]?.title ?? session.eventTitle,
      recap: result.recap,
      narrative,
      locations: JSON.stringify(allLocations),
      tags: JSON.stringify(allTags),
      messageCount: session.messages.length,
      chronicledBy,
    },
  });

  // Create CharacterChronicle entries linked to actual characters
  let charactersLinked = 0;
  for (const update of result.characterUpdates) {
    // Find the character by name in the DB
    const characters = await prisma.character.findMany({
      where: { status: { not: "deleted" } },
    });

    for (const char of characters) {
      const data = JSON.parse(char.data as string);
      if (data.name.toLowerCase() === update.characterName.toLowerCase()) {
        await prisma.characterChronicle.create({
          data: {
            chronicleId: chronicle.id,
            characterId: char.id,
            summary: update.historyEntry,
          },
        });
        charactersLinked++;
        break;
      }
    }
  }

  // Also create a LoreEntry for the Compendium
  for (const lore of result.loreEntries) {
    await prisma.loreEntry.create({
      data: {
        title: lore.title,
        content: lore.content,
        summary: lore.summary,
        source: `Online Event — ${session.eventTitle}`,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        locations: JSON.stringify(lore.locations),
        characters: JSON.stringify(lore.characters),
        tags: JSON.stringify(lore.tags),
        category: "recap",
      },
    });
  }

  return { charactersLinked };
}
