import "server-only"

import { hasCapability } from "@/lib/admin-capabilities"
import { GenericAdminFailure } from "@/lib/admin-phi-page"
import {
  mapStampleySummaryDetail,
  type AdminStampleySummaryDetail,
} from "@/lib/admin-stampley-summary"
import { isStampleySessionId } from "@/lib/admin-stampley-sessions"
import type { AuditActor } from "@/lib/audit"
import type { AdminSessionLike } from "@/lib/audit-admin"
import { actorFromSession } from "@/lib/audit-admin"

export const STAMPLEY_SUMMARY_UNAUTHORIZED = { error: "Unauthorized" }
export const STAMPLEY_SUMMARY_FORBIDDEN = { error: "Forbidden" }
export const STAMPLEY_SUMMARY_NOT_FOUND = { error: "Not found" }
export const STAMPLEY_SUMMARY_GENERIC_FAILURE = {
  error: "Something went wrong. Please try again.",
}

export type StampleySummaryRecord = {
  id: string
  userId: string
  summary: unknown
}

export type StampleySummaryResponse = {
  status: number
  body:
    | AdminStampleySummaryDetail
    | typeof STAMPLEY_SUMMARY_UNAUTHORIZED
    | typeof STAMPLEY_SUMMARY_FORBIDDEN
    | typeof STAMPLEY_SUMMARY_NOT_FOUND
    | typeof STAMPLEY_SUMMARY_GENERIC_FAILURE
}

export function canReadStampleySummary(role: unknown): boolean {
  return hasCapability(role, "canViewTranscripts")
}

export async function resolveAdminStampleySummaryGet(args: {
  session: AdminSessionLike
  sessionId: string
  loadSession: (id: string) => Promise<StampleySummaryRecord | null>
  recordDenied: (actor: AuditActor) => Promise<void>
  recordView: (input: {
    resourceId: string
    subjectUserId: string
  }) => Promise<void>
}): Promise<StampleySummaryResponse> {
  const actor = actorFromSession(args.session)
  if (!args.session?.user?.id || !actor) {
    return { status: 401, body: STAMPLEY_SUMMARY_UNAUTHORIZED }
  }

  if (!canReadStampleySummary(actor.role)) {
    try {
      await args.recordDenied(actor)
    } catch {
      // Denial audit is fail-open; authorization remains deny-closed.
    }
    return { status: 403, body: STAMPLEY_SUMMARY_FORBIDDEN }
  }

  if (!isStampleySessionId(args.sessionId)) {
    return { status: 400, body: STAMPLEY_SUMMARY_NOT_FOUND }
  }

  const row = await args.loadSession(args.sessionId)
  if (!row) {
    return { status: 404, body: STAMPLEY_SUMMARY_NOT_FOUND }
  }

  try {
    await args.recordView({
      resourceId: row.id,
      subjectUserId: row.userId,
    })
  } catch (error) {
    if (error instanceof GenericAdminFailure) {
      return { status: 500, body: STAMPLEY_SUMMARY_GENERIC_FAILURE }
    }
    throw error
  }

  return {
    status: 200,
    body: mapStampleySummaryDetail(row.summary),
  }
}
