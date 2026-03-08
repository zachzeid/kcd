import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCBD } from "@/lib/roles";
import { calculateSignOutXP } from "@/lib/economy";

// POST: Process or reject a sign-out
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessCBD(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const { action, notes } = await req.json();

  if (!action || !["process", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Must be 'process' or 'reject'" }, { status: 400 });
  }

  const signOut = await prisma.characterSignOut.findUnique({
    where: { id },
    include: {
      event: { select: { date: true, endDate: true } },
      registration: true,
    },
  });

  if (!signOut) {
    return NextResponse.json({ error: "Sign-out not found" }, { status: 404 });
  }

  if (signOut.status !== "pending") {
    return NextResponse.json({ error: "Sign-out has already been processed" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.characterSignOut.update({
      where: { id },
      data: {
        status: "rejected",
        processedBy: session.user.id,
        processedAt: new Date(),
        processNotes: notes || null,
      },
    });

    return NextResponse.json(updated);
  }

  // Processing: calculate XP
  const eventStart = new Date(signOut.event.date);
  const eventEnd = signOut.event.endDate ? new Date(signOut.event.endDate) : eventStart;

  // Calculate event days: 1 for day events, 2 for weekend events
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / msPerDay);
  const eventDays = daysDiff >= 1 ? 2 : 1;

  const xpAwarded = calculateSignOutXP(eventDays, signOut.npcMinutes);

  // Update sign-out and registration in a transaction
  const [updatedSignOut] = await prisma.$transaction([
    prisma.characterSignOut.update({
      where: { id },
      data: {
        status: "processed",
        processedBy: session.user.id,
        processedAt: new Date(),
        processNotes: notes || null,
        xpAwarded,
      },
    }),
    prisma.eventRegistration.update({
      where: { id: signOut.registrationId },
      data: {
        xpEarned: xpAwarded,
        npcMinutes: signOut.npcMinutes,
      },
    }),
  ]);

  return NextResponse.json({ ...updatedSignOut, xpAwarded });
}
