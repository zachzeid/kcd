import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCBD } from "@/lib/roles";
import { calculateSignOutXP, craftLevelToTier, PROFESSION_RATES, startingBankData } from "@/lib/economy";

// POST: Process or reject a sign-out
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !canAccessCBD(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const { action, notes } = await req.json();

  if (!action || !["process", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Must be 'process' or 'reject'" }, { status: 400 });
  }

  const signOut = await prisma.characterSignOut.findUnique({
    where: { id },
    include: {
      event: { select: { date: true, endDate: true } },
      registration: true,
    },
  });

  if (!signOut) {
    return NextResponse.json({ error: "Sign-out not found" }, { status: 404 });
  }

  if (signOut.status !== "pending") {
    return NextResponse.json({ error: "Sign-out has already been processed" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.characterSignOut.update({
      where: { id },
      data: {
        status: "rejected",
        processedBy: session.user.id,
        processedAt: new Date(),
        processNotes: notes || null,
      },
    });

    return NextResponse.json(updated);
  }

  // Processing: calculate XP
  const eventStart = new Date(signOut.event.date);
  const eventEnd = signOut.event.endDate ? new Date(signOut.event.endDate) : eventStart;

  // Calculate event days: 1 for day events, 2 for weekend events
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / msPerDay);
  const eventDays = daysDiff >= 1 ? 2 : 1;

  const xpAwarded = calculateSignOutXP(eventDays, signOut.npcMinutes);

  // Update sign-out and registration in a transaction
  // Also set checkedOutAt if not already set (player sign-outs without staff checkout)
  const [updatedSignOut] = await prisma.$transaction([
    prisma.characterSignOut.update({
      where: { id },
      data: {
        status: "processed",
        processedBy: session.user.id,
        processedAt: new Date(),
        processNotes: notes || null,
        xpAwarded,
      },
    }),
    prisma.eventRegistration.update({
      where: { id: signOut.registrationId },
      data: {
        xpEarned: xpAwarded,
        npcMinutes: signOut.npcMinutes,
        ...(signOut.registration.checkedOutAt ? {} : { checkedOutAt: new Date() }),
      },
    }),
  ]);

  // Auto-deposit coin earnings if crafting for coin
  let coinEarnings = 0;
  if (signOut.betweenEventAction === "crafting" && signOut.betweenEventDetails) {
    try {
      const details = typeof signOut.betweenEventDetails === "string"
        ? JSON.parse(signOut.betweenEventDetails)
        : signOut.betweenEventDetails;

      if (details.craftingMode === "coin" && details.coinSkill && details.coinSkillLevel) {
        const tier = craftLevelToTier(details.coinSkillLevel);
        const isWinter = eventStart.getMonth() >= 10 || eventStart.getMonth() <= 1; // Nov-Feb
        coinEarnings = isWinter ? PROFESSION_RATES[tier].winter : PROFESSION_RATES[tier].standard;

        // Find or create bank, then deposit
        let bank = await prisma.playerBank.findUnique({
          where: { characterId: signOut.characterId },
        });

        if (!bank) {
          // Lazy-create bank with starting balance
          const character = await prisma.character.findUnique({ where: { id: signOut.characterId } });
          const charData = character?.data ? JSON.parse(character.data as string) : {};
          const { startingBalance, transactions } = startingBankData(charData.silverSpent ?? 0);

          bank = await prisma.playerBank.create({
            data: {
              characterId: signOut.characterId,
              balance: startingBalance,
            },
          });

          // Create starting transactions
          for (const txn of transactions) {
            await prisma.bankTransaction.create({
              data: {
                bankId: bank.id,
                type: txn.type,
                amount: txn.type === "withdrawal" ? -txn.amount : txn.amount,
                description: txn.description,
              },
            });
          }
        }

        // Deposit coin earnings
        await prisma.playerBank.update({
          where: { id: bank.id },
          data: { balance: { increment: coinEarnings } },
        });

        await prisma.bankTransaction.create({
          data: {
            bankId: bank.id,
            type: "profession_earning",
            amount: coinEarnings,
            description: `${details.coinSkill} (${tier}) — between-event earnings`,
            processedBy: session.user.id,
          },
        });
      }
    } catch {
      // If parsing fails, skip coin earning — not critical
    }
  }

  return NextResponse.json({ ...updatedSignOut, xpAwarded, coinEarnings });
}
