import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  createAuditRequestId,
  type AuditActor,
} from "@/lib/audit"
import {
  actorFromSession,
  persistExportAuditOrThrow,
  recordExportDeniedFailOpen,
} from "@/lib/audit-admin"
import { respondWithAuditedCsv } from "@/lib/admin-export-response"

export {
  csvFileResponse,
  genericExportFailureResponse,
  respondWithAuditedCsv,
} from "@/lib/admin-export-response"

export function escapeCsvValue(value: unknown): string {
  if (value == null) return ""
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ]
  return lines.join("\n")
}

export function exportFilename(prefix: string): string {
  const dateStamp = new Date().toISOString().slice(0, 10)
  return `${prefix}-${dateStamp}.csv`
}

export function formatCsvTimestamp(value: unknown): string {
  if (value == null || value === "") return ""
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString()
}

export function formatCsvDate(value: unknown): string {
  if (value == null || value === "") return ""
  const d = new Date(String(value))
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toISOString().slice(0, 10)
}

export function formatCsvBoolean(value: unknown): string {
  if (value === true || value === "true" || value === "t") return "true"
  if (value === false || value === "false" || value === "f") return "false"
  return ""
}

export async function requireAdminApi(): Promise<
  | { ok: true; actor: AuditActor }
  | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  if (session.user.role !== "ADMIN") {
    await recordExportDeniedFailOpen(prisma, session)
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  const actor = actorFromSession(session)
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { ok: true, actor }
}

export async function finalizeAdminCsvExport(args: {
  actor: AuditActor
  action:
    | "ADMIN_CHECKIN_EXPORTED"
    | "ADMIN_HIGH_STRESS_EXPORTED"
    | "ADMIN_STAMPLEY_SESSION_EXPORTED"
  csv: string
  filename: string
  metadata: unknown
}): Promise<Response> {
  const requestId = createAuditRequestId()
  return respondWithAuditedCsv({
    csv: args.csv,
    filename: args.filename,
    persistAudit: () =>
      persistExportAuditOrThrow({
        db: prisma,
        actor: args.actor,
        action: args.action,
        requestId,
        metadata: args.metadata,
      }),
  })
}
