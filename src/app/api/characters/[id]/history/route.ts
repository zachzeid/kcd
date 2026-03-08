import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: Retrieve character's event history and XP progression
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const staffAccess = user && isStaff(user.role);

  // Verify character access
  const character = staffAccess
    ? await prisma.character.findUnique({ where: { id } })
    : await prisma.character.findFirst({ where: { id, userId: session.user.id } });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Fetch event history for this character
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId: character.userId,
      checkedOutAt: { not: null }, // Only events they've completed
    },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          date: true,
          endDate: true,
          location: true,
        },
      },
    },
    orderBy: {
      checkedOutAt: "asc",
    },
  });

  // Calculate total XP
  const totalXP = registrations.reduce((sum, reg) => sum + (reg.xpEarned ?? 0), 0);
  const totalNPCMinutes = registrations.reduce((sum, reg) => sum + (reg.npcMinutes ?? 0), 0);

  // Parse character data to get current level
  const characterData = JSON.parse(character.data);
  const currentLevel = characterData.level ?? 1;

  // Format event history
  const eventHistory = registrations.map((reg) => ({
    eventId: reg.event.id,
    eventTitle: reg.event.name,
    startDate: reg.event.date,
    endDate: reg.event.endDate,
    location: reg.event.location,
    xpEarned: reg.xpEarned ?? 0,
    npcMinutes: reg.npcMinutes ?? 0,
    checkedInAt: reg.checkedInAt,
    checkedOutAt: reg.checkedOutAt,
  }));

  return NextResponse.json({
    characterId: character.id,
    characterName: character.name,
    currentLevel,
    totalXP,
    totalNPCMinutes,
    eventsAttended: eventHistory.length,
    eventHistory,
  });
}
