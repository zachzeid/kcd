import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: List tags/items assigned to a character
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

  const rawItems = await prisma.itemSubmission.findMany({
    where: {
      characterId: id,
      status: "approved", // Players only see approved tags
      ...(eventId ? { eventId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const items = rawItems.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    itemName: item.itemName,
    itemDescription: item.itemDescription,
    craftingSkill: item.craftingSkill,
    craftingLevel: item.craftingLevel,
    quantity: item.quantity,
    primaryMaterial: item.primaryMaterial,
    secondaryMaterial: item.secondaryMaterial,
    masterCrafted: item.masterCrafted,
    status: item.status,
    tagCode: item.tagCode,
    createdAt: item.createdAt.toISOString(),
  }));

  return NextResponse.json({ items });
}
