import { NextResponse } from "next/server"
import {
  SENSITIVE_RESPONSE_HEADERS,
  jsonWithSensitiveCache,
} from "@/lib/sensitive-cache-headers"

export function csvFileResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...SENSITIVE_RESPONSE_HEADERS,
      "X-Content-Type-Options": "nosniff",
    },
  })
}

export function genericExportFailureResponse(): NextResponse {
  return jsonWithSensitiveCache(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  )
}

export function genericExportRejectedResponse(message: string): NextResponse {
  return jsonWithSensitiveCache({ error: message }, { status: 400 })
}

export async function respondWithAuditedCsv(args: {
  persistAudit: () => Promise<void>
  csv: string
  filename: string
}): Promise<Response> {
  try {
    await args.persistAudit()
  } catch {
    return genericExportFailureResponse()
  }
  return csvFileResponse(args.csv, args.filename)
}
