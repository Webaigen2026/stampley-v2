import { NextResponse } from "next/server"

export function csvFileResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

export function genericExportFailureResponse(): NextResponse {
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  )
}

export function genericExportRejectedResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
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
