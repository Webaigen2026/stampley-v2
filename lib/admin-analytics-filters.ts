import { Prisma } from "@/lib/generated/prisma/client"

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

export function hasActiveAnalyticsFilters(filters: AnalyticsFilters): boolean {
  return Boolean(
    filters.q ||
      filters.from ||
      filters.to ||
      filters.domain ||
      filters.highStress ||
      filters.week
  )
}

export function buildAnalyticsQueryString(filters: AnalyticsFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.domain) params.set("domain", filters.domain)
  if (filters.highStress) params.set("highStress", "true")
  if (filters.week != null) params.set("week", String(filters.week))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Prisma.sql fragments for analytics page, CSV exports, and admin Stampley chats.
 */
const TABLE_ALIASES = ["c", "u", "s", "c2", "c_sess"] as const
type TableAlias = (typeof TABLE_ALIASES)[number]

const TABLE_COLUMNS = [
  "email",
  "check_in_date",
  "domain",
  "week_number",
  "distress",
  "created_at",
  "stress_level",
] as const
type TableColumn = (typeof TABLE_COLUMNS)[number]

export type PrismaSqlFilter = {
  /** ` AND cond AND cond`, or empty */
  and: Prisma.Sql
  /** `cond AND cond`, or `TRUE` for JOIN ON / FILTER */
  on: Prisma.Sql
}

function ident(alias: TableAlias, column: TableColumn): Prisma.Sql {
  if (
    !(TABLE_ALIASES as readonly string[]).includes(alias) ||
    !(TABLE_COLUMNS as readonly string[]).includes(column)
  ) {
    throw new Error("Invalid SQL identifier")
  }
  return Prisma.raw(`${alias}.${column}`)
}

function andClause(conditions: Prisma.Sql[]): Prisma.Sql {
  if (conditions.length === 0) return Prisma.empty
  return Prisma.sql` AND ${Prisma.join(conditions, " AND ")}`
}

function onClause(conditions: Prisma.Sql[]): Prisma.Sql {
  if (conditions.length === 0) return Prisma.sql`TRUE`
  return Prisma.join(conditions, " AND ")
}

function prismaCheckInConditions(
  filters: AnalyticsFilters,
  c: TableAlias,
  u: TableAlias
): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = []

  if (filters.q) {
    conditions.push(
      Prisma.sql`${ident(u, "email")} ILIKE ${`%${filters.q}%`}`
    )
  }
  if (filters.from) {
    conditions.push(
      Prisma.sql`${ident(c, "check_in_date")} >= ${filters.from}::date`
    )
  }
  if (filters.to) {
    conditions.push(
      Prisma.sql`${ident(c, "check_in_date")} <= ${filters.to}::date`
    )
  }
  if (filters.domain) {
    conditions.push(Prisma.sql`${ident(c, "domain")} = ${filters.domain}`)
  }
  if (filters.week != null) {
    conditions.push(
      Prisma.sql`${ident(c, "week_number")} = ${filters.week}`
    )
  }
  if (filters.highStress) {
    conditions.push(Prisma.sql`${ident(c, "distress")} >= 9`)
  }

  return conditions
}

function prismaSessionConditions(
  filters: AnalyticsFilters,
  s: TableAlias,
  u: TableAlias,
  c: TableAlias
): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = []

  if (filters.q) {
    conditions.push(
      Prisma.sql`${ident(u, "email")} ILIKE ${`%${filters.q}%`}`
    )
  }
  if (filters.from) {
    conditions.push(
      Prisma.sql`${ident(s, "created_at")}::date >= ${filters.from}::date`
    )
  }
  if (filters.to) {
    conditions.push(
      Prisma.sql`${ident(s, "created_at")}::date <= ${filters.to}::date`
    )
  }
  if (filters.domain) {
    conditions.push(
      Prisma.sql`(${ident(s, "domain")} = ${filters.domain} OR ${ident(c, "domain")} = ${filters.domain})`
    )
  }
  if (filters.week != null) {
    conditions.push(
      Prisma.sql`${ident(c, "week_number")} = ${filters.week}`
    )
  }
  if (filters.highStress) {
    conditions.push(
      Prisma.sql`(${ident(s, "stress_level")} >= 9 OR ${ident(c, "distress")} >= 9)`
    )
  }

  return conditions
}

export function buildPrismaCheckInFilter(
  filters: AnalyticsFilters,
  options: { c?: TableAlias; u?: TableAlias } = {}
): PrismaSqlFilter {
  const conditions = prismaCheckInConditions(
    filters,
    options.c ?? "c",
    options.u ?? "u"
  )
  return { and: andClause(conditions), on: onClause(conditions) }
}

export function buildPrismaSessionFilter(
  filters: AnalyticsFilters,
  options: { s?: TableAlias; u?: TableAlias; c?: TableAlias } = {}
): PrismaSqlFilter {
  const conditions = prismaSessionConditions(
    filters,
    options.s ?? "s",
    options.u ?? "u",
    options.c ?? "c"
  )
  return { and: andClause(conditions), on: onClause(conditions) }
}

export function buildPrismaHighStressTableFilter(
  filters: AnalyticsFilters
): PrismaSqlFilter {
  const conditions = prismaCheckInConditions(
    { ...filters, highStress: false },
    "c",
    "u"
  )
  conditions.push(Prisma.sql`${ident("c", "distress")} >= 9`)
  return { and: andClause(conditions), on: onClause(conditions) }
}

export function buildPrismaParticipantUserFilter(
  filters: AnalyticsFilters,
  u: TableAlias = "u"
): PrismaSqlFilter {
  if (!filters.q) {
    return { and: Prisma.empty, on: Prisma.sql`TRUE` }
  }
  const condition = Prisma.sql`${ident(u, "email")} ILIKE ${`%${filters.q}%`}`
  return {
    and: Prisma.sql` AND ${condition}`,
    on: condition,
  }
}

export function buildPrismaCheckInRowFilter(
  filters: AnalyticsFilters,
  c: TableAlias = "c"
): PrismaSqlFilter {
  return buildPrismaCheckInFilter({ ...filters, q: null }, { c, u: "u" })
}

export function buildPrismaSessionRowFilter(
  filters: AnalyticsFilters,
  options: { s?: TableAlias; c?: TableAlias } = {}
): PrismaSqlFilter {
  return buildPrismaSessionFilter(
    { ...filters, q: null },
    { s: options.s ?? "s", u: "u", c: options.c ?? "c_sess" }
  )
}
