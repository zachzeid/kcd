import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_ROLES, canManageUsers } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

async function requireUserManager() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canManageUsers(user.role)) return null;
  return user;
}

// GET: List all users (admin only)
export async function GET() {
  const admin = await requireUserManager();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { characters: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// PATCH: Update user role (admin only)
export async function PATCH(req: NextRequest) {
  const admin = await requireUserManager();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();
  if (!userId || !ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const previousRole = targetUser.role;
  await prisma.user.update({ where: { id: userId }, data: { role } });

  // Log role change against all of the user's characters
  const characters = await prisma.character.findMany({
    where: { userId },
    select: { id: true },
  });

  for (const char of characters) {
    await logAudit({
      characterId: char.id,
      actorId: admin.id,
      actorName: admin.name,
      actorRole: admin.role,
      action: "status_change",
      details: { type: "role_changed", previousRole, newRole: role, userId },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Delete a user (admin only)
export async function DELETE(req: NextRequest) {
  const admin = await requireUserManager();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
