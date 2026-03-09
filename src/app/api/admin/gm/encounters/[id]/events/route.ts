import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// POST: Assign event to encounter
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const { eventId } = (await req.json()) as { eventId: string };

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const encounter = await prisma.encounter.findUnique({ where: { id } });
  if (!encounter) {
    return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existing = await prisma.encounterEvent.findUnique({
    where: { encounterId_eventId: { encounterId: id, eventId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Event already assigned" }, { status: 409 });
  }

  const entry = await prisma.encounterEvent.create({
    data: { encounterId: id, eventId },
  });

  return NextResponse.json({ ...entry, eventName: event.name }, { status: 201 });
}

// DELETE: Unassign event from encounter
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const { eventId } = (await req.json()) as { eventId: string };

  const entry = await prisma.encounterEvent.findUnique({
    where: { encounterId_eventId: { encounterId: id, eventId } },
  });
  if (!entry) {
    return NextResponse.json({ error: "Event not assigned" }, { status: 404 });
  }

  await prisma.encounterEvent.delete({ where: { id: entry.id } });
  return NextResponse.json({ success: true });
}
