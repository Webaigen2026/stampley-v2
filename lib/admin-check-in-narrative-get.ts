import "server-only"

import { hasCapability } from "@/lib/admin-capabilities"
import { GenericAdminFailure } from "@/lib/admin-phi-page"
import {
  isCheckInId,
  mapAdminCheckInNarrativeDetail,
  type AdminCheckInNarrativeDetail,
} from "@/lib/admin-check-in-narratives"
import type { AuditActor } from "@/lib/audit"
import type { AdminSessionLike } from "@/lib/audit-admin"
import { actorFromSession } from "@/lib/audit-admin"

export const CHECK_IN_NARRATIVE_UNAUTHORIZED = { error: "Unauthorized" }
export const CHECK_IN_NARRATIVE_FORBIDDEN = { error: "Forbidden" }
export const CHECK_IN_NARRATIVE_NOT_FOUND = { error: "Not found" }
export const CHECK_IN_NARRATIVE_GENERIC_FAILURE = {
  error: "Something went wrong. Please try again.",
}

export type CheckInNarrativeRecord = {
  id: string
  userId: string
  reflection: unknown
  copingAction: unknown
}

export type CheckInNarrativeResponse = {
  status: number
  body:
    | AdminCheckInNarrativeDetail
    | typeof CHECK_IN_NARRATIVE_UNAUTHORIZED
    | typeof CHECK_IN_NARRATIVE_FORBIDDEN
    | typeof CHECK_IN_NARRATIVE_NOT_FOUND
    | typeof CHECK_IN_NARRATIVE_GENERIC_FAILURE
}

export function canReadCheckInNarrative(role: unknown): boolean {
  return hasCapability(role, "canViewCheckInNarratives")
}

export async function resolveAdminCheckInNarrativeGet(args: {
  session: AdminSessionLike
  checkInId: string
  loadCheckIn: (id: string) => Promise<CheckInNarrativeRecord | null>
  recordDenied: (actor: AuditActor) => Promise<void>
  recordView: (input: {
    resourceId: string
    subjectUserId: string
  }) => Promise<void>
}): Promise<CheckInNarrativeResponse> {
  const actor = actorFromSession(args.session)
  if (!args.session?.user?.id || !actor) {
    return { status: 401, body: CHECK_IN_NARRATIVE_UNAUTHORIZED }
  }

  if (!canReadCheckInNarrative(actor.role)) {
    try {
      await args.recordDenied(actor)
    } catch {
      // Denial audit is fail-open; authorization remains deny-closed.
    }
    return { status: 403, body: CHECK_IN_NARRATIVE_FORBIDDEN }
  }

  if (!isCheckInId(args.checkInId)) {
    return { status: 400, body: CHECK_IN_NARRATIVE_NOT_FOUND }
  }

  const row = await args.loadCheckIn(args.checkInId)
  if (!row) {
    return { status: 404, body: CHECK_IN_NARRATIVE_NOT_FOUND }
  }

  try {
    await args.recordView({
      resourceId: row.id,
      subjectUserId: row.userId,
    })
  } catch (error) {
    if (error instanceof GenericAdminFailure) {
      return { status: 500, body: CHECK_IN_NARRATIVE_GENERIC_FAILURE }
    }
    throw error
  }

  return {
    status: 200,
    body: mapAdminCheckInNarrativeDetail(row),
  }
}
