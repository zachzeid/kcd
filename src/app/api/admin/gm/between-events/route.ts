import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// GET: List between-event actions from sign-outs
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const signOuts = await prisma.characterSignOut.findMany({
    where: {
      betweenEventAction: { not: "nothing" },
    },
    include: {
      character: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const results = signOuts.map((so) => ({
    id: so.id,
    characterId: so.characterId,
    characterName: so.character.name,
    userId: so.userId,
    playerName: so.user.name,
    eventId: so.eventId,
    eventName: so.event.name,
    betweenEventAction: so.betweenEventAction,
    betweenEventDetails: so.betweenEventDetails
      ? JSON.parse(so.betweenEventDetails)
      : null,
    createdAt: so.createdAt,
  }));

  return NextResponse.json({ betweenEvents: results });
}
