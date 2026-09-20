export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import {
  buildCsv,
  exportFilename,
  finalizeAdminCsvExport,
  formatCsvTimestamp,
  requireCodedExportApi,
} from "@/lib/admin-csv-export"
import { genericExportRejectedResponse } from "@/lib/admin-export-response"
import { buildPrismaSessionFilter } from "@/lib/admin-analytics-filters"
import {
  CODED_EXPORT_MAX_ROWS,
  GENERIC_EXPORT_LIMIT_ERROR,
  STAMPLEY_SESSION_EXPORT_HEADERS,
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
  const sessionFilter = buildPrismaSessionFilter(filters)

  const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      u.study_id,
      s.domain,
      s.stress_level,
      s.mood,
      s.energy,
      s.user_message_count,
      s.assistant_message_count,
      s.created_at
    FROM stampley_chat_sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN check_in_submissions c ON c.id = s.check_in_submission_id
    WHERE u.role = 'PARTICIPANT'${sessionFilter.and}
    ORDER BY s.created_at DESC
    LIMIT ${CODED_EXPORT_MAX_ROWS + 1}
  `

  if (result.length > CODED_EXPORT_MAX_ROWS) {
    return genericExportRejectedResponse(GENERIC_EXPORT_LIMIT_ERROR)
  }

  const rows = result.map((row) => [
    codedStudyId(row.study_id),
    forCsv(row.domain),
    codedStressBand(row.stress_level),
    codedAffectBand(row.mood),
    codedAffectBand(row.energy),
    forCsv(row.user_message_count),
    forCsv(row.assistant_message_count),
    formatCsvTimestamp(row.created_at),
  ])

  const csv = buildCsv([...STAMPLEY_SESSION_EXPORT_HEADERS], rows)
  return finalizeAdminCsvExport({
    actor: admin.actor,
    action: "ADMIN_STAMPLEY_SESSION_EXPORTED",
    csv,
    filename: exportFilename("stampley-sessions"),
    metadata: {
      filterKeys: filterKeysFromAnalytics(filters),
      rowCount: rows.length,
      identified: false,
      exportMode: "CODED",
    },
  })
}
