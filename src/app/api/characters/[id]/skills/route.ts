import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STARTING_SKILL_POINTS } from "@/data/xp-table";

// GET: Get character's current skills and available skill points
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

  const charData = JSON.parse(character.data);

  // Total SP = starting 140 + all earned XP
  const totalXP = charData.totalXP || 0;
  const totalSP = STARTING_SKILL_POINTS + totalXP;
  const skillPointsSpent = charData.skillPointsSpent || 0;
  const skillPointsAvailable = totalSP - skillPointsSpent;

  return NextResponse.json({
    characterClass: charData.characterClass,
    race: charData.race,
    level: charData.level || 1,
    skills: charData.skills || [],
    skillPointsAvailable,
    skillPointsSpent,
    totalSkillPoints: totalSP,
    totalXP,
    name: charData.name,
    status: character.status,
  });
}

// POST: Save updated skills after purchasing with XP/SP
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { skills, skillPointsSpent } = await req.json();

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.inactive) {
    return NextResponse.json({
      error: "This character is inactive. Contact CBD staff to reactivate.",
    }, { status: 403 });
  }

  if (!["approved", "checked_out"].includes(character.status)) {
    return NextResponse.json({
      error: "Character must be approved or checked out to purchase skills",
    }, { status: 403 });
  }

  const charData = JSON.parse(character.data);

  // Total SP = starting 140 + all earned XP
  const totalXP = charData.totalXP || 0;
  const totalSP = STARTING_SKILL_POINTS + totalXP;

  if (skillPointsSpent > totalSP) {
    return NextResponse.json({ error: "Not enough skill points available" }, { status: 400 });
  }

  const updatedCharData = {
    ...charData,
    skills,
    skillPointsSpent,
  };

  await prisma.character.update({
    where: { id },
    data: { data: JSON.stringify(updatedCharData) },
  });

  return NextResponse.json({
    success: true,
    skillPointsAvailable: totalSP - skillPointsSpent,
    skillPointsSpent,
    totalSkillPoints: totalSP,
  });
}
