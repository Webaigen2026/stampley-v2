export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonWithSensitiveCache } from "@/lib/sensitive-cache-headers"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"
import { buildCheckInStudyContext } from "@/lib/check-in-context"
import {
  buildOpenAIMessages,
  deriveConversationPhase,
  getStampleyFallbackResponse,
  normalizeDomain,
  type StampleyPhase,
} from "@/lib/stampley-prompt"
import { getRecentEmotionalThemes } from "@/lib/stampley-memory"
import {
  buildStampleyOpenAIContext,
  isHighStress,
  parseScore,
  stampleyGenerateLog,
  type LongitudinalScoreRow,
  type StampleyHistoryMessage,
} from "@/lib/stampley-openai-context"
import { resolveCheckInMutationAccess } from "@/lib/check-in-mutation-authz"
import {
  CHECK_IN_ALREADY_COMPLETED_MESSAGE,
  buildAuthoritativeOpenAIConversationHistory,
  createPrismaOpenSessionRunner,
  findOwnedAuthoritativeAssistantReply,
  parseParticipantMessageId,
  persistOwnedAssistantTurn,
  persistOwnedParticipantTurn,
  resolveIncomingParticipantTurn,
  INVALID_PARTICIPANT_MESSAGE_ID_MESSAGE,
} from "@/lib/stampley-open-session"
import { selectStampleyResponseMode } from "@/lib/stampley-response-mode"
import type { Domain } from "@/store/checkin-store"

export async function POST(req: NextRequest) {
  stampleyGenerateLog(console, { event: "route_entered" })

  const session = await auth()
  const access = resolveCheckInMutationAccess(session)
  if (!access.ok) {
    stampleyGenerateLog(console, { event: "auth_failure" })
    return jsonWithSensitiveCache(
      { error: access.error },
      { status: access.status }
    )
  }
  const userId = access.userId

  stampleyGenerateLog(console, { event: "auth_ok" })

  try {
    const body = await req.json()

    const {
      distress,
      mood,
      energy,
      contextTags,
      reflection,
      copingAction,
      domain,
      messageHistory,
      conversationPhase,
      messageId,
    } = body

    // messageHistory is tolerated for incoming-turn detection / greeting only.
    // It is NOT used as OpenAI conversation authority (3D.2A-3).
    const incomingTurn = resolveIncomingParticipantTurn(messageHistory)
    if (incomingTurn.kind === "rejected") {
      return jsonWithSensitiveCache(
        { error: "Message cannot be empty" },
        { status: 400 }
      )
    }

    let openSessionId: string | null = null
    let participantMessageId: string | null = null
    let authoritativeHistory: StampleyHistoryMessage[] = []
    let authoritativeParticipantText: string | null = null

    if (incomingTurn.kind === "accepted") {
      // 3D.2A-1/2/3: persist under advisory + completion guard; history from DB.
      const persisted = await persistOwnedParticipantTurn(
        createPrismaOpenSessionRunner(prisma),
        userId,
        incomingTurn.content,
        messageId
      )
      if (!persisted.ok) {
        if (persisted.error === "invalid_message_id") {
          return jsonWithSensitiveCache(
            { error: INVALID_PARTICIPANT_MESSAGE_ID_MESSAGE },
            { status: 400 }
          )
        }
        if (persisted.error === "check_in_completed") {
          return jsonWithSensitiveCache(
            { error: CHECK_IN_ALREADY_COMPLETED_MESSAGE },
            { status: 409 }
          )
        }
        stampleyGenerateLog(console, { event: "db_failure" })
        return jsonWithSensitiveCache(
          { error: "Failed to generate response" },
          { status: 500 }
        )
      }
      openSessionId = persisted.sessionId
      participantMessageId = parseParticipantMessageId(messageId)
      // Server-authoritative conversation only (ignores browser messageHistory).
      authoritativeHistory = buildAuthoritativeOpenAIConversationHistory(
        persisted.messages
      )
      // Mode selection uses persisted text (same-id/different-text safe).
      authoritativeParticipantText = persisted.participantContent

      // Pre-OpenAI idempotency: successful prior assistant for this messageId.
      if (openSessionId && participantMessageId) {
        const existingReply = await findOwnedAuthoritativeAssistantReply(
          createPrismaOpenSessionRunner(prisma),
          userId,
          openSessionId,
          participantMessageId
        )
        if (existingReply.found) {
          return jsonWithSensitiveCache({
            success: true,
            response: existingReply.response,
          })
        }
      }
    }

    const resolvedDomain = normalizeDomain(domain)
    const distressScore = parseScore(distress)
    const highStress = isHighStress(distressScore)
    const phase = resolvePhase(authoritativeHistory, conversationPhase)
    // highStress remains an independent tone modifier — not a response mode.
    const responseMode = selectStampleyResponseMode({
      participantText: authoritativeParticipantText,
      phase,
    })

    let liveStudyContext

    try {
      liveStudyContext = await loadLiveStudyContext(userId, resolvedDomain)
    } catch {
      stampleyGenerateLog(console, { event: "db_failure" })
      return jsonWithSensitiveCache(
        { error: "Failed to generate response" },
        { status: 500 }
      )
    }

    let longitudinalRows: LongitudinalScoreRow[]
    let themeMemory

    try {
      ;[longitudinalRows, themeMemory] = await Promise.all([
        loadLongitudinalScoreRows(userId),
        getRecentEmotionalThemes(userId, {
          weekNumber: liveStudyContext?.weekNumber ?? 1,
          phase,
          highStress,
          dayNumber: liveStudyContext?.dayNumber ?? 1,
        }),
      ])
    } catch {
      stampleyGenerateLog(console, { event: "db_failure" })
      return jsonWithSensitiveCache(
        { error: "Failed to generate response" },
        { status: 500 }
      )
    }

    const openaiContext = buildStampleyOpenAIContext({
      distress: distressScore,
      mood,
      energy,
      domain: resolvedDomain,
      subscale: liveStudyContext?.subscale ?? "",
      studyWeek: liveStudyContext?.weekNumber ?? 1,
      contextTags,
      reflection,
      copingAction,
      phase,
      recentConversation: authoritativeHistory,
      longitudinalRows,
      themeMemory: {
        recurringThemes: themeMemory.recurringThemes,
        supportStyle: themeMemory.supportStyle,
        allowThemeReference: themeMemory.allowThemeReference,
      },
    })

    const messages = buildOpenAIMessages(openaiContext, responseMode)

    const apiKey = process.env.OPENAI_API_KEY?.trim()

    if (!apiKey) {
      stampleyGenerateLog(console, { event: "openai_failure" })
      return jsonWithSensitiveCache(
        { error: "Failed to generate response" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey,
    })

    stampleyGenerateLog(console, {
      event: "openai_start",
      phase: openaiContext.phase,
      highStress: openaiContext.highStress,
    })

    const startedAt = Date.now()
    let completion

    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" },
      })

      stampleyGenerateLog(console, {
        event: "openai_success",
        phase: openaiContext.phase,
        highStress: openaiContext.highStress,
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      const status =
        typeof (error as { status?: unknown })?.status === "number"
          ? (error as { status: number }).status
          : undefined
      stampleyGenerateLog(console, {
        event: "openai_failure",
        openaiStatus: status,
      })
      return jsonWithSensitiveCache(
        { error: "Failed to generate response" },
        { status: 500 }
      )
    }

    const raw = completion.choices[0]?.message?.content ?? ""

    let stampleyResponse

    try {
      stampleyResponse = JSON.parse(raw)
    } catch {
      stampleyGenerateLog(console, { event: "parse_failure" })
      stampleyResponse = getStampleyFallbackResponse(
        openaiContext.phase,
        openaiContext.highStress
      )
    }

    // OpenAI completed outside any DB transaction. Append under row lock next.
    if (openSessionId && participantMessageId) {
      const assistantPersist = await persistOwnedAssistantTurn(
        createPrismaOpenSessionRunner(prisma),
        userId,
        openSessionId,
        stampleyResponse,
        participantMessageId
      )
      if (!assistantPersist.ok) {
        stampleyGenerateLog(console, { event: "db_failure" })
        if (
          assistantPersist.error === "session_unavailable" ||
          assistantPersist.error === "missing_participant"
        ) {
          // Do not mutate finalized/unavailable sessions; do not return a
          // response that implies an authoritative linked assistant was stored.
          return jsonWithSensitiveCache(
            { error: "Failed to generate response" },
            { status: 500 }
          )
        }
      } else {
        // Prefer authoritative persisted (or prior duplicate) response.
        return jsonWithSensitiveCache({
          success: true,
          response: assistantPersist.response,
        })
      }
    }

    return jsonWithSensitiveCache({
      success: true,
      response: stampleyResponse,
    })
  } catch {
    stampleyGenerateLog(console, { event: "unhandled_failure" })
    return jsonWithSensitiveCache(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

async function loadLiveStudyContext(userId: string, domain: Domain) {
  const progress = await prisma.userStudyProgress.findUnique({
    where: { userId },
    select: { totalCheckins: true },
  })

  const totalCheckins = Number(progress?.totalCheckins ?? 0)
  const checkInNumber = totalCheckins + 1

  return buildCheckInStudyContext(domain, checkInNumber)
}

async function loadLongitudinalScoreRows(
  userId: string
): Promise<LongitudinalScoreRow[]> {
  const checkInRows = await prisma.checkInSubmission.findMany({
    where: { userId },
    orderBy: [
      { checkInDate: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: 7,
    select: {
      distress: true,
      mood: true,
      energy: true,
      domain: true,
    },
  })

  return checkInRows.map((row) => ({
    distress: row.distress,
    mood: row.mood,
    energy: row.energy,
    domain: typeof row.domain === "string" ? row.domain : null,
  }))
}

function resolvePhase(
  history: StampleyHistoryMessage[],
  clientPhase: unknown
): StampleyPhase {
  const derived = deriveConversationPhase(history)

  const validPhases: StampleyPhase[] = [
    "opening",
    "exploration",
    "coping",
    "closure",
  ]

  if (
    typeof clientPhase === "string" &&
    validPhases.includes(clientPhase as StampleyPhase) &&
    clientPhase === derived
  ) {
    return clientPhase as StampleyPhase
  }

  return derived
}
