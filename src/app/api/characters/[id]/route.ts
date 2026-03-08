import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: Load a single character's full data
// Players can only access their own characters; staff can access any
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

  if (staffAccess) {
    const character = await prisma.character.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: character.id,
      name: character.name,
      status: character.status,
      reviewNotes: character.reviewNotes,
      data: JSON.parse(character.data),
      userName: character.user.name,
      userEmail: character.user.email,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    });
  }

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: character.id,
    name: character.name,
    status: character.status,
    reviewNotes: character.reviewNotes,
    data: JSON.parse(character.data),
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  });
}
