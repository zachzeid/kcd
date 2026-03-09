import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch all attendees (with characters) for an event
// Returns character name, player name, and skills for each registered character
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  // Get all registrations for this event that have a character assigned
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId, characterId: { not: null } },
    select: {
      characterId: true,
      user: {
        select: { id: true, name: true },
      },
    },
  });

  // Fetch characters for all registrations
  const characterIds = registrations
    .map((r) => r.characterId)
    .filter((id): id is string => id !== null);

  const characters = await prisma.character.findMany({
    where: { id: { in: characterIds } },
    select: { id: true, name: true, data: true },
  });

  const characterMap = new Map(characters.map((c) => [c.id, c]));

  const attendees = registrations
    .map((reg) => {
      const char = reg.characterId ? characterMap.get(reg.characterId) : null;
      if (!char) return null;

      // Parse character data to get skills
      let skills: string[] = [];
      try {
        const data = typeof char.data === "string" ? JSON.parse(char.data) : char.data;
        if (data?.skills && Array.isArray(data.skills)) {
          skills = data.skills.map((s: { skillName: string }) => s.skillName);
        }
      } catch {
        // ignore parse errors
      }

      return {
        characterId: char.id,
        characterName: char.name,
        playerName: reg.user.name ?? "Unknown",
        playerId: reg.user.id,
        skills,
      };
    })
    .filter(Boolean);

  return NextResponse.json(attendees);
}
