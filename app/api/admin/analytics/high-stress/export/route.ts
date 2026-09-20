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
import { buildPrismaHighStressTableFilter } from "@/lib/admin-analytics-filters"
import {
  CODED_EXPORT_MAX_ROWS,
  GENERIC_EXPORT_LIMIT_ERROR,
  HIGH_STRESS_EXPORT_HEADERS,
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
  const highStressFilter = buildPrismaHighStressTableFilter(filters)

  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      u.study_id,
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
    formatCsvBoolean(row.needs_safety_escalation),
    forCsv(row.consecutive_high_distress_days),
    formatCsvTimestamp(row.created_at),
  ])

  const csv = buildCsv([...HIGH_STRESS_EXPORT_HEADERS], rows)
  return finalizeAdminCsvExport({
    actor: admin.actor,
    action: "ADMIN_HIGH_STRESS_EXPORTED",
    csv,
    filename: exportFilename("stampley-high-stress"),
    metadata: {
      filterKeys: filterKeysFromAnalytics(filters),
      rowCount: rows.length,
      identified: false,
      exportMode: "CODED",
    },
  })
}
