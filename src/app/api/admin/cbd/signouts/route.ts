import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCBD } from "@/lib/roles";

// GET: List sign-outs for CBD staff
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessCBD(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const eventId = req.nextUrl.searchParams.get("eventId");

  const where: Record<string, unknown> = { status };
  if (eventId) {
    where.eventId = eventId;
  }

  const signOuts = await prisma.characterSignOut.findMany({
    where,
    include: {
      character: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, name: true, date: true, endDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(signOuts);
}
