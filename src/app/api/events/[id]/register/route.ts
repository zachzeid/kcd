import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductPrice } from "@/lib/squarespace";

// GET: Fetch current user's registration for this event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId } },
  });

  if (!registration) {
    return NextResponse.json({ error: "Not registered for this event" }, { status: 404 });
  }

  return NextResponse.json(registration);
}

const VALID_TICKET_TYPES = [
  "single_a", "single_b", "day_pass",
  "season_t1a", "season_t1b", "season_t1c",
  "season_t2a", "season_t2b", "season_t2c",
];

// POST: Register for an event / update registration
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const { ticketType, arfSigned } = await req.json();

  if (!ticketType || !VALID_TICKET_TYPES.includes(ticketType)) {
    return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!["upcoming", "active"].includes(event.status)) {
    return NextResponse.json({ error: "Event is not open for registration" }, { status: 403 });
  }

  // Calculate price from Squarespace product mapping or event-specific pricing
  let amount = getProductPrice(ticketType);
  if (amount === 0) {
    switch (ticketType) {
      case "single_a": amount = event.ticketPriceA; break;
      case "single_b": amount = event.ticketPriceB; break;
      case "day_pass": amount = event.dayPassPrice; break;
    }
  }

  const currentYear = new Date().getFullYear();

  const registration = await prisma.eventRegistration.upsert({
    where: {
      userId_eventId: { userId: session.user.id, eventId },
    },
    create: {
      userId: session.user.id,
      eventId,
      ticketType,
      amountPaid: amount,
      paymentStatus: "unpaid",
      arfSignedAt: arfSigned ? new Date() : null,
      arfYear: arfSigned ? currentYear : null,
    },
    update: {
      ticketType,
      amountPaid: amount,
      arfSignedAt: arfSigned ? new Date() : undefined,
      arfYear: arfSigned ? currentYear : undefined,
    },
  });

  return NextResponse.json(registration);
}
