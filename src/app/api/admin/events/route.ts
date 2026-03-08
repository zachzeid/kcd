import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: List all events with registration details (staff only)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      registrations: {
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { registrations: true } },
    },
  });

  return NextResponse.json(
    events.map((e) => ({
      ...e,
      registrations: e.registrations.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        ticketType: r.ticketType,
        paymentStatus: r.paymentStatus,
        arfSignedAt: r.arfSignedAt,
        arfYear: r.arfYear,
        checkedInAt: r.checkedInAt,
        checkedOutAt: r.checkedOutAt,
        xpEarned: r.xpEarned,
        npcMinutes: r.npcMinutes,
      })),
    }))
  );
}
