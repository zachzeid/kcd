import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { assignTagCode } from "@/lib/tag-codes";
import { logAudit } from "@/lib/audit";
import { getTagUrl } from "@/lib/tag-image";

// GET: List all tags (optionally filtered by status, characterId)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get("characterId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (characterId) where.characterId = characterId;
  if (status) where.status = status;

  const rawTags = await prisma.itemSubmission.findMany({
    where,
    include: {
      character: { select: { id: true, name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tags = rawTags.map((tag) => {
    // Determine source: econ_created, gm_encounter, or player_signout
    let source = "player_signout";
    let extraParsed: Record<string, unknown> | null = null;
    if (tag.extraDetails) {
      try {
        extraParsed = JSON.parse(tag.extraDetails);
      } catch { /* ignore */ }
    }
    if (extraParsed?.source === "encounter") {
      source = "gm_encounter";
    } else if (tag.processedBy && tag.status === "approved" && !tag.extraDetails) {
      // Econ-created tags are immediately approved with processedBy set and no extraDetails
      source = "econ_created";
    }

    return {
      id: tag.id,
      tagCode: tag.tagCode,
      itemType: tag.itemType,
      itemName: tag.itemName,
      itemDescription: tag.itemDescription,
      craftingSkill: tag.craftingSkill,
      craftingLevel: tag.craftingLevel,
      quantity: tag.quantity,
      primaryMaterial: tag.primaryMaterial,
      secondaryMaterial: tag.secondaryMaterial,
      masterCrafted: tag.masterCrafted,
      status: tag.status,
      source,
      characterId: tag.character.id,
      characterName: tag.character.name,
      playerName: tag.user.name,
      tagUrl: tag.tagCode ? getTagUrl(tag.tagCode) : null,
      printedAt: tag.printedAt?.toISOString() ?? null,
      createdAt: tag.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ tags });
}

// POST: Create a new tag and assign it to a character (immediately approved)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const {
    characterId,
    itemType,
    itemName,
    itemDescription,
    craftingSkill,
    craftingLevel,
    quantity,
    craftingTime,
    primaryMaterial,
    secondaryMaterial,
    masterCrafted,
    extraDetails,
    eventId,
  } = body as {
    characterId: string;
    itemType: string;
    itemName: string;
    itemDescription?: string;
    craftingSkill: string;
    craftingLevel: number;
    quantity?: number;
    craftingTime?: string;
    primaryMaterial?: string;
    secondaryMaterial?: string;
    masterCrafted?: boolean;
    extraDetails?: string;
    eventId?: string;
  };

  if (!characterId || !itemType || !itemName || !craftingSkill || craftingLevel === undefined) {
    return NextResponse.json(
      { error: "characterId, itemType, itemName, craftingSkill, and craftingLevel are required" },
      { status: 400 }
    );
  }

  // Verify character exists
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true, name: true, userId: true },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Create the tag — immediately approved since Economy is creating it
  const item = await prisma.itemSubmission.create({
    data: {
      userId: character.userId,
      characterId,
      eventId: eventId ?? null,
      itemType,
      itemName,
      itemDescription: itemDescription ?? null,
      craftingSkill,
      craftingLevel,
      quantity: quantity ?? 1,
      craftingTime: craftingTime ?? null,
      primaryMaterial: primaryMaterial ?? null,
      secondaryMaterial: secondaryMaterial ?? null,
      masterCrafted: masterCrafted ?? false,
      extraDetails: extraDetails
        ? typeof extraDetails === "string"
          ? extraDetails
          : JSON.stringify(extraDetails)
        : null,
      status: "approved",
      processedBy: session.user.id,
      processedAt: new Date(),
      tagIssued: true,
    },
  });

  // Assign tag code
  const tagCode = await assignTagCode(item.id);

  await logAudit({
    characterId,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "tag_created",
    details: {
      tagCode,
      itemType,
      itemName,
      craftingSkill,
      craftingLevel,
      quantity: quantity ?? 1,
      masterCrafted: masterCrafted ?? false,
    },
  });

  return NextResponse.json({
    tag: { ...item, tagCode },
    tagUrl: getTagUrl(tagCode),
    tagImageUrl: `/api/tags/${tagCode}/image`,
  }, { status: 201 });
}
