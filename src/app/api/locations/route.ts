import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessGM } from "@/lib/roles";

// GET: List all locations (public)
export async function GET() {
  const locations = await prisma.location.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(locations);
}

// POST: Create a new location (GM/admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessGM(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, type, region, description } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        type: type || "town",
        region: region?.trim() || null,
        description: description?.trim() || null,
      },
    });
    return NextResponse.json(location);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "A location with that name already exists" }, { status: 409 });
    }
    throw err;
  }
}
