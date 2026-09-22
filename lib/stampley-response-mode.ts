import type { ConversationPhase } from "@/lib/stampley-openai-context"

/**
 * Server-side conversation policy mode.
 * Not persisted; not exposed to the browser.
 * highStress remains an independent tone modifier (not a mode).
 */
export type StampleyResponseMode =
  | "MEDICAL_BOUNDARY"
  | "PRACTICAL_SUPPORT"
  | "EMPATHY"
  | "REFLECT"
  | "CLOSE"

export type SelectStampleyResponseModeInput = {
  /** Persisted authoritative participant text, or null/empty for greeting. */
  participantText: string | null | undefined
  /** Soft pacing phase from deriveConversationPhase (not sole authority). */
  phase: ConversationPhase
}

/** Normalize for conservative pattern matching. */
export function normalizeParticipantTextForMode(value: unknown): string {
  if (typeof value !== "string") return ""
  return value
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/[^\w\s'?]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const MED_NOUN =
  "(insulin|medication|medicine|metformin|dose|dosage|pills?)"

/**
 * High-confidence personalized medical/treatment-decision requests.
 * Ordinary "ask my doctor" / medication-memory questions do NOT match.
 */
export function isPersonalizedMedicalDecisionRequest(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  if (
    /\b(diagnos(e|is|ing)|can you diagnose|do i have diabetes complications)\b/.test(
      n
    )
  ) {
    return true
  }

  if (
    /\b(how much insulin|what dose|what dosage|how many units)\b/.test(n)
  ) {
    return true
  }

  // Dose / medication change asks (can/should/could + more/less/higher/lower/change).
  if (
    new RegExp(
      `\\b(can|should|could) i\\b.{0,40}\\b(take more|take less|take a (higher|lower) dose|increase|decrease|lower|raise|change|stop|skip|start)\\b.{0,40}\\b${MED_NOUN}\\b`
    ).test(n)
  ) {
    return true
  }

  if (
    /\b(can|should|could) i take (more|less)\b.{0,40}\b(insulin|medication|medicine|metformin|pills?)\b/.test(
      n
    )
  ) {
    return true
  }

  if (
    /\b(can|should|could) i (change|adjust) (my )?dose\b/.test(n) ||
    /\b(can|should|could) i take a (higher|lower) dose\b/.test(n)
  ) {
    return true
  }

  // "Would it help to take more insulin / change my dose"
  if (
    new RegExp(
      `\\bwould it help\\b.{0,48}\\b(take more|take less|increase|decrease|change|stop|adjust)\\b.{0,40}\\b${MED_NOUN}\\b`
    ).test(n)
  ) {
    return true
  }

  // "What should I do about my insulin dose / medication dose"
  if (
    /\bwhat should i do about (my )?(insulin|medication|medicine|metformin)( dose|dosage)?\b/.test(
      n
    ) ||
    /\bwhat should i do about (my )?(medication |medicine )?dose\b/.test(n)
  ) {
    return true
  }

  if (
    new RegExp(
      `\\b(increase|decrease|lower|raise|change|stop taking|skip)\\b.{0,40}\\b(my )?${MED_NOUN}\\b`
    ).test(n)
  ) {
    return true
  }

  if (/\b(different|another) medication\b/.test(n)) {
    return true
  }

  if (/\bdo i need (a |to )?different medication\b/.test(n)) {
    return true
  }

  return false
}

/**
 * High-confidence practical guidance / actionable-support requests.
 * Emotional "I don't know what to do anymore" does NOT match.
 */
export function isPracticalSupportRequest(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  // Emotional overwhelm — not an actionable ask.
  if (
    /\bi (don't|do not) know what to do( anymore| any more)?\b/.test(n) &&
    !/\bwhat (should|can|else) i do\b/.test(n) &&
    !/\bany suggestions\b/.test(n) &&
    !/\bany tips\b/.test(n)
  ) {
    return false
  }

  // Statements that mention "what to do" without asking for guidance.
  if (
    /\b(my doctor|doctor) (told|said|advised)\b.{0,40}\bwhat to do\b/.test(n)
  ) {
    return false
  }
  if (/^i should do\b/.test(n) || /\bi should do better\b/.test(n)) {
    return false
  }
  if (/^i can do (this|that|it)\b/.test(n)) {
    return false
  }
  // Clarification / emotion questions — not practical-support asks.
  if (
    /^what do you mean\b/.test(n) ||
    /^really\??$/.test(n) ||
    /^why do i feel\b/.test(n)
  ) {
    return false
  }

  if (
    /\bwhat should i\b.{0,24}\b(do|try|ask)\b/.test(n) ||
    /\bwhat can i\b.{0,24}\b(do|try|ask)\b/.test(n) ||
    /\bwhat else can i do\b/.test(n) ||
    /\bwhat do you recommend\b/.test(n) ||
    /\bwhat (are|is|s) your advice\b/.test(n) ||
    /\bwhat'?s your advice\b/.test(n) ||
    /\bcan you (give|offer) (me )?(some )?advice\b/.test(n) ||
    /\bhow (can|do) i handle (this|it)\b/.test(n) ||
    /\bhow (can|do) i deal with (this|it)\b/.test(n) ||
    /\bwhat should i ask (my )?doctor\b/.test(n) ||
    /\bwhat can i ask (my )?doctor\b/.test(n) ||
    /\bis there anything i can do\b/.test(n) ||
    /\bis there anything that might help\b/.test(n) ||
    /\bwhat would help\b/.test(n) ||
    /\bwhat can help( me)?\b/.test(n) ||
    /\bany suggestions\b/.test(n) ||
    /\bany advice\b/.test(n) ||
    /\bany tips\b/.test(n) ||
    /\bdo you have (any )?ideas\b/.test(n)
  ) {
    return true
  }

  return false
}

/**
 * Explicit participant intent to end the Stampley chat turn.
 * Does not win over medical/practical requests (checked later in precedence).
 */
export function isExplicitClosingIntent(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  // If a clear practical/medical ask is also present, closing detector
  // may still match substrings — precedence handles override.
  if (
    /\b(that'?s all|thats all)\b/.test(n) ||
    /\bthat'?s all i wanted\b/.test(n) ||
    /\bthat is all i wanted\b/.test(n) ||
    /\bi'?m done\b/.test(n) ||
    /\bi am done\b/.test(n) ||
    /\bi think i'?m good now\b/.test(n) ||
    /\bi think i am good now\b/.test(n) ||
    /\bthat'?s it for today\b/.test(n) ||
    /\bthat is it for today\b/.test(n) ||
    /\bno[, ]+that'?s all\b/.test(n) ||
    /\bthanks[, ]+(that'?s|thats) all\b/.test(n)
  ) {
    return true
  }

  return false
}

function defaultModeForPhase(phase: ConversationPhase): StampleyResponseMode {
  switch (phase) {
    case "opening":
      return "EMPATHY"
    case "exploration":
    case "coping":
      return "REFLECT"
    case "closure":
      // Soft close candidate only — stronger intents override.
      return "CLOSE"
    default:
      return "EMPATHY"
  }
}

/**
 * Deterministic response-mode selection.
 * Precedence: MEDICAL_BOUNDARY > PRACTICAL_SUPPORT > CLOSE intent > phase default.
 * highStress is intentionally NOT a mode — keep it as an independent modifier.
 *
 * CLARIFY is reserved for a later phase (no weak heuristics here).
 */
export function selectStampleyResponseMode(
  input: SelectStampleyResponseModeInput
): StampleyResponseMode {
  const text = input.participantText

  if (isPersonalizedMedicalDecisionRequest(text)) {
    return "MEDICAL_BOUNDARY"
  }
  if (isPracticalSupportRequest(text)) {
    return "PRACTICAL_SUPPORT"
  }
  if (isExplicitClosingIntent(text)) {
    return "CLOSE"
  }

  return defaultModeForPhase(input.phase)
}

/** Short priority block injected into the turn instruction. */
export function buildResponseModePriorityBlock(
  mode: StampleyResponseMode
): string {
  switch (mode) {
    case "PRACTICAL_SUPPORT":
      return `RESPONSE MODE: PRACTICAL_SUPPORT
PRIORITY (overrides phase pacing, including closure): The participant is asking for actionable support. Answer the newest request first with 1–3 bounded non-clinical options before reflection or wrap-up. Do not force closure this turn.`
    case "MEDICAL_BOUNDARY":
      return `RESPONSE MODE: MEDICAL_BOUNDARY
PRIORITY (overrides phase pacing, including closure): The participant is asking for a personalized medical/treatment decision. Do not diagnose, prescribe, dose, or change treatment. Give a useful clinician/care-team next step instead of only refusing. Do not force closure this turn.`
    case "CLOSE":
      return `RESPONSE MODE: CLOSE
PRIORITY: The participant appears ready to wrap up. Keep validation calm and brief. Do not invent a new problem or push another reflective prompt.`
    case "EMPATHY":
      return `RESPONSE MODE: EMPATHY
PRIORITY: Offer specific emotional acknowledgment tied to what they shared. Follow existing phase pacing.`
    case "REFLECT":
      return `RESPONSE MODE: REFLECT
PRIORITY: Deepen awareness gently. Follow existing phase pacing. Do not jump to closure unless they ask to stop.`
    default:
      return `RESPONSE MODE: EMPATHY
PRIORITY: Follow existing phase pacing.`
  }
}
