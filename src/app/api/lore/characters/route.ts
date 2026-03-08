import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: List lore characters with optional search
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const unassigned = searchParams.get("unassigned") === "true";

  const where: Record<string, unknown> = {};
  if (q) {
    where.name = { contains: q };
  }
  if (unassigned) {
    where.assignedToId = null;
  }

  const characters = await prisma.loreCharacter.findMany({
    where,
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json(characters);
}

// POST: Create a lore character (staff only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, title, race, class: charClass, faction, description, firstMentioned } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await prisma.loreCharacter.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "Character already exists" }, { status: 409 });
  }

  const character = await prisma.loreCharacter.create({
    data: {
      name,
      title: title ?? null,
      race: race ?? null,
      class: charClass ?? null,
      faction: faction ?? null,
      description: description ?? null,
      firstMentioned: firstMentioned ?? null,
    },
  });

  return NextResponse.json(character);
}
