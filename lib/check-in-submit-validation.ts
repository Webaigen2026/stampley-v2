export const ALLOWED_CONTEXT_TAGS = [
  "doctors_appointment",
  "blood_sugar",
  "missed_medication",
  "work_stress",
  "conflict",
  "felt_supported",
  "unwell",
] as const

const ALLOWED_CONTEXT_TAG_SET = new Set<string>(ALLOWED_CONTEXT_TAGS)

export const REFLECTION_MAX_LENGTH = 250
export const COPING_MAX_LENGTH = 180

export type ValidatedCheckInSubmitFields = {
  distress: number
  mood: number
  energy: number
  contextTags: string[]
  reflection: string
  copingAction: string
}

export type CheckInSubmitValidationResult =
  | { ok: true; data: ValidatedCheckInSubmitFields }
  | { ok: false; error: string }

function isScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 10
  )
}

function isAllowedContextTag(value: unknown): value is string {
  return typeof value === "string" && ALLOWED_CONTEXT_TAG_SET.has(value)
}

export function validateCheckInSubmitBody(
  body: unknown
): CheckInSubmitValidationResult {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" }
  }

  const payload = body as Record<string, unknown>

  if (!isScore(payload.distress)) {
    return { ok: false, error: "Invalid distress value" }
  }

  if (!isScore(payload.mood)) {
    return { ok: false, error: "Invalid mood value" }
  }

  if (!isScore(payload.energy)) {
    return { ok: false, error: "Invalid energy value" }
  }

  const contextTags = payload.contextTags

  if (!Array.isArray(contextTags)) {
    return {
      ok: false,
      error: "At least one valid context factor is required",
    }
  }

  if (contextTags.length < 1) {
    return {
      ok: false,
      error: "At least one valid context factor is required",
    }
  }

  if (!contextTags.every(isAllowedContextTag)) {
    return {
      ok: false,
      error: "At least one valid context factor is required",
    }
  }

  if (typeof payload.reflection !== "string") {
    return { ok: false, error: "Reflection is required" }
  }

  const reflection = payload.reflection.trim()

  if (reflection.length < 1) {
    return { ok: false, error: "Reflection is required" }
  }

  if (reflection.length > REFLECTION_MAX_LENGTH) {
    return {
      ok: false,
      error: "Reflection must be 250 characters or fewer",
    }
  }

  if (typeof payload.copingAction !== "string") {
    return { ok: false, error: "Coping action is required" }
  }

  const copingAction = payload.copingAction.trim()

  if (copingAction.length < 1) {
    return { ok: false, error: "Coping action is required" }
  }

  if (copingAction.length > COPING_MAX_LENGTH) {
    return {
      ok: false,
      error: "Coping action must be 180 characters or fewer",
    }
  }

  return {
    ok: true,
    data: {
      distress: payload.distress,
      mood: payload.mood,
      energy: payload.energy,
      contextTags,
      reflection,
      copingAction,
    },
  }
}
