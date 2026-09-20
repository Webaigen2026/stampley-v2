import "server-only"

import {
  appendAuditEvent,
  appendAuditEventFailOpen,
  AuditPersistFailed,
  type AppendAuditEventInput,
  type AuditActor,
  type AuditWriteClient,
} from "@/lib/audit"
import type { UserRole } from "@/lib/generated/prisma/client"

export { AuditPersistFailed }

export type AdminSessionLike = {
  user?: { id?: string | null; role?: UserRole | null } | null
} | null

export function actorFromSession(session: AdminSessionLike): AuditActor | null {
  const id = session?.user?.id
  const role = session?.user?.role
  if (typeof id !== "string" || id.length === 0) return null
  if (role !== "ADMIN" && role !== "PARTICIPANT") return null
  return { userId: id, role }
}

export function isAdminActor(actor: AuditActor | null): actor is AuditActor {
  return actor?.role === "ADMIN"
}

export async function recordAdminView(args: {
  db: AuditWriteClient | object
  session: AdminSessionLike
  policy: "fail-closed" | "fail-open"
  action: AppendAuditEventInput["action"]
  resourceType: AppendAuditEventInput["resourceType"]
  resourceId?: string | null
  subjectUserId?: string | null
  metadata?: unknown
}): Promise<void> {
  const actor = actorFromSession(args.session)

  if (!isAdminActor(actor)) {
    if (args.policy === "fail-closed") {
      throw new AuditPersistFailed()
    }
    if (actor) {
      await appendAuditEventFailOpen(args.db, actor, {
        action: "AUTH_ADMIN_ACCESS_DENIED",
        resourceType: "AUTH_SESSION",
        outcome: "DENIED",
      })
    }
    return
  }

  const input: AppendAuditEventInput = {
    action: args.action,
    resourceType: args.resourceType,
    resourceId: args.resourceId,
    subjectUserId: args.subjectUserId,
    outcome: "SUCCESS",
    metadata: args.metadata,
  }

  if (args.policy === "fail-open") {
    await appendAuditEventFailOpen(args.db, actor, input)
    return
  }

  try {
    await appendAuditEvent(args.db, actor, input)
  } catch {
    console.error("[audit] persist failed")
    throw new AuditPersistFailed()
  }
}

export async function recordAdminPageView(args: {
  policy: "fail-closed" | "fail-open"
  action: AppendAuditEventInput["action"]
  resourceType: AppendAuditEventInput["resourceType"]
  resourceId?: string | null
  subjectUserId?: string | null
  metadata?: unknown
}): Promise<void> {
  const [{ auth }, { prisma }] = await Promise.all([
    import("@/lib/auth"),
    import("@/lib/prisma"),
  ])
  const session = await auth()
  await recordAdminView({
    db: prisma,
    session,
    ...args,
  })
}

export async function recordExportDeniedFailOpen(
  db: AuditWriteClient | object,
  session: AdminSessionLike
): Promise<void> {
  const actor = actorFromSession(session)
  if (!actor) return
  await appendAuditEventFailOpen(db, actor, {
    action: "AUTH_ADMIN_ACCESS_DENIED",
    resourceType: "EXPORT",
    outcome: "DENIED",
  })
}

export async function persistExportAuditOrThrow(args: {
  db: AuditWriteClient | object
  actor: AuditActor
  action:
    | "ADMIN_CHECKIN_EXPORTED"
    | "ADMIN_HIGH_STRESS_EXPORTED"
    | "ADMIN_STAMPLEY_SESSION_EXPORTED"
  requestId: string
  metadata: unknown
}): Promise<void> {
  try {
    await appendAuditEvent(args.db, args.actor, {
      action: args.action,
      resourceType: "EXPORT",
      outcome: "SUCCESS",
      requestId: args.requestId,
      metadata: args.metadata,
    })
  } catch {
    console.error("[admin] export audit failed")
    throw new AuditPersistFailed()
  }
}
