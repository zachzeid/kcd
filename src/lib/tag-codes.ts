import { prisma } from "@/lib/prisma";

/**
 * Assign the next sequential tag code to an item submission.
 * Starts at 1001 to give a professional 4-digit appearance.
 */
const TAG_CODE_START = 1001;

export async function assignTagCode(itemId: string): Promise<number> {
  // Find the current max tagCode
  const result = await prisma.itemSubmission.aggregate({
    _max: { tagCode: true },
  });

  const nextCode = Math.max((result._max.tagCode ?? 0) + 1, TAG_CODE_START);

  await prisma.itemSubmission.update({
    where: { id: itemId },
    data: { tagCode: nextCode },
  });

  return nextCode;
}
