import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCBD } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// POST: Remove inactive label from a character (CBD only)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessCBD(user.role)) {
    return NextResponse.json({ error: "CBD access required" }, { status: 403 });
  }

  const { id } = await params;

  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (!character.inactive) {
    return NextResponse.json({ error: "Character is not inactive" }, { status: 400 });
  }

  await prisma.character.update({
    where: { id },
    data: { inactive: false },
  });

  await logAudit({
    characterId: id,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "reactivated",
    details: { previousStatus: character.status },
  });

  return NextResponse.json({ success: true });
}
