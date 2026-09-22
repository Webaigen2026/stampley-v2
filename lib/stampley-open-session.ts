import { Prisma } from "@/lib/generated/prisma/client"
import {
  USER_MESSAGE_MAX_CHARS,
  buildChatSessionSummary,
  type StampleyHistoryMessage,
} from "@/lib/stampley-openai-context"
import { formatAssistantMessageForHistory } from "@/lib/stampley-prompt"

export const MISSING_STAMPLEY_PROOF_MESSAGE =
  "Complete a Stampley chat reply before submitting today's check-in."

export const CHECK_IN_ALREADY_COMPLETED_MESSAGE =
  "Today's check-in has already been completed."

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

/** Thrown inside a persistence transaction so Prisma rolls back (e.g. orphan create). */
export class CheckInAlreadyCompletedError extends Error {
  constructor() {
    super(CHECK_IN_ALREADY_COMPLETED_MESSAGE)
    this.name = "CheckInAlreadyCompletedError"
  }
}

export type RecoverableFinalizedCheckIn = {
  checkInSubmissionId: string
  needsSafetyEscalation: boolean
  subscale: string
  weekNumber: number | null
  dayNumber: number | null
}

/** Trusted session origin. Client JSON must never set SERVER_AUTHORITATIVE. */
export const STAMPLEY_TRANSCRIPT_ORIGIN = {
  LEGACY_CLIENT: "LEGACY_CLIENT",
  SERVER_AUTHORITATIVE: "SERVER_AUTHORITATIVE",
} as const

export type StampleyTranscriptOriginValue =
  (typeof STAMPLEY_TRANSCRIPT_ORIGIN)[keyof typeof STAMPLEY_TRANSCRIPT_ORIGIN]

export const CLIENT_TURN_SOURCE = "client" as const

export type RecoverableSubmissionRow = {
  id: string
  userId: string
  needsSafetyEscalation: boolean | null
  subscale: string
  weekNumber: number | null
  dayNumber: number | null
}

export type RecoverableLinkedSessionRow = {
  userId: string
  checkInSubmissionId: string | null
  messages: unknown
  transcriptOrigin?: string | null
  createdAt?: Date | string | null
}

export function isServerAuthoritativeTranscriptOrigin(
  value: unknown
): boolean {
  return value === STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
}

function toNullablePersistedInt(value: number | null | undefined): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Pure recovery gate: owned same-day submission + owned linked session with
 * trusted SERVER_AUTHORITATIVE origin AND server-owned participant proof.
 * No writes. Historical/legacy/unknown origins fail closed.
 */
export function resolveRecoverableFinalizedCheckIn(input: {
  userId: string
  submission: RecoverableSubmissionRow | null
  linkedSessions: RecoverableLinkedSessionRow[]
}): RecoverableFinalizedCheckIn | null {
  const { userId, submission, linkedSessions } = input
  if (typeof userId !== "string" || userId.length === 0) return null
  if (!submission) return null
  if (submission.userId !== userId) return null
  if (typeof submission.id !== "string" || submission.id.length === 0) {
    return null
  }
  if (typeof submission.subscale !== "string") return null

  const ownedLinked = linkedSessions.filter(
    (session) =>
      session.userId === userId &&
      session.checkInSubmissionId === submission.id &&
      isServerAuthoritativeTranscriptOrigin(session.transcriptOrigin)
  )

  const candidates: LockedOpenStampleySessionCandidate[] = ownedLinked
    .slice()
    .sort((a, b) => compareCreatedAtDesc(a.createdAt, b.createdAt))
    .map((session, index) => ({
      id: `linked-${index}`,
      messages: session.messages,
    }))

  const winner = selectNewestStampleySessionWithParticipantProof(candidates)
  if (!winner) return null

  return {
    checkInSubmissionId: submission.id,
    needsSafetyEscalation: Boolean(submission.needsSafetyEscalation),
    subscale: submission.subscale,
    weekNumber: toNullablePersistedInt(submission.weekNumber),
    dayNumber: toNullablePersistedInt(submission.dayNumber),
  }
}

function compareCreatedAtDesc(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined
): number {
  const aMs = createdAtToMs(a)
  const bMs = createdAtToMs(b)
  return bMs - aMs
}

function createdAtToMs(value: Date | string | null | undefined): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === "string") {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

type RecoveryQueryClient = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>
}

/**
 * Read-only recovery for an already-finalized same-day check-in.
 * Uses CURRENT_DATE (not JS local time). Requires SERVER_AUTHORITATIVE origin.
 */
export async function findRecoverableFinalizedCheckInForCurrentDay(
  db: RecoveryQueryClient,
  userId: string
): Promise<RecoverableFinalizedCheckIn | null> {
  if (typeof userId !== "string" || userId.length === 0) return null

  const submissions = await db.$queryRaw<
    Array<{
      id: string
      user_id: string
      needs_safety_escalation: boolean | null
      subscale: string
      week_number: number | null
      day_number: number | null
    }>
  >`
    SELECT
      id,
      user_id,
      needs_safety_escalation,
      subscale,
      week_number,
      day_number
    FROM check_in_submissions
    WHERE user_id = ${userId}
      AND check_in_date = CURRENT_DATE
    LIMIT 1
  `

  const submissionRow = submissions[0]
  if (!submissionRow) return null

  const linkedSessions = await db.$queryRaw<
    Array<{
      user_id: string
      check_in_submission_id: string | null
      messages: unknown
      transcript_origin: string | null
      created_at: Date | string | null
    }>
  >`
    SELECT
      user_id,
      check_in_submission_id,
      messages,
      transcript_origin::text AS transcript_origin,
      created_at
    FROM stampley_chat_sessions
    WHERE user_id = ${userId}
      AND check_in_submission_id = ${submissionRow.id}
      AND transcript_origin::text = ${STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE}
    ORDER BY created_at DESC
  `

  return resolveRecoverableFinalizedCheckIn({
    userId,
    submission: {
      id: submissionRow.id,
      userId: submissionRow.user_id,
      needsSafetyEscalation: submissionRow.needs_safety_escalation,
      subscale: submissionRow.subscale,
      weekNumber: submissionRow.week_number,
      dayNumber: submissionRow.day_number,
    },
    linkedSessions: linkedSessions.map((row) => ({
      userId: row.user_id,
      checkInSubmissionId: row.check_in_submission_id,
      messages: row.messages,
      transcriptOrigin: row.transcript_origin,
      createdAt: row.created_at,
    })),
  })
}

/**
 * Rebuild client compatibility messages into a safe shape.
 * Never preserves source:"server" or arbitrary authority markers.
 */
export function sanitizeCompatibilityMessages(
  messages: unknown
): Prisma.InputJsonValue {
  if (!Array.isArray(messages)) return []

  const sanitized: Prisma.InputJsonValue[] = []
  for (const item of messages) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue
    }
    const raw = item as Record<string, unknown>
    const role = raw.role
    if (role !== "user" && role !== "assistant") continue

    const safe: Record<string, Prisma.InputJsonValue> = {
      role,
      source: CLIENT_TURN_SOURCE,
    }

    if (typeof raw.id === "string" && raw.id.length > 0) {
      safe.id = raw.id
    }
    if (typeof raw.timestamp === "string") {
      safe.timestamp = raw.timestamp
    }
    if (typeof raw.content === "string") {
      safe.content = raw.content
    }
    if (raw.data !== undefined && raw.data !== null) {
      try {
        safe.data = JSON.parse(JSON.stringify(raw.data)) as Prisma.InputJsonValue
      } catch {
        // drop non-serializable data blobs
      }
    }

    sanitized.push(safe)
  }
  return sanitized
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
        transcriptOrigin: typeof STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
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
      // Preserve authority set at trusted open-session creation; never upgrade legacy.
      transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE,
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
  /** Present on new 3D.2A-2+ authoritative assistant turns; optional for history. */
  inReplyToMessageId?: string
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

export type PersistParticipantTurnResult =
  | {
      ok: true
      sessionId: string
      participantAlreadyPersisted: boolean
      /** Authoritative persisted content for messageId (not retry body). */
      participantContent: string
      /** Session transcript snapshot after persist/dedupe (same txn). */
      messages: unknown
    }
  | {
      ok: false
      error:
        | "invalid_user"
        | "invalid_content"
        | "invalid_message_id"
        | "check_in_completed"
        | "persist_failed"
    }

export type OpenSessionStore = {
  /** Transaction-scoped advisory lock for same user + CURRENT_DATE. */
  acquireCurrentDayOpenSessionLock(userId: string): Promise<void>
  /** True when this user already has a CheckInSubmission for DB CURRENT_DATE. */
  hasCurrentDayCheckInSubmission(userId: string): Promise<boolean>
  findLatestTodayOpenSessionId(userId: string): Promise<string | null>
  createOpenSession(userId: string): Promise<string>
  /** Lock + load owned open SERVER_AUTHORITATIVE session for JSON RMW. */
  lockOwnedOpenSession(
    userId: string,
    sessionId: string
  ): Promise<OpenSessionRecord | null>
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

export type PersistAssistantTurnResult =
  | {
      ok: true
      sessionId: string
      assistantAlreadyPersisted: boolean
      response: unknown
    }
  | {
      ok: false
      error:
        | "invalid_user"
        | "invalid_session"
        | "invalid_message_id"
        | "session_unavailable"
        | "missing_participant"
        | "persist_failed"
    }

export type FindOwnedAssistantReplyResult =
  | { found: true; response: unknown }
  | { found: false }

/** Opaque participant retry id (UUID). Normalized to lowercase. */
const PARTICIPANT_MESSAGE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const INVALID_PARTICIPANT_MESSAGE_ID_MESSAGE = "Invalid request"

/**
 * Validate client messageId for participant turns.
 * Returns canonical lowercase UUID or null.
 */
export function parseParticipantMessageId(value: unknown): string | null {
  if (typeof value !== "string") return null
  if (value.length !== 36) return null
  const normalized = value.toLowerCase()
  if (!PARTICIPANT_MESSAGE_ID_RE.test(normalized)) return null
  return normalized
}

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

/**
 * Find an authoritative participant turn with the given messageId.
 * Reuses turn.id as the opaque client messageId (no separate JSON field / no migration).
 * Malformed rows never count as duplicates.
 */
export function findServerOwnedParticipantTurnByMessageId(
  messages: unknown,
  messageId: string
): ServerOwnedStampleyTurn | null {
  const parsed = parseParticipantMessageId(messageId)
  if (!parsed) return null

  for (const item of parseStoredTurns(messages)) {
    if (!isServerOwnedTurn(item) || item.role !== "user") continue
    if (typeof item.content !== "string" || item.content.trim().length === 0) {
      continue
    }
    if (item.id.toLowerCase() === parsed) return item
  }
  return null
}

function hasAuthoritativeAssistantPayload(
  turn: ServerOwnedStampleyTurn
): boolean {
  if (typeof turn.content === "string" && turn.content.trim().length > 0) {
    return true
  }
  return turn.data !== undefined && turn.data !== null
}

/** Extract API response payload from an authoritative assistant turn. */
export function extractAuthoritativeAssistantResponse(
  turn: ServerOwnedStampleyTurn
): unknown {
  if (turn.data !== undefined && turn.data !== null) return turn.data
  if (typeof turn.content === "string") return turn.content
  return null
}

/**
 * Find authoritative assistant reply linked to a participant messageId.
 * Requires role/source/server ownership, valid inReplyToMessageId, and payload.
 * Historical assistants without linkage never match. Client/malformed never match.
 */
export function findServerOwnedAssistantReplyByParticipantMessageId(
  messages: unknown,
  participantMessageId: string
): ServerOwnedStampleyTurn | null {
  const parsed = parseParticipantMessageId(participantMessageId)
  if (!parsed) return null

  for (const item of parseStoredTurns(messages)) {
    if (!isServerOwnedTurn(item) || item.role !== "assistant") continue
    if (!hasAuthoritativeAssistantPayload(item)) continue
    const linked = parseParticipantMessageId(item.inReplyToMessageId)
    if (!linked || linked !== parsed) continue
    return item
  }
  return null
}

function assistantTurnToHistoryContent(
  turn: ServerOwnedStampleyTurn
): string | null {
  if (typeof turn.content === "string" && turn.content.trim().length > 0) {
    return turn.content.trim()
  }
  if (turn.data !== undefined && turn.data !== null) {
    if (typeof turn.data === "string") {
      const trimmed = turn.data.trim()
      return trimmed.length > 0 ? trimmed : null
    }
    if (typeof turn.data === "object" && !Array.isArray(turn.data)) {
      const formatted = formatAssistantMessageForHistory(
        turn.data as {
          greeting?: string
          validation?: string
          reflection_question?: string
          micro_skill?: string
          education_chip?: string
          closure?: string
        }
      ).trim()
      return formatted.length > 0 ? formatted : null
    }
  }
  return null
}

/**
 * Build OpenAI conversation history from an authoritative session transcript.
 *
 * Ordering: walk physical order; for each authoritative user turn emit the user
 * message then its linked assistant (inReplyToMessageId) if present. Historical
 * unlinked assistants are emitted when encountered if not already paired.
 * Client/malformed/LEGACY rows are excluded. No ids/metadata in output.
 */
export function buildAuthoritativeOpenAIConversationHistory(
  messages: unknown
): StampleyHistoryMessage[] {
  const turns = parseStoredTurns(messages)
  const history: StampleyHistoryMessage[] = []
  const emittedAssistantIds = new Set<string>()

  for (const item of turns) {
    if (!isServerOwnedTurn(item)) continue

    if (item.role === "user") {
      if (typeof item.content !== "string" || item.content.trim().length === 0) {
        continue
      }
      const userContent =
        item.content.trim().length <= USER_MESSAGE_MAX_CHARS
          ? item.content.trim()
          : item.content.trim().slice(0, USER_MESSAGE_MAX_CHARS)
      history.push({ role: "user", content: userContent })

      const linked = findServerOwnedAssistantReplyByParticipantMessageId(
        messages,
        item.id
      )
      if (linked) {
        const assistantContent = assistantTurnToHistoryContent(linked)
        if (assistantContent) {
          history.push({ role: "assistant", content: assistantContent })
          emittedAssistantIds.add(linked.id)
        }
      }
      continue
    }

    if (item.role === "assistant") {
      if (emittedAssistantIds.has(item.id)) continue
      const linked = parseParticipantMessageId(item.inReplyToMessageId)
      // Linked assistants are emitted with their user turn; skip if unpaired here
      // only when linkage is valid (user may be missing — then skip entirely).
      if (linked) continue
      if (!hasAuthoritativeAssistantPayload(item)) continue
      const assistantContent = assistantTurnToHistoryContent(item)
      if (!assistantContent) continue
      history.push({ role: "assistant", content: assistantContent })
      emittedAssistantIds.add(item.id)
    }
  }

  return history
}

/**
 * Build a server-owned user turn.
 * `messageId` is the validated client opaque UUID stored as turn.id for idempotency.
 */
export function buildServerOwnedUserTurn(
  content: string,
  messageId: string = crypto.randomUUID(),
  now = new Date()
): ServerOwnedStampleyTurn {
  const id = parseParticipantMessageId(messageId) ?? crypto.randomUUID()
  return {
    id,
    role: "user",
    content,
    timestamp: now.toISOString(),
    source: SERVER_OWNED_TURN_SOURCE,
  }
}

/**
 * Build a server-owned assistant turn.
 * When `inReplyToMessageId` is provided and valid, linkage is stored for idempotency.
 * Historical/unlinked assistants omit the field.
 */
export function buildServerOwnedAssistantTurn(
  response: unknown,
  inReplyToMessageId?: string,
  now = new Date()
): ServerOwnedStampleyTurn {
  const turn: ServerOwnedStampleyTurn = {
    id: crypto.randomUUID(),
    role: "assistant",
    data: response,
    timestamp: now.toISOString(),
    source: SERVER_OWNED_TURN_SOURCE,
  }
  const linked = parseParticipantMessageId(inReplyToMessageId)
  if (linked) {
    turn.inReplyToMessageId = linked
  }
  return turn
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

/**
 * Persist one authoritative participant turn with messageId idempotency.
 * Advisory lock + same-day completion guard + session row lock; no OpenAI inside.
 */
export async function persistOwnedParticipantTurn(
  runner: OpenSessionStoreRunner,
  userId: string,
  content: string,
  messageId: unknown
): Promise<PersistParticipantTurnResult> {
  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false, error: "invalid_user" }
  }
  const parsedMessageId = parseParticipantMessageId(messageId)
  if (!parsedMessageId) {
    return { ok: false, error: "invalid_message_id" }
  }
  const accepted = resolveIncomingParticipantTurn([
    { role: "user", content },
  ])
  if (accepted.kind !== "accepted") {
    return { ok: false, error: "invalid_content" }
  }

  try {
    return await runner.run(async (store) => {
      await store.acquireCurrentDayOpenSessionLock(userId)

      // Fail closed before resolve/create if today's check-in already exists.
      if (await store.hasCurrentDayCheckInSubmission(userId)) {
        throw new CheckInAlreadyCompletedError()
      }

      let sessionId = await store.findLatestTodayOpenSessionId(userId)
      if (!sessionId) {
        // Re-check immediately before create (submit may have committed).
        if (await store.hasCurrentDayCheckInSubmission(userId)) {
          throw new CheckInAlreadyCompletedError()
        }
        sessionId = await store.createOpenSession(userId)
        // If submit committed after create, abort so the create rolls back.
        if (await store.hasCurrentDayCheckInSubmission(userId)) {
          throw new CheckInAlreadyCompletedError()
        }
      }

      const owned = await store.lockOwnedOpenSession(userId, sessionId)
      if (!owned) return { ok: false, error: "persist_failed" }

      const existing = findServerOwnedParticipantTurnByMessageId(
        owned.messages,
        parsedMessageId
      )
      if (existing) {
        return {
          ok: true,
          sessionId,
          participantAlreadyPersisted: true,
          participantContent: existing.content ?? accepted.content,
          messages: owned.messages,
        }
      }

      const next = appendServerOwnedTurn(
        owned.messages,
        buildServerOwnedUserTurn(accepted.content, parsedMessageId)
      )
      const saved = await store.saveOwnedOpenSession({
        userId,
        sessionId,
        messages: next,
        userMessageCount: countServerOwnedParticipantTurns(next),
        assistantMessageCount: countServerOwnedAssistantTurns(next),
      })
      if (!saved) return { ok: false, error: "persist_failed" }
      return {
        ok: true,
        sessionId,
        participantAlreadyPersisted: false,
        participantContent: accepted.content,
        messages: next,
      }
    })
  } catch (error) {
    if (error instanceof CheckInAlreadyCompletedError) {
      return { ok: false, error: "check_in_completed" }
    }
    throw error
  }
}

export async function persistOwnedAssistantTurn(
  runner: OpenSessionStoreRunner,
  userId: string,
  sessionId: string,
  response: unknown,
  participantMessageId: unknown
): Promise<PersistAssistantTurnResult> {
  if (typeof userId !== "string" || userId.length === 0) {
    return { ok: false, error: "invalid_user" }
  }
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { ok: false, error: "invalid_session" }
  }
  const parsedMessageId = parseParticipantMessageId(participantMessageId)
  if (!parsedMessageId) {
    return { ok: false, error: "invalid_message_id" }
  }

  return runner.run(async (store) => {
    // Exact session id from participant persist; FOR UPDATE for JSON RMW.
    const owned = await store.lockOwnedOpenSession(userId, sessionId)
    if (!owned) {
      // Linked/finalized, wrong origin, or not owned — do not mutate.
      return { ok: false, error: "session_unavailable" }
    }

    const participant = findServerOwnedParticipantTurnByMessageId(
      owned.messages,
      parsedMessageId
    )
    if (!participant) {
      return { ok: false, error: "missing_participant" }
    }

    const existing = findServerOwnedAssistantReplyByParticipantMessageId(
      owned.messages,
      parsedMessageId
    )
    if (existing) {
      return {
        ok: true,
        sessionId,
        assistantAlreadyPersisted: true,
        response: extractAuthoritativeAssistantResponse(existing),
      }
    }

    const next = appendServerOwnedTurn(
      owned.messages,
      buildServerOwnedAssistantTurn(response, parsedMessageId)
    )
    const saved = await store.saveOwnedOpenSession({
      userId,
      sessionId,
      messages: next,
      userMessageCount: countServerOwnedParticipantTurns(next),
      assistantMessageCount: countServerOwnedAssistantTurns(next),
    })
    if (!saved) return { ok: false, error: "persist_failed" }
    return {
      ok: true,
      sessionId,
      assistantAlreadyPersisted: false,
      response,
    }
  })
}

/**
 * Short-transaction lookup for an existing linked assistant reply.
 * Used before model generation to skip duplicate calls after a successful prior turn.
 */
export async function findOwnedAuthoritativeAssistantReply(
  runner: OpenSessionStoreRunner,
  userId: string,
  sessionId: string,
  participantMessageId: unknown
): Promise<FindOwnedAssistantReplyResult> {
  if (typeof userId !== "string" || userId.length === 0) {
    return { found: false }
  }
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return { found: false }
  }
  const parsedMessageId = parseParticipantMessageId(participantMessageId)
  if (!parsedMessageId) return { found: false }

  return runner.run(async (store) => {
    const owned = await store.lockOwnedOpenSession(userId, sessionId)
    if (!owned) return { found: false }

    // Require authoritative participant turn before treating assistant as reusable.
    const participant = findServerOwnedParticipantTurnByMessageId(
      owned.messages,
      parsedMessageId
    )
    if (!participant) return { found: false }

    const existing = findServerOwnedAssistantReplyByParticipantMessageId(
      owned.messages,
      parsedMessageId
    )
    if (!existing) return { found: false }
    return {
      found: true,
      response: extractAuthoritativeAssistantResponse(existing),
    }
  })
}

type PrismaOpenSessionClient = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>
  $executeRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<number>
  stampleyChatSession: {
    create(args: {
      data: {
        userId: string
        messages: Prisma.InputJsonValue
        userMessageCount: number
        assistantMessageCount: number
        transcriptOrigin: typeof STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
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
        transcriptOrigin: typeof STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
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
    async acquireCurrentDayOpenSessionLock(userId) {
      // Transaction-scoped lock: authenticated user + DB CURRENT_DATE only.
      // Use executeRaw — pg_advisory_xact_lock returns PostgreSQL void, which
      // Prisma queryRaw cannot deserialize (P2010 UnsupportedNativeDataType).
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(
            (${userId} || (':' || CURRENT_DATE::text)),
            0
          )
        )
      `
    },
    async hasCurrentDayCheckInSubmission(userId) {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM check_in_submissions
        WHERE user_id = ${userId}
          AND check_in_date = CURRENT_DATE
        LIMIT 1
      `
      return rows.length > 0
    },
    async findLatestTodayOpenSessionId(userId) {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM stampley_chat_sessions
        WHERE user_id = ${userId}
          AND check_in_submission_id IS NULL
          AND transcript_origin::text = ${STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE}
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
          transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE,
        },
        select: { id: true },
      })
      return created.id
    },
    async lockOwnedOpenSession(userId, sessionId) {
      const rows = await tx.$queryRaw<
        Array<{
          id: string
          messages: unknown
          user_message_count: number | null
          assistant_message_count: number | null
        }>
      >`
        SELECT
          id,
          messages,
          user_message_count,
          assistant_message_count
        FROM stampley_chat_sessions
        WHERE id = ${sessionId}
          AND user_id = ${userId}
          AND check_in_submission_id IS NULL
          AND transcript_origin::text = ${STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE}
        FOR UPDATE
      `
      const row = rows[0]
      if (!row) return null
      return {
        id: row.id,
        messages: row.messages,
        userMessageCount: Number(row.user_message_count ?? 0),
        assistantMessageCount: Number(row.assistant_message_count ?? 0),
      }
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
          transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE,
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
