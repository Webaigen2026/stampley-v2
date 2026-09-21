import {
  parseAnalyticsFilters,
  STUDY_DOMAINS,
  withoutIdentifiedSearch,
  type AnalyticsFilters,
} from "@/lib/admin-analytics-url"

export const CHECK_IN_EXPORT_HEADERS = [
  "study_id",
  "check_in_date",
  "stress_band",
  "mood_band",
  "energy_band",
  "domain",
  "subscale",
  "week_number",
  "day_number",
  "needs_safety_escalation",
  "created_at",
] as const

export const HIGH_STRESS_EXPORT_HEADERS = [
  "study_id",
  "check_in_date",
  "stress_band",
  "mood_band",
  "energy_band",
  "domain",
  "subscale",
  "needs_safety_escalation",
  "consecutive_high_distress_days",
  "created_at",
] as const

export const STAMPLEY_SESSION_EXPORT_HEADERS = [
  "study_id",
  "domain",
  "stress_band",
  "mood_band",
  "energy_band",
  "user_message_count",
  "assistant_message_count",
  "created_at",
] as const

export const CODED_EXPORT_MAX_ROWS = 10_000
export const GENERIC_EXPORT_FILTER_ERROR = "Invalid export filters."
export const GENERIC_EXPORT_LIMIT_ERROR =
  "Export exceeds the maximum of 10000 rows."

type SearchParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

export type CodedExportFilterResult =
  | { ok: true; filters: AnalyticsFilters }
  | { ok: false; error: typeof GENERIC_EXPORT_FILTER_ERROR }

function readParam(source: SearchParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined
  }
  const raw = source[key]
  if (Array.isArray(raw)) return raw[0]
  return raw
}

function isEmptyParam(value: string | undefined): boolean {
  return value == null || value.trim() === "" || value.trim().toUpperCase() === "ALL"
}

function isValidDateParam(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function parseCodedExportFilters(
  source: SearchParamSource
): CodedExportFilterResult {
  const fromRaw = readParam(source, "from")
  const toRaw = readParam(source, "to")
  const domainRaw = readParam(source, "domain")
  const weekRaw = readParam(source, "week")
  const highStressRaw = readParam(source, "highStress")

  if (fromRaw != null && fromRaw.trim() !== "" && !isValidDateParam(fromRaw.trim())) {
    return { ok: false, error: GENERIC_EXPORT_FILTER_ERROR }
  }
  if (toRaw != null && toRaw.trim() !== "" && !isValidDateParam(toRaw.trim())) {
    return { ok: false, error: GENERIC_EXPORT_FILTER_ERROR }
  }
  if (
    fromRaw != null &&
    toRaw != null &&
    fromRaw.trim() !== "" &&
    toRaw.trim() !== "" &&
    fromRaw.trim() > toRaw.trim()
  ) {
    return { ok: false, error: GENERIC_EXPORT_FILTER_ERROR }
  }
  if (!isEmptyParam(domainRaw)) {
    if (!STUDY_DOMAINS.includes(domainRaw!.trim() as (typeof STUDY_DOMAINS)[number])) {
      return { ok: false, error: GENERIC_EXPORT_FILTER_ERROR }
    }
  }
  if (!isEmptyParam(weekRaw)) {
    const week = Number(weekRaw)
    if (!Number.isInteger(week) || week < 1 || week > 4) {
      return { ok: false, error: GENERIC_EXPORT_FILTER_ERROR }
    }
  }
  if (
    highStressRaw != null &&
    highStressRaw.trim() !== "" &&
    !["true", "1", "on", "false", "0", "off"].includes(highStressRaw.trim())
  ) {
    return { ok: false, error: GENERIC_EXPORT_FILTER_ERROR }
  }

  const filters = withoutIdentifiedSearch(parseAnalyticsFilters(source))
  return { ok: true, filters }
}

export function codedStudyId(value: unknown): string {
  if (typeof value !== "string") return "UNASSIGNED"
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "UNASSIGNED"
}
