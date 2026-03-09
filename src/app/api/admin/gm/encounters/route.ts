import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// GET: List encounters
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const encounters = await prisma.encounter.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      characters: { include: { } },
      events: true,
      npcs: { include: { monsterBook: { select: { name: true, category: true } } } },
    },
  });

  // Resolve character names
  const charIds = encounters.flatMap((e) => e.characters.map((c) => c.characterId));
  const chars = charIds.length > 0
    ? await prisma.character.findMany({
        where: { id: { in: charIds } },
        select: { id: true, name: true },
      })
    : [];
  const charMap = Object.fromEntries(chars.map((c) => [c.id, c.name]));

  // Resolve event names
  const eventIds = encounters.flatMap((e) => e.events.map((ev) => ev.eventId));
  const evts = eventIds.length > 0
    ? await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, name: true },
      })
    : [];
  const eventMap = Object.fromEntries(evts.map((e) => [e.id, e.name]));

  // Resolve creator names
  const creatorIds = [...new Set(encounters.map((e) => e.createdBy))];
  const creators = creatorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, name: true },
      })
    : [];
  const creatorMap = Object.fromEntries(creators.map((u) => [u.id, u.name]));

  const result = encounters.map((enc) => ({
    id: enc.id,
    name: enc.name,
    description: enc.description,
    status: enc.status,
    signOutId: enc.signOutId,
    createdBy: enc.createdBy,
    createdByName: creatorMap[enc.createdBy] ?? "Unknown",
    completedAt: enc.completedAt?.toISOString() ?? null,
    createdAt: enc.createdAt.toISOString(),
    characters: enc.characters.map((c) => ({
      id: c.id,
      characterId: c.characterId,
      characterName: charMap[c.characterId] ?? "Unknown",
      notes: c.notes,
    })),
    events: enc.events.map((ev) => ({
      id: ev.id,
      eventId: ev.eventId,
      eventName: eventMap[ev.eventId] ?? "Unknown",
    })),
    npcs: enc.npcs.map((npc) => ({
      id: npc.id,
      monsterBookId: npc.monsterBookId,
      monsterName: npc.monsterBook?.name ?? npc.customName ?? "Custom NPC",
      monsterCategory: npc.monsterBook?.category ?? null,
      customName: npc.customName,
      customStats: npc.customStats,
      notes: npc.notes,
    })),
  }));

  return NextResponse.json(result);
}

// POST: Create encounter
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, signOutId } = body as {
    name: string;
    description?: string;
    signOutId?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const encounter = await prisma.encounter.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      signOutId: signOutId || null,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json(encounter, { status: 201 });
}
