import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// GET: List monster book entries
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const categoryFilter = req.nextUrl.searchParams.get("category");
  const excludeCategory = req.nextUrl.searchParams.get("excludeCategory");

  const where: Record<string, unknown> = {};
  if (categoryFilter) where.category = categoryFilter;
  if (excludeCategory) where.category = { not: excludeCategory };

  const entries = await prisma.monsterBookEntry.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(entries.map((e) => ({
    ...e,
    abilities: e.abilities ? JSON.parse(e.abilities) : [],
    resistances: e.resistances ? JSON.parse(e.resistances) : [],
    weaknesses: e.weaknesses ? JSON.parse(e.weaknesses) : [],
    loot: e.loot ? JSON.parse(e.loot) : null,
    tags: e.tags ? JSON.parse(e.tags) : [],
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  })));
}

// POST: Create monster book entry
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
  const { name, category, race, level, bodyPoints, description, abilities, resistances, weaknesses, loot, tags } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const entry = await prisma.monsterBookEntry.create({
    data: {
      name: name.trim(),
      category: category?.trim() || null,
      race: race?.trim() || null,
      level: level ?? 1,
      bodyPoints: bodyPoints ?? 1,
      description: description?.trim() || null,
      abilities: abilities ? JSON.stringify(abilities) : null,
      resistances: resistances ? JSON.stringify(resistances) : null,
      weaknesses: weaknesses ? JSON.stringify(weaknesses) : null,
      loot: loot ? JSON.stringify(loot) : null,
      tags: tags ? JSON.stringify(tags) : null,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
