import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import {
  PROFESSION_RATES,
  skillLevelToTier,
  craftLevelToTier,
  formatSilver,
  STARTING_SILVER,
} from "@/lib/economy";

interface EarningEntry {
  characterId: string;
  skillName: string;
  skillLevel: number;
  isWinter?: boolean;
}

// POST: Batch process profession earnings for an event period
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessEconomy(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json();
  const { earnings } = body as { earnings: EarningEntry[] };

  if (!earnings || !Array.isArray(earnings) || earnings.length === 0) {
    return NextResponse.json(
      { error: "earnings array is required and must not be empty" },
      { status: 400 }
    );
  }

  const results: Array<{
    characterId: string;
    skillName: string;
    tier: string;
    amount: number;
    amountFormatted: string;
    newBalance: number;
    newBalanceFormatted: string;
  }> = [];

  const errors: Array<{ characterId: string; error: string }> = [];

  for (const entry of earnings) {
    const { characterId, skillName, skillLevel, isWinter } = entry;

    // Verify character exists
    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      errors.push({ characterId, error: "Character not found" });
      continue;
    }

    // Determine tier: use craftLevelToTier for 5-level skills, skillLevelToTier for 9-level
    const tier = skillLevel <= 5
      ? craftLevelToTier(skillLevel)
      : skillLevelToTier(skillLevel);

    const season = isWinter ? "winter" : "standard";
    const amount = PROFESSION_RATES[tier][season];

    // Get or create bank
    let bank = await prisma.playerBank.findUnique({ where: { characterId } });
    if (!bank) {
      bank = await prisma.playerBank.create({
        data: { characterId, balance: STARTING_SILVER },
      });
    }

    const newBalance = bank.balance + amount;

    // Create transaction and update balance
    await prisma.bankTransaction.create({
      data: {
        bankId: bank.id,
        type: "profession_earning",
        amount,
        description: `${skillName} (${tier}, ${season}) profession earning`,
        processedBy: session.user.id,
      },
    });

    await prisma.playerBank.update({
      where: { id: bank.id },
      data: { balance: newBalance },
    });

    results.push({
      characterId,
      skillName,
      tier,
      amount,
      amountFormatted: formatSilver(amount),
      newBalance,
      newBalanceFormatted: formatSilver(newBalance),
    });
  }

  return NextResponse.json({
    processed: results.length,
    errors: errors.length > 0 ? errors : undefined,
    results,
  });
}
