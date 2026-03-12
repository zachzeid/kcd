import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch all chronicle entries for a specific character
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const entries = await prisma.characterChronicle.findMany({
    where: { characterId: id },
    include: {
      chronicle: {
        include: {
          event: { select: { id: true, name: true, date: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      eventId: e.chronicle.eventId,
      eventName: e.chronicle.event.name,
      eventDate: e.chronicle.event.date,
      chronicleTitle: e.chronicle.title,
      summary: e.summary,
      createdAt: e.createdAt,
    }))
  );
}
