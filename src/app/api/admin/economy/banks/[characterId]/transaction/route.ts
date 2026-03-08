import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEconomy } from "@/lib/roles";
import { formatSilver, STARTING_SILVER } from "@/lib/economy";

const VALID_TRANSACTION_TYPES = [
  "deposit",
  "withdrawal",
  "profession_earning",
  "starting_equipment",
  "skill_training",
  "admin_adjustment",
];

// POST: Create a bank transaction
export async function POST(
  req: NextRequest,
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
  const body = await req.json();
  const { type, amount, description, eventId } = body as {
    type: string;
    amount: number;
    description: string;
    eventId?: string;
  };

  // Validate inputs
  if (!type || !VALID_TRANSACTION_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid transaction type. Must be one of: ${VALID_TRANSACTION_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (amount === undefined || amount === null || !Number.isInteger(amount)) {
    return NextResponse.json(
      { error: "Amount must be an integer (in copper)" },
      { status: 400 }
    );
  }

  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  // Verify character exists
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Get or create bank
  let bank = await prisma.playerBank.findUnique({ where: { characterId } });
  if (!bank) {
    bank = await prisma.playerBank.create({
      data: { characterId, balance: STARTING_SILVER },
    });
  }

  // Calculate new balance
  const newBalance = bank.balance + amount;

  // Create transaction and update balance
  const transaction = await prisma.bankTransaction.create({
    data: {
      bankId: bank.id,
      type,
      amount,
      description,
      eventId: eventId ?? null,
      processedBy: session.user.id,
    },
  });

  await prisma.playerBank.update({
    where: { id: bank.id },
    data: { balance: newBalance },
  });

  const warning = newBalance < 0
    ? `Warning: Character is now in debt (${formatSilver(newBalance)})`
    : undefined;

  return NextResponse.json({
    transaction,
    newBalance,
    newBalanceFormatted: formatSilver(newBalance),
    warning,
  });
}
