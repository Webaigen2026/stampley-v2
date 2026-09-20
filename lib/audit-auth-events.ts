import "server-only"

import {
  appendAuditEventFailOpen,
  type AuditActor,
  type AuditWriteClient,
} from "@/lib/audit"

export async function recordPasswordResetCompletedFailOpen(
  db: AuditWriteClient | object,
  subjectUserId: string | null
): Promise<boolean> {
  return appendAuditEventFailOpen(db, null, {
    action: "AUTH_PASSWORD_RESET_COMPLETED",
    resourceType: "AUTH_SESSION",
    subjectUserId,
    outcome: "SUCCESS",
  })
}

export async function recordAdminLoginSucceededFailOpen(
  db: AuditWriteClient | object,
  actor: AuditActor
): Promise<boolean> {
  if (actor.role !== "ADMIN") return true
  return appendAuditEventFailOpen(db, actor, {
    action: "AUTH_ADMIN_LOGIN_SUCCEEDED",
    resourceType: "AUTH_SESSION",
    subjectUserId: actor.userId,
    outcome: "SUCCESS",
  })
}
