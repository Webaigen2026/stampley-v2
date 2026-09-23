import { DDS_ITEM_KEYS, parseDdsAnswers, type DDSAnswers } from "@/lib/dds-scoring"
import { STUDY_TOTAL_CHECKINS } from "@/lib/check-in-utils"
import { isParticipantRole } from "@/lib/admin-capabilities"
import type { PhqAnswers, SusAnswers } from "@/lib/post-survey-scoring"

/** Post-study open reflection (longer than daily check-in reflection). */
export const POST_SURVEY_REFLECTION_MAX_LENGTH = 2000
export const POST_SURVEY_CONTACT_NAME_MAX_LENGTH = 100
export const POST_SURVEY_CONTACT_EMAIL_MAX_LENGTH = 254
export const POST_SURVEY_CONTACT_PHONE_MAX_LENGTH = 40

export const POST_SURVEY_UNAUTHORIZED = "Unauthorized"
export const POST_SURVEY_NOT_ELIGIBLE =
  "Post-survey is available after completing all 20 check-ins."
export const POST_SURVEY_ALREADY_COMPLETED = "Post-survey already completed."
export const POST_SURVEY_SECTIONS_INCOMPLETE =
  "Please complete all required survey sections."
export const POST_SURVEY_CONTACT_CONSENT_REQUIRED =
  "Please indicate whether you would like future research contact."
export const POST_SURVEY_REFLECTION_TOO_LONG =
  "Please shorten your reflection and try again."
export const POST_SURVEY_CONTACT_INVALID =
  "Please check the optional contact details and try again."

export const PHQ_ITEM_KEYS = [
  "phq1",
  "phq2",
  "phq3",
  "phq4",
  "phq5",
  "phq6",
  "phq7",
  "phq8",
  "phq9",
] as const

export const SUS_ITEM_KEYS = [
  "sus1",
  "sus2",
  "sus3",
  "sus4",
  "sus5",
  "sus6",
  "sus7",
  "sus8",
  "sus9",
  "sus10",
] as const

export const STAMPLEY_ITEM_KEYS = [
  "se1",
  "se2",
  "se3",
  "se4",
  "se5",
] as const

export type StampleyFeedback = {
  se1: number
  se2: number
  se3: number
  se4: number
  se5: number
}

export type PostSurveySubmitAuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: typeof POST_SURVEY_UNAUTHORIZED }

export type PostSurveyContactFields = {
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export type PostSurveyValidatedPayload = {
  ddsAnswers: DDSAnswers
  phqAnswers: PhqAnswers
  susAnswers: SusAnswers
  stampleyFeedback: StampleyFeedback
  openReflection: string | null
  futureResearchContact: boolean
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export type PostSurveyValidateResult =
  | { ok: true; data: PostSurveyValidatedPayload }
  | { ok: false; error: string }

type SessionLike = {
  user?: { id?: string | null; role?: unknown } | null
} | null

export function isPostSurveyStudyComplete(totalCheckins: number): boolean {
  return (
    typeof totalCheckins === "number" &&
    Number.isFinite(totalCheckins) &&
    totalCheckins >= STUDY_TOTAL_CHECKINS
  )
}

export function resolvePostSurveySubmitAuth(
  session: SessionLike
): PostSurveySubmitAuthResult {
  const userId = session?.user?.id
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return { ok: false, error: POST_SURVEY_UNAUTHORIZED }
  }
  if (!isParticipantRole(session?.user?.role)) {
    return { ok: false, error: POST_SURVEY_UNAUTHORIZED }
  }
  return { ok: true, userId }
}

/**
 * Page session gate for participant Post-Survey routes.
 * Distinguishes login redirect from non-participant dashboard redirect.
 */
export type PostSurveyPageSessionResult =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "ok"; userId: string }

export function resolvePostSurveyPageSession(
  session: SessionLike
): PostSurveyPageSessionResult {
  const userId = session?.user?.id
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return { status: "unauthenticated" }
  }
  if (!isParticipantRole(session?.user?.role)) {
    return { status: "forbidden" }
  }
  return { status: "ok", userId }
}

export type PostSurveyAccessFlags = {
  studyComplete: boolean
  postSurveyCompleted: boolean
}

export type PostSurveyPageDestination =
  | { status: "render" }
  | {
      status: "redirect"
      to: "/dashboard" | "/survey/post-survey" | "/survey/post-survey/results"
    }

/** Survey form page after PARTICIPANT auth. */
export function resolvePostSurveyFormPageDestination(
  access: PostSurveyAccessFlags
): PostSurveyPageDestination {
  if (!access.studyComplete) {
    return { status: "redirect", to: "/dashboard" }
  }
  if (access.postSurveyCompleted) {
    return { status: "redirect", to: "/survey/post-survey/results" }
  }
  return { status: "render" }
}

/** Results thank-you page after PARTICIPANT auth. */
export function resolvePostSurveyResultsPageDestination(
  access: PostSurveyAccessFlags
): PostSurveyPageDestination {
  if (!access.studyComplete) {
    return { status: "redirect", to: "/dashboard" }
  }
  if (!access.postSurveyCompleted) {
    return { status: "redirect", to: "/survey/post-survey" }
  }
  return { status: "render" }
}

/**
 * Pre-Survey parity rule (verified from actions/pre-survey.ts):
 * needsFollowup = phq9 > 0 || phqTotal >= 15
 *
 * Server-only: call with validated canonical phq9 + server-calculated phqTotal.
 * Never accept a browser-supplied safety flag.
 */
export const PHQ_MENTAL_HEALTH_FOLLOWUP_TOTAL_THRESHOLD = 15

export function needsMentalHealthFollowupFromPhq(input: {
  phq9: number
  phqTotal: number
}): boolean {
  return (
    input.phq9 > 0 || input.phqTotal >= PHQ_MENTAL_HEALTH_FOLLOWUP_TOTAL_THRESHOLD
  )
}

function hasExactKeys(
  raw: unknown,
  keys: readonly string[]
): raw is Record<string, unknown> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return false
  }
  const objectKeys = Object.keys(raw as object)
  if (objectKeys.length !== keys.length) return false
  const source = raw as Record<string, unknown>
  return keys.every((key) => Object.prototype.hasOwnProperty.call(source, key))
}

export function isIntegerInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  )
}

export function parsePostSurveyPhqAnswers(raw: unknown): PhqAnswers | null {
  if (!hasExactKeys(raw, PHQ_ITEM_KEYS)) return null
  const answers = {} as PhqAnswers
  for (const key of PHQ_ITEM_KEYS) {
    const value = raw[key]
    if (!isIntegerInRange(value, 0, 3)) return null
    answers[key] = value
  }
  return answers
}

export function parsePostSurveySusAnswers(raw: unknown): SusAnswers | null {
  if (!hasExactKeys(raw, SUS_ITEM_KEYS)) return null
  const answers = {} as SusAnswers
  for (const key of SUS_ITEM_KEYS) {
    const value = raw[key]
    if (!isIntegerInRange(value, 1, 5)) return null
    answers[key] = value
  }
  return answers
}

export function parsePostSurveyStampleyFeedback(
  raw: unknown
): StampleyFeedback | null {
  if (!hasExactKeys(raw, STAMPLEY_ITEM_KEYS)) return null
  const feedback = {} as StampleyFeedback
  for (const key of STAMPLEY_ITEM_KEYS) {
    const value = raw[key]
    if (!isIntegerInRange(value, 1, 5)) return null
    feedback[key] = value
  }
  return feedback
}

export function parsePostSurveyDdsAnswers(raw: unknown): DDSAnswers | null {
  if (!hasExactKeys(raw, DDS_ITEM_KEYS)) return null
  return parseDdsAnswers(raw)
}

export function normalizeOptionalBoundedText(
  value: unknown,
  maxLength: number
): { ok: true; value: string | null } | { ok: false } {
  if (value == null) return { ok: true, value: null }
  if (typeof value !== "string") return { ok: false }
  const trimmed = value.trim()
  if (trimmed.length === 0) return { ok: true, value: null }
  if (trimmed.length > maxLength) return { ok: false }
  return { ok: true, value: trimmed }
}

/** Conservative shape check — not a full RFC parser. */
export function isReasonableEmailShape(value: string): boolean {
  if (value.length > POST_SURVEY_CONTACT_EMAIL_MAX_LENGTH) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * Consent=false always nulls contacts (browser cannot force storage).
 * Consent=true: optional trimmed fields with length/email checks.
 */
export function resolvePostSurveyContactFields(input: {
  futureResearchContact: boolean
  contactName: unknown
  contactEmail: unknown
  contactPhone: unknown
}): { ok: true; data: PostSurveyContactFields } | { ok: false; error: string } {
  if (!input.futureResearchContact) {
    return {
      ok: true,
      data: {
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      },
    }
  }

  const name = normalizeOptionalBoundedText(
    input.contactName,
    POST_SURVEY_CONTACT_NAME_MAX_LENGTH
  )
  const email = normalizeOptionalBoundedText(
    input.contactEmail,
    POST_SURVEY_CONTACT_EMAIL_MAX_LENGTH
  )
  const phone = normalizeOptionalBoundedText(
    input.contactPhone,
    POST_SURVEY_CONTACT_PHONE_MAX_LENGTH
  )

  if (!name.ok || !email.ok || !phone.ok) {
    return { ok: false, error: POST_SURVEY_CONTACT_INVALID }
  }

  if (email.value && !isReasonableEmailShape(email.value)) {
    return { ok: false, error: POST_SURVEY_CONTACT_INVALID }
  }

  return {
    ok: true,
    data: {
      contactName: name.value,
      contactEmail: email.value,
      contactPhone: phone.value,
    },
  }
}

export function validatePostSurveySubmitPayload(input: {
  dds: unknown
  phq: unknown
  sus: unknown
  stampley: unknown
  openReflection: unknown
  futureResearchContact: unknown
  contactName: unknown
  contactEmail: unknown
  contactPhone: unknown
}): PostSurveyValidateResult {
  if (input.futureResearchContact === null) {
    return { ok: false, error: POST_SURVEY_CONTACT_CONSENT_REQUIRED }
  }
  if (typeof input.futureResearchContact !== "boolean") {
    return { ok: false, error: POST_SURVEY_CONTACT_CONSENT_REQUIRED }
  }

  const ddsAnswers = parsePostSurveyDdsAnswers(input.dds)
  const phqAnswers = parsePostSurveyPhqAnswers(input.phq)
  const susAnswers = parsePostSurveySusAnswers(input.sus)
  const stampleyFeedback = parsePostSurveyStampleyFeedback(input.stampley)

  if (!ddsAnswers || !phqAnswers || !susAnswers || !stampleyFeedback) {
    return { ok: false, error: POST_SURVEY_SECTIONS_INCOMPLETE }
  }

  const reflection = normalizeOptionalBoundedText(
    input.openReflection,
    POST_SURVEY_REFLECTION_MAX_LENGTH
  )
  if (!reflection.ok) {
    return { ok: false, error: POST_SURVEY_REFLECTION_TOO_LONG }
  }

  const contacts = resolvePostSurveyContactFields({
    futureResearchContact: input.futureResearchContact,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
  })
  if (!contacts.ok) {
    return { ok: false, error: contacts.error }
  }

  return {
    ok: true,
    data: {
      ddsAnswers,
      phqAnswers,
      susAnswers,
      stampleyFeedback,
      openReflection: reflection.value,
      futureResearchContact: input.futureResearchContact,
      contactName: contacts.data.contactName,
      contactEmail: contacts.data.contactEmail,
      contactPhone: contacts.data.contactPhone,
    },
  }
}

export function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}
