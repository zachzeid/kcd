import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import { formatSilver, STARTING_SILVER } from "@/lib/economy";

// GET: View own bank balance and transaction history
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

  // Verify character exists and user has access
  const character = staffAccess
    ? await prisma.character.findUnique({ where: { id } })
    : await prisma.character.findFirst({ where: { id, userId: session.user.id } });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Get or create bank
  let bank = await prisma.playerBank.findUnique({
    where: { characterId: id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!bank) {
    bank = await prisma.playerBank.create({
      data: { characterId: id, balance: STARTING_SILVER },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
  }

  return NextResponse.json({
    bank: {
      id: bank.id,
      characterId: bank.characterId,
      balance: bank.balance,
      balanceFormatted: formatSilver(bank.balance),
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
      transactions: bank.transactions,
    },
  });
}
