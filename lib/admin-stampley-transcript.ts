import "server-only"

import { hasCapability } from "@/lib/admin-capabilities"
import { GenericAdminFailure } from "@/lib/admin-phi-page"
import {
  isStampleySessionId,
  mapStampleyTranscriptDetail,
  type AdminStampleyTranscriptDetail,
} from "@/lib/admin-stampley-sessions"
import type { AuditActor } from "@/lib/audit"
import type { AdminSessionLike } from "@/lib/audit-admin"
import { actorFromSession } from "@/lib/audit-admin"

export const STAMPLEY_TRANSCRIPT_UNAUTHORIZED = { error: "Unauthorized" }
export const STAMPLEY_TRANSCRIPT_FORBIDDEN = { error: "Forbidden" }
export const STAMPLEY_TRANSCRIPT_NOT_FOUND = { error: "Not found" }
export const STAMPLEY_TRANSCRIPT_GENERIC_FAILURE = {
  error: "Something went wrong. Please try again.",
}

export type StampleyTranscriptRecord = {
  id: string
  userId: string
  messages: unknown
}

export type StampleyTranscriptResponse = {
  status: number
  body:
    | AdminStampleyTranscriptDetail
    | typeof STAMPLEY_TRANSCRIPT_UNAUTHORIZED
    | typeof STAMPLEY_TRANSCRIPT_FORBIDDEN
    | typeof STAMPLEY_TRANSCRIPT_NOT_FOUND
    | typeof STAMPLEY_TRANSCRIPT_GENERIC_FAILURE
}

export function canReadStampleyTranscript(role: unknown): boolean {
  return hasCapability(role, "canViewTranscripts")
}

export async function resolveAdminStampleyTranscriptGet(args: {
  session: AdminSessionLike
  sessionId: string
  loadSession: (id: string) => Promise<StampleyTranscriptRecord | null>
  recordDenied: (actor: AuditActor) => Promise<void>
  recordView: (input: {
    resourceId: string
    subjectUserId: string
  }) => Promise<void>
}): Promise<StampleyTranscriptResponse> {
  const actor = actorFromSession(args.session)
  if (!args.session?.user?.id || !actor) {
    return { status: 401, body: STAMPLEY_TRANSCRIPT_UNAUTHORIZED }
  }

  if (!canReadStampleyTranscript(actor.role)) {
    await args.recordDenied(actor)
    return { status: 403, body: STAMPLEY_TRANSCRIPT_FORBIDDEN }
  }

  if (!isStampleySessionId(args.sessionId)) {
    return { status: 400, body: STAMPLEY_TRANSCRIPT_NOT_FOUND }
  }

  const row = await args.loadSession(args.sessionId)
  if (!row) {
    return { status: 404, body: STAMPLEY_TRANSCRIPT_NOT_FOUND }
  }

  try {
    await args.recordView({
      resourceId: row.id,
      subjectUserId: row.userId,
    })
  } catch (error) {
    if (error instanceof GenericAdminFailure) {
      return { status: 500, body: STAMPLEY_TRANSCRIPT_GENERIC_FAILURE }
    }
    throw error
  }

  return {
    status: 200,
    body: mapStampleyTranscriptDetail(row.messages),
  }
}
