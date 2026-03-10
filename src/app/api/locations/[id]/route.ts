import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

async function requireGM() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) return null;
  return user;
}

// PUT: Update a location (GM/admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireGM();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const { name, type, region, description } = await req.json();

  try {
    const updated = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(type !== undefined && { type }),
        ...(region !== undefined && { region: region?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "A location with that name already exists" }, { status: 409 });
    }
    throw err;
  }
}

// DELETE: Remove a location (GM/admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireGM();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
