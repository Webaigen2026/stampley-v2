export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"
import { prisma } from "@/lib/prisma"
import { resolveCheckInMutationAccess } from "@/lib/check-in-mutation-authz"
import {
  STAMPLEY_TRANSCRIPT_ORIGIN,
  sanitizeCompatibilityMessages,
} from "@/lib/stampley-open-session"

export async function POST(req: NextRequest) {
  const session = await auth()
  const access = resolveCheckInMutationAccess(session)
  if (!access.ok) {
    return jsonWithSensitiveCache({ error: access.error }, { status: access.status })
  }
  const userId = access.userId

  try {
    const body = await req.json()
    const {
      checkInSubmissionId,
      domain,
      stressLevel,
      mood,
      energy,
      userMessageCount,
      assistantMessageCount,
      summary,
      messages,
    } = body

    if (
      typeof checkInSubmissionId !== "string" ||
      !checkInSubmissionId.trim()
    ) {
      return jsonWithSensitiveCache(
        { error: "checkInSubmissionId is required" },
        { status: 400 }
      )
    }

    const owned = await prisma.checkInSubmission.findFirst({
      where: {
        id: checkInSubmissionId.trim(),
        userId,
      },
      select: { id: true },
    })

    if (!owned) {
      return jsonWithSensitiveCache(
        { error: "Check-in not found" },
        { status: 404 }
      )
    }

    // Compatibility create for the current Complete Check-In client.
    // This must create a new linked LEGACY_CLIENT row. It must not update() an open
    // (checkInSubmissionId = null) server-owned transcript, and it must never
    // accept client-controlled transcriptOrigin / source:"server".
    await prisma.stampleyChatSession.create({
      data: {
        userId,
        checkInSubmissionId: checkInSubmissionId.trim(),
        domain: typeof domain === "string" ? domain : null,
        stressLevel: Number.isFinite(Number(stressLevel))
          ? Number(stressLevel)
          : null,
        mood: Number.isFinite(Number(mood)) ? Number(mood) : null,
        energy: Number.isFinite(Number(energy)) ? Number(energy) : null,
        userMessageCount: Number.isFinite(Number(userMessageCount))
          ? Number(userMessageCount)
          : 0,
        assistantMessageCount: Number.isFinite(Number(assistantMessageCount))
          ? Number(assistantMessageCount)
          : 0,
        summary: typeof summary === "string" ? summary : null,
        messages: sanitizeCompatibilityMessages(messages),
        transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.LEGACY_CLIENT,
      },
    })

    return jsonWithSensitiveCache({ success: true })
  } catch (error) {
    console.error("[stampley/session]", error)
    return jsonWithSensitiveCache(
      { error: "Failed to save chat session" },
      { status: 500 }
    )
  }
}
