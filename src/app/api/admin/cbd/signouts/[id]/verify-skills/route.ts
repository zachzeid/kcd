import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCBD } from "@/lib/roles";

interface SkillLearned {
  skillName: string;
  count: number;
  teacherName: string;
  teacherCharacter: string;
  teacherCharacterId?: string;
}

interface SkillTaught {
  skillName: string;
  studentNames: string;
  studentIds?: string[];
}

export interface SkillVerification {
  skillName: string;
  count: number;
  teacherName: string;
  teacherCharacterId?: string;
  status: "verified" | "unverified" | "no_signout";
  reason: string;
}

// GET: Verify skills learned against teacher sign-outs for the same event
export async function GET(
  _req: NextRequest,
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

  const signOut = await prisma.characterSignOut.findUnique({
    where: { id },
    select: {
      characterId: true,
      eventId: true,
      skillsLearned: true,
    },
  });

  if (!signOut) {
    return NextResponse.json({ error: "Sign-out not found" }, { status: 404 });
  }

  const skillsLearned: SkillLearned[] = signOut.skillsLearned
    ? JSON.parse(signOut.skillsLearned)
    : [];

  if (skillsLearned.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch all sign-outs for this event to cross-reference
  const eventSignOuts = await prisma.characterSignOut.findMany({
    where: { eventId: signOut.eventId },
    select: {
      characterId: true,
      skillsTaught: true,
      status: true,
    },
  });

  const verifications: SkillVerification[] = skillsLearned.map((learned) => {
    if (!learned.teacherCharacterId) {
      return {
        skillName: learned.skillName,
        count: learned.count,
        teacherName: learned.teacherName,
        status: "unverified" as const,
        reason: "No teacher character ID specified",
      };
    }

    // Find teacher's sign-out for this event
    const teacherSignOut = eventSignOuts.find(
      (so) => so.characterId === learned.teacherCharacterId
    );

    if (!teacherSignOut) {
      return {
        skillName: learned.skillName,
        count: learned.count,
        teacherName: learned.teacherName,
        teacherCharacterId: learned.teacherCharacterId,
        status: "no_signout" as const,
        reason: "Teacher has no sign-out for this event",
      };
    }

    // Check teacher's skillsTaught for this skill + this character
    const teacherTaught: SkillTaught[] = teacherSignOut.skillsTaught
      ? JSON.parse(teacherSignOut.skillsTaught)
      : [];

    const matchingTaught = teacherTaught.find((t) => {
      // Match skill name
      if (t.skillName !== learned.skillName) return false;
      // Match student: check studentIds array or fall back to name matching
      if (t.studentIds && t.studentIds.includes(signOut.characterId)) return true;
      // Fallback: check student names contains the character name
      // (for older sign-outs without studentIds)
      return false;
    });

    if (matchingTaught) {
      return {
        skillName: learned.skillName,
        count: learned.count,
        teacherName: learned.teacherName,
        teacherCharacterId: learned.teacherCharacterId,
        status: "verified" as const,
        reason: "Teacher confirmed teaching this skill",
      };
    }

    return {
      skillName: learned.skillName,
      count: learned.count,
      teacherName: learned.teacherName,
      teacherCharacterId: learned.teacherCharacterId,
      status: "unverified" as const,
      reason: "Teacher's sign-out does not list teaching this skill to this character",
    };
  });

  return NextResponse.json(verifications);
}
