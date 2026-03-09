import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";

// GET: List item submissions (default: pending)
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
  const status = searchParams.get("status") ?? "pending";
  const itemType = searchParams.get("itemType");

  const where: Record<string, string> = { status };
  if (itemType) {
    where.itemType = itemType;
  }

  const rawItems = await prisma.itemSubmission.findMany({
    where,
    include: {
      user: { select: { name: true } },
      character: { select: { name: true } },
      event: { select: { name: true } },
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
    craftingTime: item.craftingTime,
    primaryMaterial: item.primaryMaterial,
    secondaryMaterial: item.secondaryMaterial,
    masterCrafted: item.masterCrafted,
    extraDetails: item.extraDetails,
    status: item.status,
    characterName: item.character.name,
    playerName: item.user.name,
    eventName: item.event?.name ?? null,
    submittedAt: item.createdAt.toISOString(),
    processedBy: item.processedBy,
    processNotes: item.processNotes,
  }));

  return NextResponse.json({ items });
}
