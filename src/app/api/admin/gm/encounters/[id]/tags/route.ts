import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// POST: Request tags for encounter characters (creates pending ItemSubmissions for econ approval)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { items } = body as {
    items: Array<{
      characterId: string;
      itemType: string;
      itemName: string;
      itemDescription?: string;
      craftingSkill: string;
      craftingLevel: number;
      quantity?: number;
    }>;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const encounter = await prisma.encounter.findUnique({
    where: { id },
    include: { characters: true },
  });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const encounterCharIds = new Set(encounter.characters.map((c) => c.characterId));

  const created = [];
  for (const item of items) {
    if (!encounterCharIds.has(item.characterId)) {
      return NextResponse.json(
        { error: `Character ${item.characterId} is not in this encounter` },
        { status: 400 }
      );
    }

    const character = await prisma.character.findUnique({
      where: { id: item.characterId },
      select: { userId: true },
    });
    if (!character) continue;

    const submission = await prisma.itemSubmission.create({
      data: {
        userId: character.userId,
        characterId: item.characterId,
        itemType: item.itemType,
        itemName: item.itemName,
        itemDescription: item.itemDescription || null,
        craftingSkill: item.craftingSkill,
        craftingLevel: item.craftingLevel,
        quantity: item.quantity || 1,
        status: "pending",
        extraDetails: JSON.stringify({ source: "encounter", encounterId: id }),
      },
    });
    created.push(submission);
  }

  return NextResponse.json({ created: created.length, items: created }, { status: 201 });
}
