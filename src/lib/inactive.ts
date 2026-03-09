import { prisma } from "@/lib/prisma";
import { isOlderThanInactiveThreshold } from "@/lib/character-status";

/**
 * Check and update the inactive flag for a single character.
 * A character becomes inactive if it hasn't been registered or checked into
 * an event in over 12 months. Only applies to characters past the draft stage.
 *
 * Returns the updated inactive value.
 */
export async function refreshInactiveStatus(characterId: string): Promise<boolean> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true, status: true, inactive: true, createdAt: true },
  });

  if (!character) return false;

  // Only mark characters that have been through the approval process
  // Draft/pending_review/rejected characters are actively being worked on
  const eligibleStatuses = ["approved", "checked_in", "checked_out"];
  if (!eligibleStatuses.includes(character.status)) {
    // If somehow marked inactive while in draft/pending, clear it
    if (character.inactive) {
      await prisma.character.update({
        where: { id: characterId },
        data: { inactive: false },
      });
    }
    return false;
  }

  // Find the most recent event activity for this character
  const lastRegistration = await prisma.eventRegistration.findFirst({
    where: { characterId },
    orderBy: { createdAt: "desc" },
    select: { checkedInAt: true, createdAt: true },
  });

  // Use the most recent of: checkedInAt, registration date
  const lastActivityDate = lastRegistration
    ? (lastRegistration.checkedInAt ?? lastRegistration.createdAt)
    : null;

  // If never registered for an event, use character creation date
  const referenceDate = lastActivityDate ?? character.createdAt;

  const shouldBeInactive = isOlderThanInactiveThreshold(referenceDate);

  // Update if mismatch (but never auto-set inactive=false; only CBD can do that)
  if (shouldBeInactive && !character.inactive) {
    await prisma.character.update({
      where: { id: characterId },
      data: { inactive: true },
    });
    return true;
  }

  return character.inactive;
}

/**
 * Bulk refresh inactive status for all characters belonging to a user.
 * Called when loading the character list.
 */
export async function refreshInactiveForUser(userId: string): Promise<void> {
  const characters = await prisma.character.findMany({
    where: { userId, status: { in: ["approved", "checked_in", "checked_out"] } },
    select: { id: true },
  });

  await Promise.all(characters.map((c) => refreshInactiveStatus(c.id)));
}
