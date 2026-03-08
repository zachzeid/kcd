import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import { verifyPaymentByEmail } from "@/lib/squarespace";

// POST: Confirm or verify payment for a registration
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!staff || !isStaff(staff.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const { registrationId, action } = await req.json();

  if (!registrationId || !["confirm", "comp", "verify"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!registration || registration.eventId !== eventId) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  if (action === "verify") {
    // Check Squarespace Orders API for matching payment
    const result = await verifyPaymentByEmail(registration.user.email);
    return NextResponse.json({
      verified: result.found,
      orders: result.orders,
      userName: registration.user.name,
      userEmail: registration.user.email,
    });
  }

  // confirm = manually mark as paid, comp = mark as comped (free)
  const newStatus = action === "comp" ? "comped" : "paid";

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      paymentStatus: newStatus,
      amountPaid: newStatus === "comped" ? 0 : registration.amountPaid,
    },
  });

  return NextResponse.json({ success: true, paymentStatus: newStatus });
}
