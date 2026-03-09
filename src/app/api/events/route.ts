import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff, canAccessGM } from "@/lib/roles";

// GET: List events — all users can see upcoming/active events
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const staffAccess = user && isStaff(user.role);

  // Staff see all events; players see upcoming, active, and completed
  const where = staffAccess ? {} : { status: { in: ["upcoming", "active", "completed"] } };

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" },
    include: { _count: { select: { registrations: true } } },
  });

  // Also get current user's registrations and sign-out statuses
  const [myRegistrations, mySignOuts] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { userId: session.user.id },
      select: { eventId: true, ticketType: true, paymentStatus: true, arfSignedAt: true },
    }),
    prisma.characterSignOut.findMany({
      where: { userId: session.user.id },
      select: { eventId: true, status: true },
    }),
  ]);

  const regMap = Object.fromEntries(myRegistrations.map((r) => [r.eventId, r]));
  const signOutMap = Object.fromEntries(mySignOuts.map((s) => [s.eventId, s.status]));

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      endDate: e.endDate,
      location: e.location,
      description: e.description,
      ticketPriceA: e.ticketPriceA,
      ticketPriceB: e.ticketPriceB,
      dayPassPrice: e.dayPassPrice,
      status: e.status,
      registrationCount: e._count.registrations,
      myRegistration: regMap[e.id] || null,
      mySignOutStatus: signOutMap[e.id] || null,
    }))
  );
}

// POST: Create event (staff only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, date, endDate, location, description, ticketPriceA, ticketPriceB, dayPassPrice } = await req.json();

  if (!name || !date) {
    return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
  }

  try {
    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        description: description || null,
        ticketPriceA: ticketPriceA ?? 3500,
        ticketPriceB: ticketPriceB ?? 4500,
        dayPassPrice: dayPassPrice ?? 2000,
      },
    });

    return NextResponse.json(event);
  } catch (err) {
    console.error("Event creation error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
