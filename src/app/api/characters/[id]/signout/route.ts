import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// GET: Fetch existing sign-out for a character + event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: characterId } = await params;
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId query param is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const staffAccess = user && isStaff(user.role);

  // Verify character access
  const character = staffAccess
    ? await prisma.character.findUnique({ where: { id: characterId } })
    : await prisma.character.findFirst({ where: { id: characterId, userId: session.user.id } });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const signOut = await prisma.characterSignOut.findUnique({
    where: { characterId_eventId: { characterId, eventId } },
    include: {
      event: { select: { id: true, name: true, date: true, endDate: true } },
      character: { select: { id: true, name: true } },
    },
  });

  if (!signOut) {
    return NextResponse.json({ error: "Sign-out not found" }, { status: 404 });
  }

  return NextResponse.json(signOut);
}

// POST: Create or update a sign-out form
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: characterId } = await params;

  // Must be character owner
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: session.user.id },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.inactive) {
    return NextResponse.json({
      error: "This character is inactive. Contact CBD staff to reactivate.",
    }, { status: 403 });
  }

  const body = await req.json();
  const {
    eventId,
    npcMinutes,
    npcDetails,
    staffMinutes,
    staffDetails,
    lifeCreditsLost,
    skillsLearned,
    skillsTaught,
    eventRating,
    roleplayQuality,
    enjoyedEncounters,
    dislikedEncounters,
    notableRoleplay,
    atmosphereFeedback,
    betweenEventAction,
    betweenEventDetails,
  } = body;

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  // Find the registration for this user + event
  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId } },
  });

  if (!registration) {
    return NextResponse.json({ error: "No registration found for this event" }, { status: 404 });
  }

  // Check if sign-out already exists
  const existing = await prisma.characterSignOut.findUnique({
    where: { characterId_eventId: { characterId, eventId } },
  });

  const signOutData = {
    npcMinutes: npcMinutes ?? 0,
    npcDetails: npcDetails || null,
    staffMinutes: staffMinutes ?? 0,
    staffDetails: staffDetails || null,
    lifeCreditsLost: lifeCreditsLost ?? 0,
    skillsLearned: skillsLearned ? JSON.stringify(skillsLearned) : null,
    skillsTaught: skillsTaught ? JSON.stringify(skillsTaught) : null,
    eventRating: eventRating ?? null,
    roleplayQuality: roleplayQuality || null,
    enjoyedEncounters: enjoyedEncounters || null,
    dislikedEncounters: dislikedEncounters || null,
    notableRoleplay: notableRoleplay || null,
    atmosphereFeedback: atmosphereFeedback || null,
    betweenEventAction: betweenEventAction || "nothing",
    betweenEventDetails: betweenEventDetails ? JSON.stringify(betweenEventDetails) : null,
  };

  if (existing) {
    // Only allow update if still pending
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Sign-out has already been processed and cannot be edited" },
        { status: 400 }
      );
    }

    // 24-hour edit window from submission
    const hoursSinceCreation = (Date.now() - new Date(existing.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { error: "Sign-out can only be edited within 24 hours of submission" },
        { status: 400 }
      );
    }

    const updated = await prisma.characterSignOut.update({
      where: { id: existing.id },
      data: signOutData,
    });

    return NextResponse.json(updated);
  }

  // Create new sign-out
  const signOut = await prisma.characterSignOut.create({
    data: {
      characterId,
      userId: session.user.id,
      eventId,
      registrationId: registration.id,
      ...signOutData,
    },
  });

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true },
  });

  await logAudit({
    characterId,
    actorId: session.user.id,
    actorName: actor?.name ?? "Unknown",
    actorRole: actor?.role ?? "user",
    action: "signout_submitted",
    details: { eventId },
  });

  return NextResponse.json(signOut);
}
