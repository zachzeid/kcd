import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditOwnCharacters } from "@/lib/roles";
import { logAudit } from "@/lib/audit";
import { refreshInactiveForUser } from "@/lib/inactive";

// GET: List current user's characters (with unread audit logs)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Refresh inactive flags before returning the list
  await refreshInactiveForUser(session.user.id);

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      inactive: true,
      reviewNotes: true,
      reviewedAt: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          actorName: true,
          actorRole: true,
          action: true,
          details: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(characters);
}

async function getActorInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });
  return { name: user?.name ?? "Unknown", role: user?.role ?? "user" };
}

// POST: Create or update a character
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await getActorInfo(session.user.id);

  // Staff with review roles cannot modify their own characters
  if (!canEditOwnCharacters(actor.role)) {
    return NextResponse.json(
      { error: "Staff with character review privileges cannot modify their own characters" },
      { status: 403 }
    );
  }

  try {
    const { id, name, data } = await req.json();

    if (!name || !data) {
      return NextResponse.json({ error: "Missing name or data" }, { status: 400 });
    }

    if (id) {
      // Update existing — only if player owns it and it's editable
      const existing = await prisma.character.findFirst({
        where: { id, userId: session.user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Character not found" }, { status: 404 });
      }
      if (existing.inactive) {
        return NextResponse.json(
          { error: "This character is inactive. Contact CBD staff to reactivate." },
          { status: 403 }
        );
      }
      if (!["draft", "rejected"].includes(existing.status)) {
        return NextResponse.json(
          { error: "Character cannot be edited in its current status" },
          { status: 403 }
        );
      }
      const updated = await prisma.character.update({
        where: { id },
        data: { name, data: JSON.stringify(data), status: "draft", reviewNotes: null },
      });

      await logAudit({
        characterId: id,
        actorId: session.user.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "updated",
        details: { name },
      });

      return NextResponse.json({ id: updated.id, name: updated.name });
    }

    // Create new
    const created = await prisma.character.create({
      data: {
        userId: session.user.id,
        name,
        data: JSON.stringify(data),
        status: "draft",
      },
    });

    await logAudit({
      characterId: created.id,
      actorId: session.user.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: "created",
      details: { name },
    });

    return NextResponse.json({ id: created.id, name: created.name });
  } catch (err) {
    console.error("Character save error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: Delete a character (only drafts/rejected)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actor = await getActorInfo(session.user.id);

  if (!canEditOwnCharacters(actor.role)) {
    return NextResponse.json(
      { error: "Staff with character review privileges cannot modify their own characters" },
      { status: 403 }
    );
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

  if (existing.inactive) {
    return NextResponse.json(
      { error: "This character is inactive. Contact CBD staff to reactivate." },
      { status: 403 }
    );
  }

  if (!["draft", "rejected"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Only draft or rejected characters can be deleted" },
      { status: 403 }
    );
  }

  // Log before deletion (cascade will remove logs too, but this is for the record)
  await logAudit({
    characterId: id,
    actorId: session.user.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: "deleted",
    details: { name: existing.name },
  });

  await prisma.character.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
