import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { assignTagCode } from "@/lib/tag-codes";
import { getTagUrl, getTagImageUrl } from "@/lib/tag-image";
import { logAudit } from "@/lib/audit";

// POST: Approve or deny an item submission
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
  const body = await req.json();
  const { action, notes } = body as { action: string; notes?: string };

  if (!action || !["approve", "deny"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'deny'." },
      { status: 400 }
    );
  }

  const item = await prisma.itemSubmission.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item submission not found" }, { status: 404 });
  }

  if (item.status !== "pending") {
    return NextResponse.json(
      { error: `Item submission already ${item.status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.itemSubmission.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "denied",
      processedBy: session.user.id,
      processedAt: new Date(),
      processNotes: notes ?? null,
      tagIssued: action === "approve",
    },
  });

  // On approval, assign a sequential tag code and return tag URLs
  if (action === "approve") {
    const tagCode = await assignTagCode(id);

    await logAudit({
      characterId: item.characterId,
      actorId: session.user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "tag_approved",
      details: { itemId: id, itemName: item.itemName, itemType: item.itemType, tagCode },
    });

    return NextResponse.json({
      item: { ...updated, tagCode },
      tagUrl: getTagUrl(tagCode),
      tagImageUrl: getTagImageUrl(tagCode),
    });
  }

  await logAudit({
    characterId: item.characterId,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "tag_denied",
    details: { itemId: id, itemName: item.itemName, itemType: item.itemType, notes: notes ?? null },
  });

  return NextResponse.json({ item: updated });
}
