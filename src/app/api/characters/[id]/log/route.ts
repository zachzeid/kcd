import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: Fetch audit log for a character
// Players see logs for their own characters; staff can see any
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const staffAccess = user && isStaff(user.role);

  // Verify access
  const character = staffAccess
    ? await prisma.character.findUnique({ where: { id }, select: { id: true } })
    : await prisma.character.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const logs = await prisma.auditLog.findMany({
    where: { characterId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      actorName: l.actorName,
      actorRole: l.actorRole,
      action: l.action,
      details: l.details ? JSON.parse(l.details) : null,
      createdAt: l.createdAt,
    }))
  );
}
