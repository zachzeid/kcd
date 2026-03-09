import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Resolve a tag code to item data (JSON) or redirect
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const tagCode = parseInt(code, 10);

  if (isNaN(tagCode)) {
    return NextResponse.json({ error: "Invalid tag code" }, { status: 400 });
  }

  const item = await prisma.itemSubmission.findUnique({
    where: { tagCode },
    include: {
      character: { select: { id: true, name: true } },
      user: { select: { name: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // If Accept header prefers HTML, redirect to the tag page
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL(`/t/${tagCode}`, req.url));
  }

  // Return JSON for API consumers
  return NextResponse.json({
    tagCode: item.tagCode,
    itemType: item.itemType,
    itemName: item.itemName,
    itemDescription: item.itemDescription,
    craftingSkill: item.craftingSkill,
    craftingLevel: item.craftingLevel,
    quantity: item.quantity,
    masterCrafted: item.masterCrafted,
    primaryMaterial: item.primaryMaterial,
    secondaryMaterial: item.secondaryMaterial,
    characterName: item.character.name,
    characterId: item.character.id,
    playerName: item.user.name,
    status: item.status,
    imageUrl: `/api/tags/${tagCode}/image`,
  });
}
