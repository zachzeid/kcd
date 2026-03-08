import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditOwnCharacters } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// POST: Submit character for review
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canEditOwnCharacters(user.role)) {
    return NextResponse.json(
      { error: "Staff with character review privileges cannot modify their own characters" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (!["draft", "rejected"].includes(character.status)) {
    return NextResponse.json(
      { error: "Character cannot be submitted in its current status" },
      { status: 403 }
    );
  }

  await prisma.character.update({
    where: { id },
    data: {
      status: "pending_review",
      submittedAt: new Date(),
      reviewNotes: null,
    },
  });

  await logAudit({
    characterId: id,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "submitted",
  });

  return NextResponse.json({ success: true });
}
