import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

// GET: Get a user's characters (staff only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!staff || !isStaff(staff.role)) {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }

  const { userId } = await params;

  const characters = await prisma.character.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      status: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(characters);
}
