import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: Search/browse lore entries
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const year = searchParams.get("year");
  const category = searchParams.get("category");
  const character = searchParams.get("character");
  const location = searchParams.get("location");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (q) {
    conditions.push("(title LIKE ? OR content LIKE ? OR summary LIKE ? OR characters LIKE ? OR locations LIKE ?)");
    const pattern = `%${q}%`;
    params.push(pattern, pattern, pattern, pattern, pattern);
  }
  if (year) {
    conditions.push("year = ?");
    params.push(parseInt(year));
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (character) {
    conditions.push("characters LIKE ?");
    params.push(`%${character}%`);
  }
  if (location) {
    conditions.push("locations LIKE ?");
    params.push(`%${location}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Use raw query for full-text search across JSON fields
  const countResult = await prisma.$queryRawUnsafe<[{ count: number }]>(
    `SELECT COUNT(*) as count FROM LoreEntry ${where}`,
    ...params
  );
  const total = Number(countResult[0].count);

  const entries = await prisma.$queryRawUnsafe<Array<{
    id: string; title: string; summary: string; source: string;
    sourceUrl: string | null; date: string | null; year: number | null;
    characters: string | null; locations: string | null; tags: string | null;
    category: string; createdAt: string;
  }>>(
    `SELECT id, title, summary, source, sourceUrl, date, year, characters, locations, tags, category, createdAt
     FROM LoreEntry ${where}
     ORDER BY year DESC, month DESC
     LIMIT ? OFFSET ?`,
    ...params, limit, skip
  );

  return NextResponse.json({
    entries: entries.map((e) => ({
      ...e,
      characters: e.characters ? JSON.parse(e.characters) : [],
      locations: e.locations ? JSON.parse(e.locations) : [],
      tags: e.tags ? JSON.parse(e.tags) : [],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST: Create a lore entry (staff only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, summary, source, sourceUrl, date, year, month, locations, characters, tags, category } = await req.json();

  if (!title || !content || !summary || !source) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prisma.loreEntry.create({
    data: {
      title,
      content,
      summary,
      source,
      sourceUrl: sourceUrl ?? null,
      date: date ?? null,
      year: year ?? null,
      month: month ?? null,
      locations: locations ? JSON.stringify(locations) : null,
      characters: characters ? JSON.stringify(characters) : null,
      tags: tags ? JSON.stringify(tags) : null,
      category: category ?? "story",
    },
  });

  return NextResponse.json(entry);
}
