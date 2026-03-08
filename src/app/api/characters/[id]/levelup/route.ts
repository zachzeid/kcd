import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xpTable } from "@/data/xp-table";

// GET: Get character's XP and level-up eligibility
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

  // Calculate total XP from all events
  const registrations = await prisma.eventRegistration.findMany({
    where: { 
      userId: session.user.id,
      checkedOutAt: { not: null },
    },
    select: {
      xpEarned: true,
      eventId: true,
      event: {
        select: {
          name: true,
          date: true,
        },
      },
    },
  });

  const totalXP = registrations.reduce((sum, reg) => sum + reg.xpEarned, 0);
  
  // Parse current character data
  const charData = JSON.parse(character.data);
  const currentLevel = charData.level || 1;
  const currentXP = charData.totalXP || 0;
  const availableXP = currentXP + totalXP;

  // Find eligible level
  let eligibleLevel = currentLevel;
  for (let i = currentLevel; i < xpTable.length; i++) {
    if (availableXP >= xpTable[i]) {
      eligibleLevel = i + 1;
    } else {
      break;
    }
  }

  const canLevelUp = eligibleLevel > currentLevel;
  const skillPointsPerLevel = 20; // Standard skill points per level
  const skillPointsToGain = canLevelUp ? (eligibleLevel - currentLevel) * skillPointsPerLevel : 0;

  return NextResponse.json({
    currentLevel,
    currentXP,
    eventXP: totalXP,
    totalXP: availableXP,
    eligibleLevel,
    canLevelUp,
    skillPointsToGain,
    xpNeededForNextLevel: currentLevel < xpTable.length ? xpTable[currentLevel] - availableXP : 0,
    eventHistory: registrations.map(r => ({
      eventName: r.event.name,
      eventDate: r.event.date,
      xpEarned: r.xpEarned,
    })),
  });
}

// POST: Level up character
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { targetLevel } = await req.json();

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Only allow leveling of checked_out or approved characters
  if (!["approved", "checked_out"].includes(character.status)) {
    return NextResponse.json({ 
      error: "Character must be approved or checked out to level up" 
    }, { status: 403 });
  }

  // Calculate total XP
  const registrations = await prisma.eventRegistration.findMany({
    where: { 
      userId: session.user.id,
      checkedOutAt: { not: null },
    },
    select: { xpEarned: true },
  });

  const totalEventXP = registrations.reduce((sum, reg) => sum + reg.xpEarned, 0);
  
  const charData = JSON.parse(character.data);
  const currentLevel = charData.level || 1;
  const currentXP = charData.totalXP || 0;
  const availableXP = currentXP + totalEventXP;

  // Validate target level
  if (targetLevel <= currentLevel || targetLevel > 30) {
    return NextResponse.json({ error: "Invalid target level" }, { status: 400 });
  }

  if (availableXP < xpTable[targetLevel - 1]) {
    return NextResponse.json({ error: "Insufficient XP for this level" }, { status: 400 });
  }

  // Update character with new level and XP
  const skillPointsGained = (targetLevel - currentLevel) * 20;
  const updatedCharData = {
    ...charData,
    level: targetLevel,
    totalXP: availableXP,
    skillPointsAvailable: (charData.skillPointsAvailable || 0) + skillPointsGained,
  };

  await prisma.character.update({
    where: { id },
    data: { 
      data: JSON.stringify(updatedCharData),
    },
  });

  return NextResponse.json({ 
    success: true,
    newLevel: targetLevel,
    skillPointsGained,
    totalXP: availableXP,
  });
}
