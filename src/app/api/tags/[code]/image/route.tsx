import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTagImageResponse } from "@/lib/tag-image";

// GET: Generate and serve tag image as PNG
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const tagCode = parseInt(code, 10);

  if (isNaN(tagCode)) {
    return new Response("Invalid tag code", { status: 400 });
  }

  const item = await prisma.itemSubmission.findUnique({
    where: { tagCode },
  });

  if (!item) {
    return new Response("Tag not found", { status: 404 });
  }

  return generateTagImageResponse({
    tagCode: item.tagCode!,
    itemType: item.itemType,
    itemName: item.itemName,
    craftingSkill: item.craftingSkill,
    craftingLevel: item.craftingLevel,
    masterCrafted: item.masterCrafted,
    quantity: item.quantity,
  });
}
