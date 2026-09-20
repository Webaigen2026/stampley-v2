import "server-only"

import {
  recordAdminPageView,
  recordAdminView,
  type AdminSessionLike,
} from "@/lib/audit-admin"
import type { AppendAuditEventInput, AuditWriteClient } from "@/lib/audit"

export class GenericAdminFailure extends Error {
  constructor() {
    super("Something went wrong. Please try again.")
    this.name = "GenericAdminFailure"
  }
}

type PhiPageAuditFields = {
  action: AppendAuditEventInput["action"]
  resourceType: AppendAuditEventInput["resourceType"]
  resourceId?: string | null
  subjectUserId?: string | null
  metadata?: unknown
}

export async function recordPhiPageViewOrThrow(
  args: PhiPageAuditFields
): Promise<void> {
  try {
    await recordAdminPageView({
      policy: "fail-closed",
      ...args,
    })
  } catch {
    throw new GenericAdminFailure()
  }
}

export async function completePhiPageAccess<T>(args: PhiPageAuditFields & {
  payload: T
  db?: AuditWriteClient | object
  session?: AdminSessionLike
}): Promise<T> {
  try {
    if (args.db) {
      await recordAdminView({
        db: args.db,
        session: args.session ?? null,
        policy: "fail-closed",
        action: args.action,
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        subjectUserId: args.subjectUserId,
        metadata: args.metadata,
      })
    } else {
      await recordPhiPageViewOrThrow(args)
    }
  } catch {
    throw new GenericAdminFailure()
  }
  return args.payload
}
