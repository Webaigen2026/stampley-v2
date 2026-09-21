export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"
import { appendAuditEventFailOpen } from "@/lib/audit"
import { recordPhiPageViewOrThrow } from "@/lib/admin-phi-page"
import { resolveAdminPostSurveyReflectionGet } from "@/lib/admin-post-survey-reflection-get"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await context.params

  const result = await resolveAdminPostSurveyReflectionGet({
    session,
    responseId: id,
    loadResponse: async (responseId) =>
      prisma.postSurveyResponse.findUnique({
        where: { id: responseId },
        select: {
          id: true,
          userId: true,
          openReflection: true,
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
        action: "ADMIN_POST_SURVEY_LIST_VIEWED",
        resourceType: "POST_SURVEY",
        resourceId,
        subjectUserId,
        metadata: {
          includesNarratives: true,
        },
      })
    },
  })

  return jsonWithSensitiveCache(result.body, { status: result.status })
}
