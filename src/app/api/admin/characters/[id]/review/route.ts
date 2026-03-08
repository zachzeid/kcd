import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReviewCharacters } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// POST: Approve or reject a character
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewer = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!reviewer || !canReviewCharacters(reviewer.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action, notes } = await req.json();

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "reject" && (!notes || !notes.trim())) {
    return NextResponse.json(
      { error: "Notes are required when requesting changes" },
      { status: 400 }
    );
  }

  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.status !== "pending_review") {
    return NextResponse.json(
      { error: "Character is not pending review" },
      { status: 403 }
    );
  }

  // Staff cannot review their own characters
  if (character.userId === reviewer.id) {
    return NextResponse.json(
      { error: "You cannot review your own character" },
      { status: 403 }
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  await prisma.character.update({
    where: { id },
    data: {
      status: newStatus,
      reviewNotes: notes?.trim() || null,
      reviewedBy: reviewer.id,
      reviewedAt: new Date(),
    },
  });

  await logAudit({
    characterId: id,
    actorId: reviewer.id,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    action: action === "approve" ? "approved" : "rejected",
    details: { notes: notes?.trim() || null, previousStatus: character.status },
  });

  return NextResponse.json({ success: true });
}
