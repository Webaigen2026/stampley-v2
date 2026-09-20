export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import {
  buildCsv,
  exportFilename,
  finalizeAdminCsvExport,
  formatCsvBoolean,
  formatCsvDate,
  formatCsvTimestamp,
  requireCodedExportApi,
} from "@/lib/admin-csv-export"
import { genericExportRejectedResponse } from "@/lib/admin-export-response"
import { buildPrismaCheckInFilter } from "@/lib/admin-analytics-filters"
import {
  CHECK_IN_EXPORT_HEADERS,
  CODED_EXPORT_MAX_ROWS,
  GENERIC_EXPORT_LIMIT_ERROR,
  codedStudyId,
  parseCodedExportFilters,
} from "@/lib/admin-export-filters"
import { codedAffectBand, codedStressBand } from "@/lib/admin-coded-scores"
import { filterKeysFromAnalytics } from "@/lib/audit-metadata"

function forCsv(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value)
  if (value instanceof Prisma.Decimal) return value.toNumber()
  return value
}

export async function GET(req: NextRequest) {
  const admin = await requireCodedExportApi()
  if (!admin.ok) return admin.response

  const parsed = parseCodedExportFilters(new URL(req.url).searchParams)
  if (!parsed.ok) {
    return genericExportRejectedResponse(parsed.error)
  }
  const filters = parsed.filters
  const checkInFilter = buildPrismaCheckInFilter(filters)

  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      u.study_id,
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
    LIMIT ${CODED_EXPORT_MAX_ROWS + 1}
  `

  if (result.length > CODED_EXPORT_MAX_ROWS) {
    return genericExportRejectedResponse(GENERIC_EXPORT_LIMIT_ERROR)
  }

  const rows = result.map((row) => [
    codedStudyId(row.study_id),
    formatCsvDate(row.check_in_date),
    codedStressBand(row.stress_level),
    codedAffectBand(row.mood),
    codedAffectBand(row.energy),
    forCsv(row.domain),
    forCsv(row.subscale),
    forCsv(row.week_number),
    forCsv(row.day_number),
    formatCsvBoolean(row.needs_safety_escalation),
    formatCsvTimestamp(row.created_at),
  ])

  const csv = buildCsv([...CHECK_IN_EXPORT_HEADERS], rows)
  return finalizeAdminCsvExport({
    actor: admin.actor,
    action: "ADMIN_CHECKIN_EXPORTED",
    csv,
    filename: exportFilename("stampley-check-ins"),
    metadata: {
      filterKeys: filterKeysFromAnalytics(filters),
      rowCount: rows.length,
      identified: false,
      exportMode: "CODED",
    },
  })
}
