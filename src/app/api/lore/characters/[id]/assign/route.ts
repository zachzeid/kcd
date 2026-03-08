import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Assign a lore character to a user (GM only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actor || !["admin", "gm"].includes(actor.role)) {
    return NextResponse.json({ error: "Only GMs can assign lore characters" }, { status: 403 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  const loreChar = await prisma.loreCharacter.findUnique({ where: { id } });
  if (!loreChar) {
    return NextResponse.json({ error: "Lore character not found" }, { status: 404 });
  }

  if (userId) {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  await prisma.loreCharacter.update({
    where: { id },
    data: { assignedToId: userId || null },
  });

  return NextResponse.json({ success: true });
}
