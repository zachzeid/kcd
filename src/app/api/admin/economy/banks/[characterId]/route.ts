import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { formatSilver } from "@/lib/economy";

// GET: Get single bank with recent transactions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { characterId } = await params;

  const bank = await prisma.playerBank.findUnique({
    where: { characterId },
    include: {
      character: {
        select: {
          id: true,
          name: true,
          user: { select: { id: true, name: true } },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!bank) {
    return NextResponse.json({ error: "Bank not found for this character" }, { status: 404 });
  }

  return NextResponse.json({
    bank: {
      id: bank.id,
      characterId: bank.characterId,
      characterName: bank.character.name,
      playerName: bank.character.user.name,
      balance: bank.balance,
      balanceFormatted: formatSilver(bank.balance),
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
      transactions: bank.transactions,
    },
  });
}
