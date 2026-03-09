import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// POST: Add NPC to encounter
export async function POST(
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
  const body = await req.json();
  const { monsterBookId, customName, customStats, notes } = body as {
    monsterBookId?: string;
    customName?: string;
    customStats?: string;
    notes?: string;
  };

  if (!monsterBookId && !customName) {
    return NextResponse.json(
      { error: "Either monsterBookId or customName is required" },
      { status: 400 }
    );
  }

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  if (monsterBookId) {
    const monster = await prisma.monsterBookEntry.findUnique({ where: { id: monsterBookId } });
    if (!monster) {
      return NextResponse.json({ error: "Monster not found" }, { status: 404 });
    }
  }

  const npc = await prisma.encounterNPC.create({
    data: {
      encounterId: id,
      monsterBookId: monsterBookId || null,
      customName: customName?.trim() || null,
      customStats: customStats || null,
      notes: notes?.trim() || null,
    },
    include: { monsterBook: { select: { name: true, category: true } } },
  });

  return NextResponse.json({
    id: npc.id,
    monsterBookId: npc.monsterBookId,
    monsterName: npc.monsterBook?.name ?? npc.customName ?? "Custom NPC",
    monsterCategory: npc.monsterBook?.category ?? null,
    customName: npc.customName,
    customStats: npc.customStats,
    notes: npc.notes,
  }, { status: 201 });
}

// DELETE: Remove NPC from encounter
export async function DELETE(
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
  const { npcId } = (await req.json()) as { npcId: string };

  const npc = await prisma.encounterNPC.findFirst({
    where: { id: npcId, encounterId: id },
  });
  if (!npc) {
    return NextResponse.json({ error: "NPC not in encounter" }, { status: 404 });
  }

  await prisma.encounterNPC.delete({ where: { id: npcId } });
  return NextResponse.json({ success: true });
}
