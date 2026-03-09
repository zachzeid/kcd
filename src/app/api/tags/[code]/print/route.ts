import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Mark a tag as printed (one-time only, by the owning player)
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

  // Only the owning player can print
  if (item.character.userId !== session.user.id) {
    return NextResponse.json({ error: "Not your tag" }, { status: 403 });
  }

  if (item.printedAt) {
    return NextResponse.json({ error: "Tag has already been printed" }, { status: 400 });
  }

  if (item.status !== "approved") {
    return NextResponse.json({ error: "Tag must be approved before printing" }, { status: 400 });
  }

  await prisma.itemSubmission.update({
    where: { tagCode },
    data: { printedAt: new Date() },
  });

  return NextResponse.json({ success: true, printedAt: new Date().toISOString() });
}
