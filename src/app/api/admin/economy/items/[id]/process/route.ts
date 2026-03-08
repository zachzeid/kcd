import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";

// POST: Approve or deny an item submission
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, notes } = body as { action: string; notes?: string };

  if (!action || !["approve", "deny"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'deny'." },
      { status: 400 }
    );
  }

  const item = await prisma.itemSubmission.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item submission not found" }, { status: 404 });
  }

  if (item.status !== "pending") {
    return NextResponse.json(
      { error: `Item submission already ${item.status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.itemSubmission.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "denied",
      processedBy: session.user.id,
      processedAt: new Date(),
      processNotes: notes ?? null,
      tagIssued: action === "approve",
    },
  });

  return NextResponse.json({ item: updated });
}
