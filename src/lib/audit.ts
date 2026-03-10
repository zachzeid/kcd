import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "created"
  | "updated"
  | "submitted"
  | "approved"
  | "rejected"
  | "status_change"
  | "level_up"
  | "inactive"
  | "reactivated"
  | "deleted"
  | "registered"
  | "checked_in"
  | "checked_out"
  | "signout_submitted"
  | "signout_processed"
  | "tag_created"
  | "tag_transferred"
  | "tag_removed"
  | "tag_approved"
  | "tag_denied"
  | "skill_confirmed"
  | "life_credit_lost"
  | "character_died";

interface AuditEntry {
  characterId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  details?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry) {
  await prisma.auditLog.create({
    data: {
      characterId: entry.characterId,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      details: entry.details ? JSON.stringify(entry.details) : null,
    },
  });
}
