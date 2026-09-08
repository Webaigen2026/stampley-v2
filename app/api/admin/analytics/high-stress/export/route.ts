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
  buildPrismaHighStressTableFilter,
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
  "needs_safety_escalation",
  "consecutive_high_distress_days",
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
  const highStressFilter = buildPrismaHighStressTableFilter(filters)

  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      u.email AS user_email,
      c.check_in_date,
      c.distress AS stress_level,
      c.mood,
      c.energy,
      c.domain,
      c.subscale,
      c.needs_safety_escalation,
      c.consecutive_high_distress_days,
      c.created_at
    FROM check_in_submissions c
    JOIN users u ON u.id = c.user_id
    WHERE u.role = 'PARTICIPANT'${highStressFilter.and}
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
    formatCsvBoolean(row.needs_safety_escalation),
    forCsv(row.consecutive_high_distress_days),
    formatCsvTimestamp(row.created_at),
  ])

  const csv = buildCsv(HEADERS, rows)
  return csvFileResponse(csv, exportFilename("stampley-high-stress"))
}
