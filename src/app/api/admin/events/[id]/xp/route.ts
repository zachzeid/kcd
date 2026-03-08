import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// POST: Award XP and NPC minutes to event attendees
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
  const { registrationId, xpEarned, npcMinutes } = await req.json();

  if (typeof xpEarned !== "number" || xpEarned < 0 || xpEarned > 100) {
    return NextResponse.json({ error: "Invalid XP amount (0-100)" }, { status: 400 });
  }

  if (typeof npcMinutes !== "number" || npcMinutes < 0) {
    return NextResponse.json({ error: "Invalid NPC minutes" }, { status: 400 });
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration || registration.eventId !== eventId) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  if (!registration.checkedOutAt) {
    return NextResponse.json({ 
      error: "Player must be checked out before awarding XP" 
    }, { status: 400 });
  }

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { 
      xpEarned,
      npcMinutes,
    },
  });

  return NextResponse.json({ 
    success: true,
    xpEarned,
    npcMinutes,
  });
}
