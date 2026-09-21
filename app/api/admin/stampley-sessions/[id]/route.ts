export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"
import { appendAuditEventFailOpen } from "@/lib/audit"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { resolveAdminStampleyTranscriptGet } from "@/lib/admin-stampley-transcript"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await context.params

  const result = await resolveAdminStampleyTranscriptGet({
    session,
    sessionId: id,
    loadSession: async (sessionId) =>
      prisma.stampleyChatSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          userId: true,
          messages: true,
        },
      }),
    recordDenied: async (actor) => {
      await appendAuditEventFailOpen(prisma, actor, {
        action: "AUTH_ADMIN_ACCESS_DENIED",
        resourceType: "AUTH_SESSION",
        outcome: "DENIED",
      })
    },
    recordView: async ({ resourceId, subjectUserId }) => {
      await recordPhiPageViewOrThrow({
        action: "ADMIN_STAMPLEY_TRANSCRIPT_LIST_VIEWED",
        resourceType: "STAMPLEY_SESSION",
        resourceId,
        subjectUserId,
        metadata: { includesTranscripts: true },
      })
    },
  })

  return jsonWithSensitiveCache(result.body, { status: result.status })
}
