import { Prisma } from "@/lib/generated/prisma/client"
import {
  USER_MESSAGE_MAX_CHARS,
  buildChatSessionSummary,
} from "@/lib/stampley-openai-context"

export const MISSING_STAMPLEY_PROOF_MESSAGE =
  "Complete a Stampley chat reply before submitting today's check-in."

export class MissingStampleyProofError extends Error {
  constructor() {
    super(MISSING_STAMPLEY_PROOF_MESSAGE)
    this.name = "MissingStampleyProofError"
  }
}

export class StampleySessionLinkError extends Error {
  constructor() {
    super("Failed to link Stampley session")
    this.name = "StampleySessionLinkError"
  }
}

export type LockedOpenStampleySessionCandidate = {
  id: string
  messages: unknown
}

export type LinkStampleySessionInput = {
  sessionId: string
  userId: string
  checkInSubmissionId: string
  domain: string
  stressLevel: number
  mood: number
  energy: number
  messages: unknown
}

/** Newest-first candidates; first row with server-owned participant proof wins. */
export function selectNewestStampleySessionWithParticipantProof(
  candidatesNewestFirst: LockedOpenStampleySessionCandidate[]
): LockedOpenStampleySessionCandidate | null {
  for (const candidate of candidatesNewestFirst) {
    if (hasServerOwnedParticipantProof(candidate.messages)) {
      return candidate
    }
  }
  return null
}

/** Deterministic metadata-only summary for admin surfaces after finalization. */
export function buildServerOwnedFinalizationSummary(
  domain: string | null,
  messages: unknown
): string {
  return buildChatSessionSummary(
    { domain },
    countServerOwnedParticipantTurns(messages),
    countServerOwnedAssistantTurns(messages)
  )
}

type FinalizationQueryClient = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>
}

type FinalizationLinkClient = {
  stampleyChatSession: {
    updateMany(args: {
      where: {
        id: string
        userId: string
        checkInSubmissionId: null
      }
      data: {
        checkInSubmissionId: string
        domain: string
        stressLevel: number
        mood: number
        energy: number
        userMessageCount: number
        assistantMessageCount: number
        summary: string
      }
    }): Promise<{ count: number }>
  }
}

/** Lock all current-day owned open sessions (newest first). Does not inspect linked rows. */
export async function lockCurrentDayOpenStampleySessionsForFinalization(
  tx: FinalizationQueryClient,
  userId: string
): Promise<LockedOpenStampleySessionCandidate[]> {
  if (typeof userId !== "string" || userId.length === 0) {
    return []
  }

  const rows = await tx.$queryRaw<
    Array<{ id: string; messages: unknown }>
  >`
    SELECT id, messages
    FROM stampley_chat_sessions
    WHERE user_id = ${userId}
      AND check_in_submission_id IS NULL
      AND created_at::date = CURRENT_DATE
    ORDER BY created_at DESC
    FOR UPDATE
  `

  return rows.map((row) => ({
    id: row.id,
    messages: row.messages,
  }))
}

export async function resolveAuthoritativeStampleySessionForFinalization(
  tx: FinalizationQueryClient,
  userId: string
): Promise<LockedOpenStampleySessionCandidate> {
  const candidates = await lockCurrentDayOpenStampleySessionsForFinalization(
    tx,
    userId
  )
  const winner = selectNewestStampleySessionWithParticipantProof(candidates)
  if (!winner) {
    throw new MissingStampleyProofError()
  }
  return winner
}

/**
 * Conditionally link an open owned session to a check-in.
 * Does not overwrite authoritative messages. Requires exactly one row updated.
 */
export async function linkStampleySessionToCheckIn(
  tx: FinalizationLinkClient,
  input: LinkStampleySessionInput
): Promise<void> {
  const userMessageCount = countServerOwnedParticipantTurns(input.messages)
  const assistantMessageCount = countServerOwnedAssistantTurns(input.messages)
  const summary = buildServerOwnedFinalizationSummary(
    input.domain,
    input.messages
  )

  const result = await tx.stampleyChatSession.updateMany({
    where: {
      id: input.sessionId,
      userId: input.userId,
      checkInSubmissionId: null,
    },
    data: {
      checkInSubmissionId: input.checkInSubmissionId,
      domain: input.domain,
      stressLevel: input.stressLevel,
      mood: input.mood,
      energy: input.energy,
      userMessageCount,
      assistantMessageCount,
      summary,
    },
  })

  if (result.count !== 1) {
    throw new StampleySessionLinkError()
  }
}

export const SERVER_OWNED_TURN_SOURCE = "server" as const

export type ServerOwnedTurnRole = "user" | "assistant"

export type ServerOwnedStampleyTurn = {
  id: string
  role: ServerOwnedTurnRole
  content?: string
  data?: unknown
  timestamp: string
  source: typeof SERVER_OWNED_TURN_SOURCE
}

export type IncomingParticipantTurn =
  | { kind: "greeting" }
  | { kind: "rejected"; reason: "empty" | "whitespace" | "invalid" }
  | { kind: "accepted"; content: string }

export type OpenSessionRecord = {
  id: string
  messages: unknown
  userMessageCount: number
  assistantMessageCount: number
}

export type OpenSessionStore = {
  findLatestTodayOpenSessionId(userId: string): Promise<string | null>
  createOpenSession(userId: string): Promise<string>
  loadOwnedOpenSession(
    userId: string,
    sessionId: string
  ): Promise<OpenSessionRecord | null>
  saveOwnedOpenSession(input: {
    userId: string
    sessionId: string
    messages: ServerOwnedStampleyTurn[]
    userMessageCount: number
    assistantMessageCount: number
  }): Promise<boolean>
}

export type OpenSessionStoreRunner = {
  run<T>(fn: (store: OpenSessionStore) => Promise<T>): Promise<T>
}

export type PersistTurnResult =
  | { ok: true; sessionId: string }
  | { ok: false }

export function resolveIncomingParticipantTurn(
  history: unknown
): IncomingParticipantTurn {
  if (!Array.isArray(history)) return { kind: "greeting" }

  let lastUserContent: unknown = undefined
  let sawUserRole = false
  for (const item of history) {
    if (typeof item !== "object" || item === null) continue
    if ((item as { role?: unknown }).role !== "user") continue
    sawUserRole = true
    lastUserContent = (item as { content?: unknown }).content
  }

  if (!sawUserRole) return { kind: "greeting" }
  if (typeof lastUserContent !== "string") {
    return { kind: "rejected", reason: "invalid" }
  }
  if (lastUserContent.length === 0) {
    return { kind: "rejected", reason: "empty" }
  }
  const trimmed = lastUserContent.trim()
  if (!trimmed) {
    return { kind: "rejected", reason: "whitespace" }
  }
  return {
    kind: "accepted",
    content:
      trimmed.length <= USER_MESSAGE_MAX_CHARS
        ? trimmed
        : trimmed.slice(0, USER_MESSAGE_MAX_CHARS),
  }
}

export function isServerOwnedTurn(
  value: unknown
): value is ServerOwnedStampleyTurn {
  if (typeof value !== "object" || value === null) return false
  const turn = value as ServerOwnedStampleyTurn
  return (
    turn.source === SERVER_OWNED_TURN_SOURCE &&
    typeof turn.id === "string" &&
    turn.id.length > 0 &&
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.timestamp === "string"
  )
}

export function parseStoredTurns(messages: unknown): unknown[] {
  return Array.isArray(messages) ? [...messages] : []
}

export function countServerOwnedParticipantTurns(messages: unknown): number {
  return parseStoredTurns(messages).filter((item) => {
    if (!isServerOwnedTurn(item) || item.role !== "user") return false
    return typeof item.content === "string" && item.content.trim().length > 0
  }).length
}

export function countServerOwnedAssistantTurns(messages: unknown): number {
  return parseStoredTurns(messages).filter(
    (item) => isServerOwnedTurn(item) && item.role === "assistant"
  ).length
}

export function hasServerOwnedParticipantProof(messages: unknown): boolean {
  return countServerOwnedParticipantTurns(messages) >= 1
}

export function buildServerOwnedUserTurn(
  content: string,
  now = new Date()
): ServerOwnedStampleyTurn {
  return {
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp: now.toISOString(),
    source: SERVER_OWNED_TURN_SOURCE,
  }
}

export function buildServerOwnedAssistantTurn(
  response: unknown,
  now = new Date()
): ServerOwnedStampleyTurn {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    data: response,
    timestamp: now.toISOString(),
    source: SERVER_OWNED_TURN_SOURCE,
  }
}

export function appendServerOwnedTurn(
  current: unknown,
  turn: ServerOwnedStampleyTurn
): ServerOwnedStampleyTurn[] {
  const next: ServerOwnedStampleyTurn[] = []
  for (const item of parseStoredTurns(current)) {
    if (isServerOwnedTurn(item)) {
      next.push(item)
    }
  }
  next.push(turn)
  return next
}

/** Client transcripts may not replace or drop server-owned turns. */
export function protectAuthoritativeTranscript(
  current: unknown,
  _incomingClientMessages: unknown
): unknown[] {
  return parseStoredTurns(current).filter((item) => isServerOwnedTurn(item))
}

export async function persistOwnedParticipantTurn(
  runner: OpenSessionStoreRunner,
  userId: string,
  content: string
): Promise<PersistTurnResult> {
  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false }
  }
  const accepted = resolveIncomingParticipantTurn([
    { role: "user", content },
  ])
  if (accepted.kind !== "accepted") {
    return { ok: false }
  }

  return runner.run(async (store) => {
    let sessionId = await store.findLatestTodayOpenSessionId(userId)
    if (!sessionId) {
      sessionId = await store.createOpenSession(userId)
    }

    const owned = await store.loadOwnedOpenSession(userId, sessionId)
    if (!owned) return { ok: false }

    const next = appendServerOwnedTurn(
      owned.messages,
      buildServerOwnedUserTurn(accepted.content)
    )
    const saved = await store.saveOwnedOpenSession({
      userId,
      sessionId,
      messages: next,
      userMessageCount: countServerOwnedParticipantTurns(next),
      assistantMessageCount: countServerOwnedAssistantTurns(next),
    })
    if (!saved) return { ok: false }
    return { ok: true, sessionId }
  })
}

export async function persistOwnedAssistantTurn(
  runner: OpenSessionStoreRunner,
  userId: string,
  sessionId: string,
  response: unknown
): Promise<PersistTurnResult> {
  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false }
  }
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { ok: false }
  }

  return runner.run(async (store) => {
    const owned = await store.loadOwnedOpenSession(userId, sessionId)
    if (!owned) return { ok: false }

    const next = appendServerOwnedTurn(
      owned.messages,
      buildServerOwnedAssistantTurn(response)
    )
    const saved = await store.saveOwnedOpenSession({
      userId,
      sessionId,
      messages: next,
      userMessageCount: countServerOwnedParticipantTurns(next),
      assistantMessageCount: countServerOwnedAssistantTurns(next),
    })
    if (!saved) return { ok: false }
    return { ok: true, sessionId }
  })
}

type PrismaOpenSessionClient = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>
  stampleyChatSession: {
    create(args: {
      data: {
        userId: string
        messages: Prisma.InputJsonValue
        userMessageCount: number
        assistantMessageCount: number
      }
      select: { id: true }
    }): Promise<{ id: string }>
    findFirst(args: {
      where: {
        id: string
        userId: string
        checkInSubmissionId: null
      }
      select: {
        id: true
        messages: true
        userMessageCount: true
        assistantMessageCount: true
      }
    }): Promise<{
      id: string
      messages: unknown
      userMessageCount: number | null
      assistantMessageCount: number | null
    } | null>
    updateMany(args: {
      where: {
        id: string
        userId: string
        checkInSubmissionId: null
      }
      data: {
        messages: Prisma.InputJsonValue
        userMessageCount: number
        assistantMessageCount: number
      }
    }): Promise<{ count: number }>
  }
}

function prismaOpenSessionStore(
  tx: PrismaOpenSessionClient
): OpenSessionStore {
  return {
    async findLatestTodayOpenSessionId(userId) {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM stampley_chat_sessions
        WHERE user_id = ${userId}
          AND check_in_submission_id IS NULL
          AND created_at::date = CURRENT_DATE
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `
      return rows[0]?.id ?? null
    },
    async createOpenSession(userId) {
      const created = await tx.stampleyChatSession.create({
        data: {
          userId,
          messages: [],
          userMessageCount: 0,
          assistantMessageCount: 0,
        },
        select: { id: true },
      })
      return created.id
    },
    async loadOwnedOpenSession(userId, sessionId) {
      const row = await tx.stampleyChatSession.findFirst({
        where: {
          id: sessionId,
          userId,
          checkInSubmissionId: null,
        },
        select: {
          id: true,
          messages: true,
          userMessageCount: true,
          assistantMessageCount: true,
        },
      })
      if (!row) return null
      return {
        id: row.id,
        messages: row.messages,
        userMessageCount: Number(row.userMessageCount ?? 0),
        assistantMessageCount: Number(row.assistantMessageCount ?? 0),
      }
    },
    async saveOwnedOpenSession(input) {
      const result = await tx.stampleyChatSession.updateMany({
        where: {
          id: input.sessionId,
          userId: input.userId,
          checkInSubmissionId: null,
        },
        data: {
          messages: input.messages as Prisma.InputJsonValue,
          userMessageCount: input.userMessageCount,
          assistantMessageCount: input.assistantMessageCount,
        },
      })
      return result.count === 1
    },
  }
}

export function createPrismaOpenSessionRunner(db: {
  $transaction<T>(fn: (tx: PrismaOpenSessionClient) => Promise<T>): Promise<T>
}): OpenSessionStoreRunner {
  return {
    run(fn) {
      return db.$transaction((tx) => fn(prismaOpenSessionStore(tx)))
    },
  }
}
