import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// POST: Add character to encounter
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
  const { characterId, notes } = body as { characterId: string; notes?: string };

  if (!characterId) {
    return NextResponse.json({ error: "characterId is required" }, { status: 400 });
  }

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Check for duplicate
  const existing = await prisma.encounterCharacter.findUnique({
    where: { encounterId_characterId: { encounterId: id, characterId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Character already in encounter" }, { status: 409 });
  }

  const entry = await prisma.encounterCharacter.create({
    data: { encounterId: id, characterId, notes: notes?.trim() || null },
  });

  return NextResponse.json({ ...entry, characterName: character.name }, { status: 201 });
}

// DELETE: Remove character from encounter
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
  const { characterId } = (await req.json()) as { characterId: string };

  const entry = await prisma.encounterCharacter.findUnique({
    where: { encounterId_characterId: { encounterId: id, characterId } },
  });
  if (!entry) {
    return NextResponse.json({ error: "Character not in encounter" }, { status: 404 });
  }

  await prisma.encounterCharacter.delete({ where: { id: entry.id } });
  return NextResponse.json({ success: true });
}
