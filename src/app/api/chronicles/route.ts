import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List event chronicles (optionally filtered by eventId)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  const chronicles = await prisma.eventChronicle.findMany({
    where: eventId ? { eventId } : {},
    include: {
      event: { select: { id: true, name: true, date: true } },
      characters: {
        include: {
          character: { select: { id: true, name: true, data: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    chronicles.map((c) => ({
      id: c.id,
      eventId: c.eventId,
      eventName: c.event.name,
      eventDate: c.event.date,
      title: c.title,
      recap: c.recap,
      narrative: c.narrative,
      locations: c.locations ? JSON.parse(c.locations) : [],
      tags: c.tags ? JSON.parse(c.tags) : [],
      messageCount: c.messageCount,
      createdAt: c.createdAt,
      characters: c.characters.map((cc) => {
        const data = JSON.parse(cc.character.data as string);
        return {
          id: cc.id,
          characterId: cc.characterId,
          characterName: data.name,
          race: data.race,
          characterClass: data.characterClass,
          summary: cc.summary,
        };
      }),
    }))
  );
}
