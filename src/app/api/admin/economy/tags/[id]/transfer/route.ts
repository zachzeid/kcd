import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// POST: Transfer a tag from one character to another
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const { targetCharacterId } = await req.json();

  if (!targetCharacterId) {
    return NextResponse.json({ error: "targetCharacterId is required" }, { status: 400 });
  }

  const tag = await prisma.itemSubmission.findUnique({
    where: { id },
    include: { character: { select: { id: true, name: true } } },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  if (tag.status === "removed") {
    return NextResponse.json({ error: "Cannot transfer a removed tag" }, { status: 400 });
  }

  if (tag.itemType === "coin_award") {
    return NextResponse.json({ error: "Coin awards cannot be transferred" }, { status: 400 });
  }

  if (tag.characterId === targetCharacterId) {
    return NextResponse.json({ error: "Tag is already assigned to this character" }, { status: 400 });
  }

  const targetCharacter = await prisma.character.findUnique({
    where: { id: targetCharacterId },
    select: { id: true, name: true, userId: true },
  });

  if (!targetCharacter) {
    return NextResponse.json({ error: "Target character not found" }, { status: 404 });
  }

  const fromName = tag.character?.name ?? "Unassigned";

  // Transfer: update characterId and userId to new owner
  await prisma.itemSubmission.update({
    where: { id },
    data: {
      characterId: targetCharacterId,
      userId: targetCharacter.userId,
    },
  });

  // Log on source character (skip if no source character, e.g. staff request assignment)
  if (tag.characterId) {
    await logAudit({
      characterId: tag.characterId,
      actorId: session.user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "tag_transferred",
      details: {
        tagCode: tag.tagCode,
        itemName: tag.itemName,
        direction: "out",
        toCharacter: targetCharacter.name,
      },
    });
  }

  // Log on target character
  await logAudit({
    characterId: targetCharacterId,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "tag_transferred",
    details: {
      tagCode: tag.tagCode,
      itemName: tag.itemName,
      direction: "in",
      fromCharacter: fromName,
    },
  });

  return NextResponse.json({
    success: true,
    tagCode: tag.tagCode,
    fromCharacter: fromName,
    toCharacter: targetCharacter.name,
  });
}
