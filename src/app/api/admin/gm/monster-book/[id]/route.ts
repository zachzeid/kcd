import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// PATCH: Update monster book entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const entry = await prisma.monsterBookEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Monster not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.category !== undefined) data.category = body.category?.trim() || null;
  if (body.race !== undefined) data.race = body.race?.trim() || null;
  if (body.level !== undefined) data.level = body.level;
  if (body.bodyPoints !== undefined) data.bodyPoints = body.bodyPoints;
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.abilities !== undefined) data.abilities = body.abilities ? JSON.stringify(body.abilities) : null;
  if (body.resistances !== undefined) data.resistances = body.resistances ? JSON.stringify(body.resistances) : null;
  if (body.weaknesses !== undefined) data.weaknesses = body.weaknesses ? JSON.stringify(body.weaknesses) : null;
  if (body.loot !== undefined) data.loot = body.loot ? JSON.stringify(body.loot) : null;
  if (body.tags !== undefined) data.tags = body.tags ? JSON.stringify(body.tags) : null;

  const updated = await prisma.monsterBookEntry.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE: Delete monster book entry
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const entry = await prisma.monsterBookEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Monster not found" }, { status: 404 });
  }

  // Check if used in any encounters
  const usedCount = await prisma.encounterNPC.count({ where: { monsterBookId: id } });
  if (usedCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: used in ${usedCount} encounter(s)` },
      { status: 409 }
    );
  }

  await prisma.monsterBookEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
