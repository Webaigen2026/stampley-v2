export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import {
  buildCsv,
  csvFileResponse,
  exportFilename,
  formatCsvBoolean,
  formatCsvDate,
  formatCsvTimestamp,
  requireAdminApi,
} from "@/lib/admin-csv-export"
import {
  buildPrismaCheckInFilter,
  parseAnalyticsFilters,
} from "@/lib/admin-analytics-filters"

const HEADERS = [
  "user_email",
  "check_in_date",
  "stress_level",
  "mood",
  "energy",
  "domain",
  "subscale",
  "week_number",
  "day_number",
  "needs_safety_escalation",
  "created_at",
]

function forCsv(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value)
  if (value instanceof Prisma.Decimal) return value.toNumber()
  return value
}

export async function GET(req: NextRequest) {
  const admin = await requireAdminApi()
  if (!admin.ok) return admin.response

  const filters = parseAnalyticsFilters(new URL(req.url).searchParams)
  const checkInFilter = buildPrismaCheckInFilter(filters)

  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      u.email AS user_email,
      c.check_in_date,
      c.distress AS stress_level,
      c.mood,
      c.energy,
      c.domain,
      c.subscale,
      c.week_number,
      c.day_number,
      c.needs_safety_escalation,
      c.created_at
    FROM check_in_submissions c
    JOIN users u ON u.id = c.user_id
    WHERE u.role = 'PARTICIPANT'${checkInFilter.and}
    ORDER BY c.check_in_date DESC, c.created_at DESC
  `

  const rows = result.map((row) => [
    forCsv(row.user_email),
    formatCsvDate(row.check_in_date),
    forCsv(row.stress_level),
    forCsv(row.mood),
    forCsv(row.energy),
    forCsv(row.domain),
    forCsv(row.subscale),
    forCsv(row.week_number),
    forCsv(row.day_number),
    formatCsvBoolean(row.needs_safety_escalation),
    formatCsvTimestamp(row.created_at),
  ])

  const csv = buildCsv(HEADERS, rows)
  return csvFileResponse(csv, exportFilename("stampley-check-ins"))
}
