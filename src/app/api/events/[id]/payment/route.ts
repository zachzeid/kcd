import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentUrl } from "@/lib/squarespace";

// GET: Get payment URL for a registered event
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

  if (registration.paymentStatus === "paid") {
    return NextResponse.json({ error: "Already paid", paymentStatus: "paid" }, { status: 400 });
  }

  const paymentUrl = getPaymentUrl(registration.ticketType);

  return NextResponse.json({ paymentUrl, ticketType: registration.ticketType });
}
