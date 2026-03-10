import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// POST: Request resources (tags/coin) for an encounter (creates pending ItemSubmissions for econ approval)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { items, reason } = body as {
    reason?: string;
    items: Array<{
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

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const created = [];
  for (const item of items) {
    const submission = await prisma.itemSubmission.create({
      data: {
        userId: session.user.id, // requesting staff member
        characterId: null, // not character-specific; econ transfers tags later
        itemType: item.itemType,
        itemName: item.itemName,
        itemDescription: item.itemDescription || null,
        craftingSkill: item.craftingSkill,
        craftingLevel: item.craftingLevel,
        quantity: item.quantity || 1,
        status: "pending",
        extraDetails: JSON.stringify({
          source: "encounter",
          encounterId: id,
          encounterName: encounter.name,
          requestedByRole: user.role,
          requestedByName: user.name,
          reason: reason || null,
        }),
      },
    });
    created.push(submission);
  }

  return NextResponse.json({ created: created.length, items: created }, { status: 201 });
}
