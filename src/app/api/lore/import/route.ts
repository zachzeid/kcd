import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Bulk import lore entries and characters (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { entries, characters } = await req.json();
  let entriesCreated = 0;
  let charsCreated = 0;

  if (entries && Array.isArray(entries)) {
    for (const e of entries) {
      try {
        await prisma.loreEntry.create({
          data: {
            title: e.title,
            content: e.content,
            summary: e.summary,
            source: e.source,
            sourceUrl: e.sourceUrl ?? null,
            date: e.date ?? null,
            year: e.year ?? null,
            month: e.month ?? null,
            locations: e.locations ? JSON.stringify(e.locations) : null,
            characters: e.characters ? JSON.stringify(e.characters) : null,
            tags: e.tags ? JSON.stringify(e.tags) : null,
            category: e.category ?? "story",
          },
        });
        entriesCreated++;
      } catch {
        // Skip duplicates or errors
      }
    }
  }

  if (characters && Array.isArray(characters)) {
    for (const c of characters) {
      try {
        await prisma.loreCharacter.upsert({
          where: { name: c.name },
          create: {
            name: c.name,
            title: c.title ?? null,
            race: c.race ?? null,
            class: c.class ?? null,
            faction: c.faction ?? null,
            description: c.description ?? null,
            firstMentioned: c.firstMentioned ?? null,
          },
          update: {
            title: c.title ?? undefined,
            race: c.race ?? undefined,
            class: c.class ?? undefined,
            faction: c.faction ?? undefined,
            description: c.description ?? undefined,
          },
        });
        charsCreated++;
      } catch {
        // Skip errors
      }
    }
  }

  return NextResponse.json({ entriesCreated, charsCreated });
}
