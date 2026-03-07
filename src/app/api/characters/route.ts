import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List current user's characters
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(characters);
}

// POST: Create or update a character
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, data } = await req.json();

    if (!name || !data) {
      return NextResponse.json({ error: "Missing name or data" }, { status: 400 });
    }

    if (id) {
      // Update existing
      const existing = await prisma.character.findFirst({
        where: { id, userId: session.user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Character not found" }, { status: 404 });
      }
      const updated = await prisma.character.update({
        where: { id },
        data: { name, data: JSON.stringify(data) },
      });
      return NextResponse.json({ id: updated.id, name: updated.name });
    }

    // Create new
    const created = await prisma.character.create({
      data: {
        userId: session.user.id,
        name,
        data: JSON.stringify(data),
      },
    });
    return NextResponse.json({ id: created.id, name: created.name });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a character
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing character id" }, { status: 400 });
  }

  const existing = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  await prisma.character.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
