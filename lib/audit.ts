import "server-only"

import type {
  AuditAction,
  AuditOutcome,
  AuditResourceType,
  UserRole,
} from "@/lib/generated/prisma/client"
import { sanitizeAuditMetadata } from "@/lib/audit-metadata"

export type {
  AuditAction,
  AuditOutcome,
  AuditResourceType,
} from "@/lib/generated/prisma/client"

export type AuditActor = {
  userId: string
  role: UserRole
}

export type AppendAuditEventInput = {
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string | null
  subjectUserId?: string | null
  outcome: AuditOutcome
  requestId?: string | null
  metadata?: unknown
}

export type AuditWriteClient = {
  auditLog: {
    create(args: { data: object }): Promise<unknown>
  }
}

export function asAuditWriteClient(db: object): AuditWriteClient {
  return db as AuditWriteClient
}

export class AuditPersistFailed extends Error {
  constructor() {
    super("Audit persistence failed")
    this.name = "AuditPersistFailed"
  }
}

export function createAuditRequestId(): string {
  return crypto.randomUUID()
}

function normalizeOptionalId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function appendAuditEvent(
  db: AuditWriteClient | object,
  actor: AuditActor | null,
  input: AppendAuditEventInput
): Promise<void> {
  const metadata = sanitizeAuditMetadata(input.metadata)
  const occurredAt = new Date()
  const client = asAuditWriteClient(db)

  await client.auditLog.create({
    data: {
      actorUserId: actor?.userId ?? null,
      actorRole: actor?.role ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: normalizeOptionalId(input.resourceId),
      subjectUserId: normalizeOptionalId(input.subjectUserId),
      outcome: input.outcome,
      occurredAt,
      requestId: normalizeOptionalId(input.requestId),
      ...(metadata ? { metadata } : {}),
    },
  })
}

export async function appendAuditEventFailOpen(
  db: AuditWriteClient | object,
  actor: AuditActor | null,
  input: AppendAuditEventInput
): Promise<boolean> {
  try {
    await appendAuditEvent(db, actor, input)
    return true
  } catch {
    console.error("[audit] persist failed")
    return false
  }
}
