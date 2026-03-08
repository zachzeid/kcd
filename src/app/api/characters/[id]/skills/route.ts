import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({
    characterClass: charData.characterClass,
    race: charData.race,
    level: charData.level || 1,
    skills: charData.skills || [],
    skillPointsAvailable: charData.skillPointsAvailable || 0,
    skillPointsSpent: charData.skillPointsSpent || 0,
    name: charData.name,
    status: character.status,
  });
}

// POST: Save updated skills after level-up skill purchasing
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

  if (!["approved", "checked_out"].includes(character.status)) {
    return NextResponse.json({
      error: "Character must be approved or checked out to purchase skills",
    }, { status: 403 });
  }

  const charData = JSON.parse(character.data);
  const available = charData.skillPointsAvailable || 0;

  // Calculate how many new points were spent
  const previousSpent = charData.skillPointsSpent || 0;
  const newPointsUsed = skillPointsSpent - previousSpent;

  if (newPointsUsed < 0) {
    return NextResponse.json({ error: "Invalid skill point calculation" }, { status: 400 });
  }

  if (newPointsUsed > available) {
    return NextResponse.json({ error: "Not enough skill points available" }, { status: 400 });
  }

  const updatedCharData = {
    ...charData,
    skills,
    skillPointsSpent,
    skillPointsAvailable: available - newPointsUsed,
  };

  await prisma.character.update({
    where: { id },
    data: { data: JSON.stringify(updatedCharData) },
  });

  return NextResponse.json({
    success: true,
    skillPointsAvailable: updatedCharData.skillPointsAvailable,
    skillPointsSpent: updatedCharData.skillPointsSpent,
  });
}
