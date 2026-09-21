import { Prisma } from "@/lib/generated/prisma/client"
import type { AnalyticsFilters } from "@/lib/admin-analytics-url"

export {
  STUDY_DOMAINS,
  parseAnalyticsFilters,
  withoutIdentifiedSearch,
  parseUrlSafeAnalyticsFilters,
  hasActiveUrlSafeAnalyticsFilters,
  hasActiveAnalyticsFilters,
  buildUrlSafeAnalyticsQueryString,
  buildAnalyticsQueryString,
  type StudyDomain,
  type AnalyticsFilters,
  type UrlSafeAnalyticsFilters,
} from "@/lib/admin-analytics-url"

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
