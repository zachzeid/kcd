import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get event recap with attendance details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { checkedInAt: "desc" },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    name: event.name,
    date: event.date,
    endDate: event.endDate,
    location: event.location,
    status: event.status,
    ticketPriceA: event.ticketPriceA,
    ticketPriceB: event.ticketPriceB,
    dayPassPrice: event.dayPassPrice,
    registrations: event.registrations.map((r) => ({
      id: r.id,
      userName: r.user.name,
      userEmail: r.user.email,
      ticketType: r.ticketType,
      paymentStatus: r.paymentStatus,
      arfSignedAt: r.arfSignedAt,
      checkedInAt: r.checkedInAt,
      checkedOutAt: r.checkedOutAt,
      xpEarned: r.xpEarned,
      npcMinutes: r.npcMinutes,
    })),
  });
}
