import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCBD } from "@/lib/roles";
import { logAudit } from "@/lib/audit";
import { calculateSignOutXP, craftLevelToTier, PROFESSION_RATES, startingBankData } from "@/lib/economy";
import { levelFromXP, STARTING_SKILL_POINTS } from "@/data/xp-table";
import { races } from "@/data/races";
import { classes } from "@/data/classes";

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
  const { action, notes, confirmedSkills } = await req.json();
  // confirmedSkills: Array<{ skillName: string; count: number; teacherName: string; confirmedBy: "auto"|"cbd" }>

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

    await logAudit({
      characterId: signOut.characterId,
      actorId: session.user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "signout_processed",
      details: { result: "rejected", eventId: signOut.eventId, notes: notes || null },
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

  // 8-day deadline rule (Appendix V): sign-outs submitted more than 8 days
  // after event end forfeit NPC XP and skill learning on that sign-out
  const signOutSubmittedAt = new Date(signOut.createdAt);
  const eventEndDate = signOut.event.endDate ? new Date(signOut.event.endDate) : new Date(signOut.event.date);
  const daysSinceEvent = (signOutSubmittedAt.getTime() - eventEndDate.getTime()) / msPerDay;
  const isLateSignOut = daysSinceEvent > 8;
  const effectiveNpcMinutes = isLateSignOut ? 0 : signOut.npcMinutes;

  const xpAwarded = calculateSignOutXP(eventDays, effectiveNpcMinutes);

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

  // Auto-update character data: add XP to SP pool, recalculate level
  {
    const character = await prisma.character.findUnique({ where: { id: signOut.characterId } });
    if (character) {
      // Sum all XP earned from processed registrations for THIS character
      const allRegs = await prisma.eventRegistration.findMany({
        where: { characterId: signOut.characterId, xpEarned: { gt: 0 } },
        select: { xpEarned: true },
      });
      const newTotalXP = allRegs.reduce((sum, r) => sum + r.xpEarned, 0);
      const newLevel = levelFromXP(newTotalXP);
      const charData = JSON.parse(character.data as string);
      const previousLevel = charData.level || 1;

      charData.totalXP = newTotalXP;
      charData.level = newLevel;
      // Total SP = starting 140 + all earned XP. skillPoints tracks the total pool.
      charData.skillPoints = STARTING_SKILL_POINTS + newTotalXP;
      // Recalculate body points for new level
      const raceInfo = races.find((r) => r.name === charData.race);
      const classInfo = classes.find((c) => c.name === charData.characterClass);
      charData.bodyPoints = (raceInfo?.bodyPointsByLevel[newLevel - 1] ?? 0) + (classInfo?.bodyPointsByLevel[newLevel - 1] ?? 0);

      await prisma.character.update({
        where: { id: signOut.characterId },
        data: { data: JSON.stringify(charData) },
      });

      if (newLevel > previousLevel) {
        await logAudit({
          characterId: signOut.characterId,
          actorId: "system",
          actorName: "System",
          actorRole: "system",
          action: "level_up",
          details: { previousLevel, newLevel, totalXP: newTotalXP },
        });
      }
    }
  }

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
                amount: txn.amount,
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

  // Add confirmed skills to character's purchased skills
  const skillsConfirmed: { skillName: string; count: number; teacherName: string; confirmedBy: string }[] = [];
  if (Array.isArray(confirmedSkills) && confirmedSkills.length > 0) {
    const character = await prisma.character.findUnique({ where: { id: signOut.characterId } });
    if (character) {
      const charData = JSON.parse(character.data as string);
      const skills: { skillName: string; purchaseCount: number; totalCost: number; acquiredAt?: string; reason?: string }[] = charData.skills ?? [];

      for (const cs of confirmedSkills) {
        if (!cs.skillName || !cs.count) continue;

        const existing = skills.find((s) => s.skillName === cs.skillName);
        if (existing) {
          existing.purchaseCount += cs.count;
        } else {
          skills.push({
            skillName: cs.skillName,
            purchaseCount: cs.count,
            totalCost: 0, // Learned skills have no SP cost
            acquiredAt: new Date().toISOString(),
            reason: cs.confirmedBy === "auto"
              ? `Learned from ${cs.teacherName} at event`
              : `Learned from ${cs.teacherName} — confirmed by CBD`,
          });
        }
        skillsConfirmed.push(cs);

        await logAudit({
          characterId: signOut.characterId,
          actorId: cs.confirmedBy === "auto" ? "system" : session.user.id,
          actorName: cs.confirmedBy === "auto" ? "System" : user.name,
          actorRole: cs.confirmedBy === "auto" ? "system" : user.role,
          action: "skill_confirmed",
          details: {
            skillName: cs.skillName,
            count: cs.count,
            teacherName: cs.teacherName,
            confirmedBy: cs.confirmedBy,
            eventId: signOut.eventId,
          },
        });
      }

      charData.skills = skills;
      await prisma.character.update({
        where: { id: signOut.characterId },
        data: { data: JSON.stringify(charData) },
      });
    }
  }

  await logAudit({
    characterId: signOut.characterId,
    actorId: session.user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "signout_processed",
    details: {
      result: "processed",
      eventId: signOut.eventId,
      xpAwarded,
      coinEarnings: coinEarnings || 0,
      skillsConfirmed: skillsConfirmed.length > 0 ? skillsConfirmed : undefined,
      ...(isLateSignOut ? { lateSignOut: true, npcMinutesForfeited: signOut.npcMinutes } : {}),
    },
  });

  return NextResponse.json({ ...updatedSignOut, xpAwarded, coinEarnings, isLateSignOut, skillsConfirmed });
}
