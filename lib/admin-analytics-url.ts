export const STUDY_DOMAINS = [
  "Emotional",
  "Regimen",
  "Physician",
  "Interpersonal",
] as const

export type StudyDomain = (typeof STUDY_DOMAINS)[number]

export type AnalyticsFilters = {
  q: string | null
  from: string | null
  to: string | null
  domain: StudyDomain | null
  highStress: boolean
  week: number | null
}

export type UrlSafeAnalyticsFilters = Omit<AnalyticsFilters, "q">

type SearchParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

function readParam(
  source: SearchParamSource,
  key: string
): string | undefined {
  if (source instanceof URLSearchParams) {
    const value = source.get(key)
    return value ?? undefined
  }
  const raw = source[key]
  if (Array.isArray(raw)) return raw[0]
  return raw
}

function parseDateParam(value: string | undefined): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const d = new Date(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  return trimmed
}

function parseDomainParam(value: string | undefined): StudyDomain | null {
  if (!value?.trim() || value.trim().toUpperCase() === "ALL") return null
  const trimmed = value.trim()
  return STUDY_DOMAINS.includes(trimmed as StudyDomain)
    ? (trimmed as StudyDomain)
    : null
}

function parseWeekParam(value: string | undefined): number | null {
  if (!value?.trim() || value.trim().toUpperCase() === "ALL") return null
  const week = Number(value)
  if (!Number.isInteger(week) || week < 1 || week > 4) return null
  return week
}

export function parseAnalyticsFilters(
  source: SearchParamSource
): AnalyticsFilters {
  const qRaw = readParam(source, "q")?.trim()
  const highStressRaw = readParam(source, "highStress")

  return {
    q: qRaw && qRaw.length > 0 ? qRaw : null,
    from: parseDateParam(readParam(source, "from")),
    to: parseDateParam(readParam(source, "to")),
    domain: parseDomainParam(readParam(source, "domain")),
    highStress:
      highStressRaw === "true" ||
      highStressRaw === "1" ||
      highStressRaw === "on",
    week: parseWeekParam(readParam(source, "week")),
  }
}

export function withoutIdentifiedSearch(
  filters: AnalyticsFilters
): AnalyticsFilters {
  return { ...filters, q: null }
}

export function parseUrlSafeAnalyticsFilters(
  source: SearchParamSource
): AnalyticsFilters {
  return withoutIdentifiedSearch(parseAnalyticsFilters(source))
}

export function hasActiveUrlSafeAnalyticsFilters(
  filters: AnalyticsFilters
): boolean {
  return Boolean(
    filters.from ||
      filters.to ||
      filters.domain ||
      filters.highStress ||
      filters.week
  )
}

export function hasActiveAnalyticsFilters(filters: AnalyticsFilters): boolean {
  return Boolean(filters.q) || hasActiveUrlSafeAnalyticsFilters(filters)
}

/**
 * Serializes URL-safe analytics filters only. Identified search (`q`) must
 * never be written into location.search or export GET URLs.
 */
export function buildUrlSafeAnalyticsQueryString(
  filters: AnalyticsFilters | UrlSafeAnalyticsFilters
): string {
  const params = new URLSearchParams()
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.domain) params.set("domain", filters.domain)
  if (filters.highStress) params.set("highStress", "true")
  if (filters.week != null) params.set("week", String(filters.week))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/** @deprecated Use buildUrlSafeAnalyticsQueryString — never serializes `q`. */
export function buildAnalyticsQueryString(
  filters: AnalyticsFilters | UrlSafeAnalyticsFilters
): string {
  return buildUrlSafeAnalyticsQueryString(filters)
}
