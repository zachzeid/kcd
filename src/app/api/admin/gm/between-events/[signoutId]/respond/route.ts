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
  const { response } = body as { response: string };

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

  return NextResponse.json({
    signOut: {
      id: updated.id,
      betweenEventAction: updated.betweenEventAction,
      betweenEventDetails: JSON.parse(updated.betweenEventDetails!),
    },
  });
}
