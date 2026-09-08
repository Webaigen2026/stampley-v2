export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import {
  buildCsv,
  csvFileResponse,
  exportFilename,
  formatCsvTimestamp,
  requireAdminApi,
} from "@/lib/admin-csv-export"
import {
  buildPrismaSessionFilter,
  parseAnalyticsFilters,
} from "@/lib/admin-analytics-filters"

const HEADERS = [
  "user_email",
  "check_in_submission_id",
  "domain",
  "stress_level",
  "mood",
  "energy",
  "user_message_count",
  "assistant_message_count",
  "summary",
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
  const sessionFilter = buildPrismaSessionFilter(filters)

  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      u.email AS user_email,
      s.check_in_submission_id,
      s.domain,
      s.stress_level,
      s.mood,
      s.energy,
      s.user_message_count,
      s.assistant_message_count,
      s.summary,
      s.created_at
    FROM stampley_chat_sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN check_in_submissions c ON c.id = s.check_in_submission_id
    WHERE u.role = 'PARTICIPANT'${sessionFilter.and}
    ORDER BY s.created_at DESC
  `

  const rows = result.map((row) => [
    forCsv(row.user_email),
    forCsv(row.check_in_submission_id),
    forCsv(row.domain),
    forCsv(row.stress_level),
    forCsv(row.mood),
    forCsv(row.energy),
    forCsv(row.user_message_count),
    forCsv(row.assistant_message_count),
    forCsv(row.summary),
    formatCsvTimestamp(row.created_at),
  ])

  const csv = buildCsv(HEADERS, rows)
  return csvFileResponse(csv, exportFilename("stampley-sessions"))
}
