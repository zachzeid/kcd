import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: List item submissions for a character (optionally filtered by eventId)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const eventId = req.nextUrl.searchParams.get("eventId");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const staffAccess = user && isStaff(user.role);

  // Verify character exists and user has access
  const character = staffAccess
    ? await prisma.character.findUnique({ where: { id } })
    : await prisma.character.findFirst({ where: { id, userId: session.user.id } });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const items = await prisma.itemSubmission.findMany({
    where: { characterId: id, ...(eventId ? { eventId } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

// POST: Submit an item creation request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Must be character owner
  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
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

  if (!itemType || !itemName || !craftingSkill || craftingLevel === undefined) {
    return NextResponse.json(
      { error: "itemType, itemName, craftingSkill, and craftingLevel are required" },
      { status: 400 }
    );
  }

  const item = await prisma.itemSubmission.create({
    data: {
      userId: session.user.id,
      characterId: id,
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
      extraDetails: extraDetails ?? null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
