import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !isStaff(user.role)) return null;
  return user;
}

// GET: List all characters with optional status filter (staff only)
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = status ? { status } : {};

  const characters = await prisma.character.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    characters.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      reviewNotes: c.reviewNotes,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt,
      submittedAt: c.submittedAt,
      userName: c.user.name,
      userEmail: c.user.email,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  );
}

// DELETE: Delete any character (admin only)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const character = await prisma.character.findUnique({ where: { id } });

  if (character) {
    await logAudit({
      characterId: id,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "deleted",
      details: { name: character.name, deletedByAdmin: true },
    });
  }

  await prisma.character.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
