import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { formatSilver } from "@/lib/economy";

// GET: List all player banks
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const banks = await prisma.playerBank.findMany({
    include: {
      character: {
        select: {
          name: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { character: { name: "asc" } },
  });

  const result = banks.map((bank) => ({
    id: bank.id,
    characterId: bank.characterId,
    characterName: bank.character.name,
    playerName: bank.character.user.name,
    balance: bank.balance,
    balanceFormatted: formatSilver(bank.balance),
    createdAt: bank.createdAt,
    updatedAt: bank.updatedAt,
  }));

  return NextResponse.json({ banks: result });
}
