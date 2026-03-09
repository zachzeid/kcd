import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// POST: Remove/revoke a tag from a character
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
  const body = await req.json().catch(() => ({}));
  const reason = (body as { reason?: string }).reason ?? "";

  const tag = await prisma.itemSubmission.findUnique({
    where: { id },
    include: { character: { select: { name: true } } },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  if (tag.status === "removed") {
    return NextResponse.json({ error: "Tag is already removed" }, { status: 400 });
  }

  await prisma.itemSubmission.update({
    where: { id },
    data: { status: "removed" },
  });

  await logAudit({
    characterId: tag.characterId,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "tag_removed",
    details: {
      tagCode: tag.tagCode,
      itemName: tag.itemName,
      itemType: tag.itemType,
      reason: reason || null,
    },
  });

  return NextResponse.json({
    success: true,
    tagCode: tag.tagCode,
    characterName: tag.character.name,
  });
}
