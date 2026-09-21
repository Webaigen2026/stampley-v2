import "server-only"

import { hasCapability } from "@/lib/admin-capabilities"
import { GenericAdminFailure } from "@/lib/admin-phi-page"
import {
  isPostSurveyResponseId,
  mapPostSurveyReflectionDetail,
  type AdminPostSurveyReflectionDetail,
} from "@/lib/admin-post-survey-reflection"
import type { AuditActor } from "@/lib/audit"
import type { AdminSessionLike } from "@/lib/audit-admin"
import { actorFromSession } from "@/lib/audit-admin"

export const POST_SURVEY_REFLECTION_UNAUTHORIZED = { error: "Unauthorized" }
export const POST_SURVEY_REFLECTION_FORBIDDEN = { error: "Forbidden" }
export const POST_SURVEY_REFLECTION_NOT_FOUND = { error: "Not found" }
export const POST_SURVEY_REFLECTION_GENERIC_FAILURE = {
  error: "Something went wrong. Please try again.",
}

export type PostSurveyReflectionRecord = {
  id: string
  userId: string
  openReflection: unknown
}

export type PostSurveyReflectionResponse = {
  status: number
  body:
    | AdminPostSurveyReflectionDetail
    | typeof POST_SURVEY_REFLECTION_UNAUTHORIZED
    | typeof POST_SURVEY_REFLECTION_FORBIDDEN
    | typeof POST_SURVEY_REFLECTION_NOT_FOUND
    | typeof POST_SURVEY_REFLECTION_GENERIC_FAILURE
}

export function canReadPostSurveyReflection(role: unknown): boolean {
  return hasCapability(role, "canViewSurveyFreeText")
}

export async function resolveAdminPostSurveyReflectionGet(args: {
  session: AdminSessionLike
  responseId: string
  loadResponse: (id: string) => Promise<PostSurveyReflectionRecord | null>
  recordDenied: (actor: AuditActor) => Promise<void>
  recordView: (input: {
    resourceId: string
    subjectUserId: string
  }) => Promise<void>
}): Promise<PostSurveyReflectionResponse> {
  const actor = actorFromSession(args.session)
  if (!args.session?.user?.id || !actor) {
    return { status: 401, body: POST_SURVEY_REFLECTION_UNAUTHORIZED }
  }

  if (!canReadPostSurveyReflection(actor.role)) {
    try {
      await args.recordDenied(actor)
    } catch {
      // Denial audit is fail-open; authorization remains deny-closed.
    }
    return { status: 403, body: POST_SURVEY_REFLECTION_FORBIDDEN }
  }

  if (!isPostSurveyResponseId(args.responseId)) {
    return { status: 400, body: POST_SURVEY_REFLECTION_NOT_FOUND }
  }

  const row = await args.loadResponse(args.responseId)
  if (!row) {
    return { status: 404, body: POST_SURVEY_REFLECTION_NOT_FOUND }
  }

  try {
    await args.recordView({
      resourceId: row.id,
      subjectUserId: row.userId,
    })
  } catch (error) {
    if (error instanceof GenericAdminFailure) {
      return { status: 500, body: POST_SURVEY_REFLECTION_GENERIC_FAILURE }
    }
    throw error
  }

  return {
    status: 200,
    body: mapPostSurveyReflectionDetail(row.openReflection),
  }
}
