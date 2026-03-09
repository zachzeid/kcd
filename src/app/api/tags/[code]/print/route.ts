import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";

// POST: Mark a tag as printed (one-time only)
// Allowed: owning player OR economy_marshal/admin
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const tagCode = parseInt(code, 10);
  if (isNaN(tagCode)) {
    return NextResponse.json({ error: "Invalid tag code" }, { status: 400 });
  }

  const item = await prisma.itemSubmission.findUnique({
    where: { tagCode },
    include: { character: { select: { userId: true } } },
  });

  if (!item) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  if (item.status !== "approved") {
    return NextResponse.json({ error: "Tag must be approved before printing" }, { status: 400 });
  }

  // Authorization: owning player OR economy staff
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const isOwner = item.character.userId === session.user.id;
  const isEcon = user && canAccessEconomy(user.role);

  if (!isOwner && !isEcon) {
    return NextResponse.json({ error: "Not authorized to print this tag" }, { status: 403 });
  }

  // Atomic: only update if printedAt is still null.
  // This eliminates the race condition — only one concurrent request can succeed.
  const result = await prisma.itemSubmission.updateMany({
    where: { tagCode, printedAt: null },
    data: { printedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Tag has already been printed" }, { status: 409 });
  }

  return NextResponse.json({ success: true, printedAt: new Date().toISOString() });
}
