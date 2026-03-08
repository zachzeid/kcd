import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// POST: Check in/out a player for an event
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
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const { registrationId, action, characterId } = await req.json();

  if (!["checkin", "checkout"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: { 
      user: { 
        select: { id: true, name: true },
      },
    },
  });

  if (!registration || registration.eventId !== eventId) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Verify payment status
  if (registration.paymentStatus === "unpaid") {
    return NextResponse.json({ error: "Payment required before check-in" }, { status: 403 });
  }

  // Verify ARF signed
  if (!registration.arfSignedAt) {
    return NextResponse.json({ error: "ARF must be signed before check-in" }, { status: 403 });
  }

  if (action === "checkin") {
    // Verify character exists and belongs to user
    if (characterId) {
      const character = await prisma.character.findFirst({
        where: { 
          id: characterId, 
          userId: registration.userId,
          status: "approved",
        },
      });

      if (!character) {
        return NextResponse.json({ 
          error: "Character not found or not approved" 
        }, { status: 404 });
      }

      // Update character status to checked_in
      await prisma.character.update({
        where: { id: characterId },
        data: { status: "checked_in" },
      });
    }

    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        checkedInAt: new Date(),
        characterId: characterId || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      action: "checkin",
      message: `${registration.user.name} checked in successfully`,
    });
  }

  if (action === "checkout") {
    if (!registration.checkedInAt) {
      return NextResponse.json({ error: "Not checked in" }, { status: 400 });
    }

    const charId = registration.characterId;

    if (charId) {
      // Update character status to checked_out
      const character = await prisma.character.findUnique({ where: { id: charId } });
      if (character && character.status === "checked_in") {
        await prisma.character.update({
          where: { id: charId },
          data: { status: "checked_out" },
        });
      }
    }

    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { checkedOutAt: new Date() },
    });

    return NextResponse.json({ 
      success: true, 
      action: "checkout",
      message: `${registration.user.name} checked out successfully`,
    });
  }

  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}
