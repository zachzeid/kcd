import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// POST: GM responds to a between-event action
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signoutId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { signoutId } = await params;
  const body = await req.json();
  const { response, createEncounter, encounterName } = body as {
    response: string;
    createEncounter?: boolean;
    encounterName?: string;
  };

  if (!response || typeof response !== "string" || response.trim().length === 0) {
    return NextResponse.json({ error: "Response text is required" }, { status: 400 });
  }

  const signOut = await prisma.characterSignOut.findUnique({
    where: { id: signoutId },
  });

  if (!signOut) {
    return NextResponse.json({ error: "Sign-out not found" }, { status: 404 });
  }

  if (signOut.betweenEventAction === "nothing") {
    return NextResponse.json(
      { error: "This sign-out has no between-event action to respond to" },
      { status: 400 }
    );
  }

  // Parse existing details, add GM response
  let details: Record<string, unknown> = {};
  if (signOut.betweenEventDetails) {
    try {
      details = JSON.parse(signOut.betweenEventDetails);
    } catch {
      details = { rawDetails: signOut.betweenEventDetails };
    }
  }

  details.gmResponse = response;
  details.gmRespondedBy = session.user.id;
  details.gmRespondedByName = user.name;
  details.gmRespondedAt = new Date().toISOString();

  const updated = await prisma.characterSignOut.update({
    where: { id: signoutId },
    data: {
      betweenEventDetails: JSON.stringify(details),
    },
  });

  // Optionally create an encounter from this sign-out
  let encounter = null;
  if (createEncounter) {
    // Prevent duplicate encounters from the same sign-out
    const existing = await prisma.encounter.findFirst({
      where: { signOutId: signoutId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An encounter has already been created from this sign-out" },
        { status: 409 }
      );
    }

    const encName = encounterName?.trim() || `Encounter from ${signOut.betweenEventAction} (${signoutId.slice(0, 8)})`;
    encounter = await prisma.encounter.create({
      data: {
        name: encName,
        description: `Created from BEA response for sign-out ${signoutId}`,
        signOutId: signoutId,
        createdBy: session.user.id,
      },
    });

    // Auto-add the sign-out's character to the encounter
    if (signOut.characterId) {
      await prisma.encounterCharacter.create({
        data: {
          encounterId: encounter.id,
          characterId: signOut.characterId,
        },
      });
    }
  }

  return NextResponse.json({
    signOut: {
      id: updated.id,
      betweenEventAction: updated.betweenEventAction,
      betweenEventDetails: JSON.parse(updated.betweenEventDetails!),
    },
    encounter: encounter ? { id: encounter.id, name: encounter.name } : null,
  });
}
