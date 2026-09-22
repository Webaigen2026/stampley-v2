import {
  ALLOWED_CONTEXT_TAGS,
  COPING_MAX_LENGTH,
  REFLECTION_MAX_LENGTH,
} from "@/lib/check-in-submit-validation"
import { DOMAIN_SUBSCALES, isCheckInDomain } from "@/lib/check-in-subscale"
import { resolveCheckInMutationAccess } from "@/lib/check-in-mutation-authz"
import type { StampleyGenerateDiagStage } from "@/lib/stampley-generate-diagnostics"

export const SUPPORT_DOMAINS = [
  "Emotional",
  "Regimen",
  "Physician",
  "Interpersonal",
] as const

export type SupportDomain = (typeof SUPPORT_DOMAINS)[number]

export type StressBand = "low" | "moderate" | "high" | "very_high"
export type AffectBand = "low" | "moderate" | "high"
export type TrendDirection =
  | "improving"
  | "stable"
  | "worsening"
  | "insufficient"

export type ConversationPhase =
  | "opening"
  | "exploration"
  | "coping"
  | "closure"

export type EmotionalSupportStyle =
  | "gentle grounding"
  | "calm validation"
  | "light pattern noticing"

export const ALLOWED_THEMES = [
  "routine overwhelm",
  "morning exhaustion",
  "medication frustration",
  "feeling unsupported",
  "stress around glucose numbers",
  "burnout from consistency pressure",
  "healthcare frustration",
  "emotional burden",
] as const

export type AllowedTheme = (typeof ALLOWED_THEMES)[number]

export type AllowedContextTag = (typeof ALLOWED_CONTEXT_TAGS)[number]

export type StampleyHistoryMessage = {
  role: "user" | "assistant"
  content: string
}

export type OpenAILongitudinalContext = {
  stressTrend: TrendDirection
  moodTrend: TrendDirection
  energyTrend: TrendDirection
  recurringDomain: SupportDomain | null
  recurringThemes: AllowedTheme[]
  supportStyle: EmotionalSupportStyle
  allowThemeReference: boolean
}

export type StampleyOpenAIContext = {
  phase: ConversationPhase
  supportDomain: SupportDomain
  subscale: string
  studyWeek: 1 | 2 | 3 | 4
  stressBand: StressBand
  moodBand: AffectBand
  energyBand: AffectBand
  highStress: boolean
  contextCategories: AllowedContextTag[]
  todayReflection: string | null
  todayCoping: string | null
  longitudinal: OpenAILongitudinalContext | null
  recentConversation: StampleyHistoryMessage[]
}

export const STAMPLEY_OPENAI_CONTEXT_KEYS = [
  "phase",
  "supportDomain",
  "subscale",
  "studyWeek",
  "stressBand",
  "moodBand",
  "energyBand",
  "highStress",
  "contextCategories",
  "todayReflection",
  "todayCoping",
  "longitudinal",
  "recentConversation",
] as const

export const FORBIDDEN_OPENAI_CONTEXT_KEYS = [
  "email",
  "firstName",
  "userId",
  "studyId",
  "phone",
  "password",
  "authVersion",
  "contactName",
  "contactEmail",
  "contactPhone",
] as const

export const STAMPLEY_RESPONSE_KEYS = [
  "greeting",
  "validation",
  "reflection_question",
  "micro_skill",
  "education_chip",
  "closure",
] as const

export const USER_MESSAGE_MAX_CHARS = 500
export const MAX_HISTORY_MESSAGES = 6
export const MAX_HISTORY_USER_MESSAGES = 3
export const MAX_HISTORY_ASSISTANT_MESSAGES = 3
export const MAX_RECURRING_THEMES = 3

const ALLOWED_CONTEXT_KEY_SET = new Set<string>(STAMPLEY_OPENAI_CONTEXT_KEYS)
const FORBIDDEN_CONTEXT_KEY_SET = new Set<string>(FORBIDDEN_OPENAI_CONTEXT_KEYS)
const ALLOWED_THEME_SET = new Set<string>(ALLOWED_THEMES)
const ALLOWED_SUBSCALE_SET = new Set(
  Object.values(DOMAIN_SUBSCALES).flat()
)
const ALLOWED_CONTEXT_TAG_SET = new Set<string>(ALLOWED_CONTEXT_TAGS)

export type LongitudinalScoreRow = {
  distress: number | null
  mood: number | null
  energy: number | null
  domain: string | null
}

export type ThemeMemoryInput = {
  recurringThemes: string[]
  supportStyle: EmotionalSupportStyle
  allowThemeReference: boolean
}

export type BuildStampleyOpenAIContextInput = {
  distress: unknown
  mood: unknown
  energy: unknown
  domain: unknown
  subscale: unknown
  studyWeek: unknown
  contextTags: unknown
  reflection: unknown
  copingAction: unknown
  phase: ConversationPhase
  recentConversation: StampleyHistoryMessage[]
  longitudinalRows: LongitudinalScoreRow[]
  themeMemory: ThemeMemoryInput | null
}

export type StampleyGenerateLogEvent =
  | { event: "route_entered" }
  | { event: "auth_failure" }
  | { event: "auth_ok" }
  | {
      event: "openai_start"
      phase: ConversationPhase
      highStress: boolean
    }
  | {
      event: "openai_success"
      phase: ConversationPhase
      highStress: boolean
      durationMs: number
    }
  | { event: "openai_failure"; openaiStatus?: number }
  | { event: "parse_failure" }
  | {
      event: "db_failure"
      stage?: StampleyGenerateDiagStage
      errorName?: string
      safeErrorCode?: string
    }
  | {
      event: "unhandled_failure"
      stage?: StampleyGenerateDiagStage
      errorName?: string
      safeErrorCode?: string
    }
  | {
      event: "diag_stage"
      stage: StampleyGenerateDiagStage
      outcome: "start" | "success"
    }

export function isHighStress(distress: number): boolean {
  return distress >= 9
}

export function isStampleyGenerateAuthorized(
  session: { user?: { id?: string | null; role?: unknown } | null } | null | undefined
): boolean {
  return resolveCheckInMutationAccess(session).ok
}

export function toStressBand(distress: number): StressBand {
  if (distress <= 3) return "low"
  if (distress <= 6) return "moderate"
  if (distress <= 8) return "high"
  return "very_high"
}

export function toAffectBand(value: number): AffectBand {
  if (value <= 3) return "low"
  if (value <= 7) return "moderate"
  return "high"
}

export function clampStudyWeek(value: unknown): 1 | 2 | 3 | 4 {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 1
  const week = Math.min(Math.max(Math.floor(n), 1), 4)
  return week as 1 | 2 | 3 | 4
}

export function parseScore(value: unknown, fallback = 5): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 10) return fallback
  return n
}

export function normalizeSupportDomain(domain: unknown): SupportDomain {
  if (isCheckInDomain(domain)) return domain
  return "Emotional"
}

export function allowlistSubscale(subscale: unknown): string {
  if (typeof subscale !== "string") return ""
  const trimmed = subscale.trim()
  if (!ALLOWED_SUBSCALE_SET.has(trimmed)) return ""
  return trimmed
}

export function allowlistContextTags(tags: unknown): AllowedContextTag[] {
  if (!Array.isArray(tags)) return []
  const seen = new Set<AllowedContextTag>()
  const result: AllowedContextTag[] = []
  for (const tag of tags) {
    if (typeof tag !== "string" || !ALLOWED_CONTEXT_TAG_SET.has(tag)) continue
    const allowed = tag as AllowedContextTag
    if (seen.has(allowed)) continue
    seen.add(allowed)
    result.push(allowed)
  }
  return result
}

export function capCappedText(
  value: unknown,
  maxChars: number
): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length <= maxChars ? trimmed : trimmed.slice(0, maxChars)
}

export function sanitizeHistory(history: unknown): StampleyHistoryMessage[] {
  if (!Array.isArray(history)) return []
  const result: StampleyHistoryMessage[] = []
  for (const item of history) {
    if (typeof item !== "object" || item === null) continue
    const role = (item as { role?: unknown }).role
    const content = (item as { content?: unknown }).content
    if (role !== "user" && role !== "assistant") continue
    if (typeof content !== "string") continue
    const trimmed = content.trim()
    if (!trimmed) continue
    result.push({ role, content: trimmed })
  }
  return result
}

export function boundConversationHistory(
  history: StampleyHistoryMessage[]
): StampleyHistoryMessage[] {
  const selected: StampleyHistoryMessage[] = []
  let userCount = 0
  let assistantCount = 0

  for (let i = history.length - 1; i >= 0; i--) {
    const message = history[i]
    if (!message) continue
    if (selected.length >= MAX_HISTORY_MESSAGES) break

    if (message.role === "user") {
      if (userCount >= MAX_HISTORY_USER_MESSAGES) continue
      userCount += 1
      selected.push({
        role: "user",
        content:
          message.content.length <= USER_MESSAGE_MAX_CHARS
            ? message.content
            : message.content.slice(0, USER_MESSAGE_MAX_CHARS),
      })
      continue
    }

    if (assistantCount >= MAX_HISTORY_ASSISTANT_MESSAGES) continue
    assistantCount += 1
    selected.push({
      role: "assistant",
      content: message.content,
    })
  }

  return selected.reverse()
}

export function computeTrend(
  valuesNewestFirst: number[],
  higherIsBetter: boolean
): TrendDirection {
  if (valuesNewestFirst.length < 2) return "insufficient"

  const chronological = [...valuesNewestFirst].reverse()
  const mid = Math.floor(chronological.length / 2)
  if (mid === 0) return "insufficient"

  const older = chronological.slice(0, mid)
  const newer = chronological.slice(mid)
  if (older.length === 0 || newer.length === 0) return "insufficient"

  const mean = (nums: number[]) =>
    nums.reduce((sum, n) => sum + n, 0) / nums.length
  const delta = mean(newer) - mean(older)
  const signed = higherIsBetter ? delta : -delta

  if (signed >= 1) return "improving"
  if (signed <= -1) return "worsening"
  return "stable"
}

export function recurringSupportDomain(
  rows: LongitudinalScoreRow[]
): SupportDomain | null {
  const counts = new Map<SupportDomain, number>()
  for (const row of rows) {
    if (!isCheckInDomain(row.domain)) continue
    counts.set(row.domain, (counts.get(row.domain) ?? 0) + 1)
  }

  let winner: SupportDomain | null = null
  let winnerCount = 0
  for (const [domain, count] of counts) {
    if (count >= 2 && count > winnerCount) {
      winner = domain
      winnerCount = count
    }
  }
  return winner
}

export function allowlistThemes(themes: string[]): AllowedTheme[] {
  const result: AllowedTheme[] = []
  const seen = new Set<AllowedTheme>()
  for (const theme of themes) {
    if (!ALLOWED_THEME_SET.has(theme)) continue
    const allowed = theme as AllowedTheme
    if (seen.has(allowed)) continue
    seen.add(allowed)
    result.push(allowed)
    if (result.length >= MAX_RECURRING_THEMES) break
  }
  return result
}

export function buildOpenAILongitudinalContext(
  rows: LongitudinalScoreRow[],
  themeMemory: ThemeMemoryInput | null
): OpenAILongitudinalContext | null {
  const distress = rows
    .map((row) => row.distress)
    .filter((n): n is number => Number.isFinite(n))
  const mood = rows
    .map((row) => row.mood)
    .filter((n): n is number => Number.isFinite(n))
  const energy = rows
    .map((row) => row.energy)
    .filter((n): n is number => Number.isFinite(n))

  const recurringThemes = allowlistThemes(themeMemory?.recurringThemes ?? [])
  const recurringDomain = recurringSupportDomain(rows)
  const hasTrendSignal =
    distress.length > 0 || mood.length > 0 || energy.length > 0
  const hasThemeSignal =
    recurringThemes.length > 0 ||
    recurringDomain != null ||
    themeMemory != null

  if (!hasTrendSignal && !hasThemeSignal) return null

  return {
    stressTrend: computeTrend(distress, false),
    moodTrend: computeTrend(mood, true),
    energyTrend: computeTrend(energy, true),
    recurringDomain,
    recurringThemes,
    supportStyle: themeMemory?.supportStyle ?? "calm validation",
    allowThemeReference: themeMemory?.allowThemeReference === true,
  }
}

function assertNoForbiddenKeys(value: object, path = "context"): void {
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_CONTEXT_KEY_SET.has(key)) {
      throw new Error(`Forbidden OpenAI context key at ${path}: blocked`)
    }
  }
}

export function assertStampleyOpenAIContext(
  ctx: StampleyOpenAIContext
): StampleyOpenAIContext {
  assertNoForbiddenKeys(ctx)
  for (const key of Object.keys(ctx)) {
    if (!ALLOWED_CONTEXT_KEY_SET.has(key)) {
      throw new Error("OpenAI context contains a non-allowlisted field")
    }
  }
  if (ctx.longitudinal) {
    assertNoForbiddenKeys(ctx.longitudinal, "longitudinal")
  }
  return ctx
}

export function buildStampleyOpenAIContext(
  input: BuildStampleyOpenAIContextInput
): StampleyOpenAIContext {
  const distress = parseScore(input.distress)
  const mood = parseScore(input.mood)
  const energy = parseScore(input.energy)
  const highStress = isHighStress(distress)
  const phase = input.phase

  const todayReflection =
    phase === "opening"
      ? capCappedText(input.reflection, REFLECTION_MAX_LENGTH)
      : null

  const todayCoping =
    phase === "opening" || phase === "coping"
      ? capCappedText(input.copingAction, COPING_MAX_LENGTH)
      : null

  const ctx: StampleyOpenAIContext = {
    phase,
    supportDomain: normalizeSupportDomain(input.domain),
    subscale: allowlistSubscale(input.subscale),
    studyWeek: clampStudyWeek(input.studyWeek),
    stressBand: toStressBand(distress),
    moodBand: toAffectBand(mood),
    energyBand: toAffectBand(energy),
    highStress,
    contextCategories: allowlistContextTags(input.contextTags),
    todayReflection,
    todayCoping,
    longitudinal: buildOpenAILongitudinalContext(
      input.longitudinalRows,
      input.themeMemory
    ),
    recentConversation: boundConversationHistory(input.recentConversation),
  }

  return assertStampleyOpenAIContext(ctx)
}

export function buildChatSessionSummary(
  snapshot: { domain: string | null },
  userCount: number,
  assistantCount: number
): string {
  const parts = [
    snapshot.domain ? `Focus domain: ${snapshot.domain}.` : null,
    `Stampley chat: ${userCount} participant reply${
      userCount === 1 ? "" : "ies"
    }, ${assistantCount} Stampley turn${assistantCount === 1 ? "" : "s"}.`,
  ].filter(Boolean)
  return parts.join(" ")
}

export function serializeStampleyGenerateLog(
  payload: StampleyGenerateLogEvent
): { line: string; details: Record<string, unknown> } {
  const { event, ...rest } = payload
  const details: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue
    details[key] = value
  }
  return {
    line: `[stampley/generate] ${event}`,
    details,
  }
}

export function stampleyGenerateLog(
  logger: Pick<Console, "log" | "error">,
  payload: StampleyGenerateLogEvent
): void {
  const { line, details } = serializeStampleyGenerateLog(payload)
  const isError =
    payload.event === "auth_failure" ||
    payload.event === "openai_failure" ||
    payload.event === "parse_failure" ||
    payload.event === "db_failure" ||
    payload.event === "unhandled_failure"

  if (isError) {
    if (Object.keys(details).length > 0) logger.error(line, details)
    else logger.error(line)
    return
  }

  if (Object.keys(details).length > 0) logger.log(line, details)
  else logger.log(line)
}
