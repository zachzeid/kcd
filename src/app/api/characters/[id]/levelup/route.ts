import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelFromXP, STARTING_SKILL_POINTS, xpTable } from "@/data/xp-table";

// GET: Get character's XP, level, and skill point summary
// Level is automatically derived from total XP — no manual level-up needed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Calculate total XP from all processed events
  const registrations = await prisma.eventRegistration.findMany({
    where: {
      userId: session.user.id,
      xpEarned: { gt: 0 },
    },
    select: {
      xpEarned: true,
      event: { select: { name: true, date: true } },
    },
  });

  const totalXP = registrations.reduce((sum, reg) => sum + reg.xpEarned, 0);
  const charData = JSON.parse(character.data);
  const level = levelFromXP(totalXP);
  const totalSP = STARTING_SKILL_POINTS + totalXP;
  const skillPointsSpent = charData.skillPointsSpent || 0;
  const skillPointsAvailable = totalSP - skillPointsSpent;
  const nextLevelXP = level < xpTable.length ? xpTable[level] : null;

  return NextResponse.json({
    level,
    totalXP,
    totalSkillPoints: totalSP,
    skillPointsSpent,
    skillPointsAvailable,
    xpNeededForNextLevel: nextLevelXP !== null ? nextLevelXP - totalXP : 0,
    eventHistory: registrations.map((r) => ({
      eventName: r.event.name,
      eventDate: r.event.date,
      xpEarned: r.xpEarned,
    })),
  });
}
