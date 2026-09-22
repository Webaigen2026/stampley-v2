import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { USER_MESSAGE_MAX_CHARS } from "./stampley-openai-context"
import {
  CLIENT_TURN_SOURCE,
  SERVER_OWNED_TURN_SOURCE,
  STAMPLEY_TRANSCRIPT_ORIGIN,
  StampleySessionLinkError,
  appendServerOwnedTurn,
  buildServerOwnedAssistantTurn,
  buildServerOwnedFinalizationSummary,
  buildServerOwnedUserTurn,
  countServerOwnedAssistantTurns,
  countServerOwnedParticipantTurns,
  findServerOwnedParticipantTurnByMessageId,
  hasServerOwnedParticipantProof,
  linkStampleySessionToCheckIn,
  parseParticipantMessageId,
  persistOwnedAssistantTurn,
  persistOwnedParticipantTurn,
  protectAuthoritativeTranscript,
  resolveIncomingParticipantTurn,
  resolveRecoverableFinalizedCheckIn,
  sanitizeCompatibilityMessages,
  selectNewestStampleySessionWithParticipantProof,
  type LockedOpenStampleySessionCandidate,
  type OpenSessionRecord,
  type OpenSessionStore,
  type OpenSessionStoreRunner,
  type ServerOwnedStampleyTurn,
} from "./stampley-open-session"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

type MemoryRow = OpenSessionRecord & {
  userId: string
  checkInSubmissionId: string | null
  createdOnStudyDate: boolean
  transcriptOrigin?: string
}

function createMemoryRunner(seed: MemoryRow[] = []): {
  runner: OpenSessionStoreRunner
  rows: MemoryRow[]
  locksAcquired: string[]
} {
  const rows = seed
  let seq = seed.length
  const locksAcquired: string[] = []

  const store: OpenSessionStore = {
    async acquireCurrentDayOpenSessionLock(userId) {
      locksAcquired.push(userId)
    },
    async findLatestTodayOpenSessionId(userId) {
      const matches = rows.filter(
        (row) =>
          row.userId === userId &&
          row.checkInSubmissionId === null &&
          row.createdOnStudyDate &&
          (row.transcriptOrigin ??
            STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE) ===
            STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
      )
      return matches.at(-1)?.id ?? null
    },
    async createOpenSession(userId) {
      seq += 1
      const id = `open-session-${seq}`
      rows.push({
        id,
        userId,
        checkInSubmissionId: null,
        messages: [],
        userMessageCount: 0,
        assistantMessageCount: 0,
        createdOnStudyDate: true,
        transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE,
      })
      return id
    },
    async lockOwnedOpenSession(userId, sessionId) {
      const row = rows.find(
        (item) =>
          item.id === sessionId &&
          item.userId === userId &&
          item.checkInSubmissionId === null &&
          (item.transcriptOrigin ??
            STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE) ===
            STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
      )
      return row
        ? {
            id: row.id,
            messages: row.messages,
            userMessageCount: row.userMessageCount,
            assistantMessageCount: row.assistantMessageCount,
          }
        : null
    },
    async loadOwnedOpenSession(userId, sessionId) {
      const row = rows.find(
        (item) =>
          item.id === sessionId &&
          item.userId === userId &&
          item.checkInSubmissionId === null
      )
      return row
        ? {
            id: row.id,
            messages: row.messages,
            userMessageCount: row.userMessageCount,
            assistantMessageCount: row.assistantMessageCount,
          }
        : null
    },
    async saveOwnedOpenSession(input) {
      const row = rows.find(
        (item) =>
          item.id === input.sessionId &&
          item.userId === input.userId &&
          item.checkInSubmissionId === null
      )
      if (!row) return false
      row.messages = input.messages
      row.userMessageCount = input.userMessageCount
      row.assistantMessageCount = input.assistantMessageCount
      return true
    },
  }

  return {
    rows,
    locksAcquired,
    runner: {
      run(fn) {
        return fn(store)
      },
    },
  }
}

const MSG_A = "11111111-1111-4111-8111-111111111111"
const MSG_B = "22222222-2222-4222-8222-222222222222"
const MSG_C = "33333333-3333-4333-8333-333333333333"

describe("incoming participant turn resolution", () => {
  it("treats empty history and assistant-only greeting history as no proof", () => {
    assert.deepEqual(resolveIncomingParticipantTurn(undefined), {
      kind: "greeting",
    })
    assert.deepEqual(resolveIncomingParticipantTurn([]), { kind: "greeting" })
    assert.deepEqual(
      resolveIncomingParticipantTurn([
        { role: "assistant", content: "Hello, I am Stampley." },
      ]),
      { kind: "greeting" }
    )
    assert.equal(
      hasServerOwnedParticipantProof([]),
      false
    )
  })

  it("rejects empty and whitespace participant content", () => {
    assert.deepEqual(
      resolveIncomingParticipantTurn([{ role: "user", content: "" }]),
      { kind: "rejected", reason: "empty" }
    )
    assert.deepEqual(
      resolveIncomingParticipantTurn([{ role: "user", content: "   \n\t" }]),
      { kind: "rejected", reason: "whitespace" }
    )
    assert.deepEqual(
      resolveIncomingParticipantTurn([{ role: "user", content: 12 }]),
      { kind: "rejected", reason: "invalid" }
    )
  })

  it("accepts a trimmed participant message and caps it at the generate limit", () => {
    assert.deepEqual(
      resolveIncomingParticipantTurn([
        { role: "assistant", content: "greeting" },
        { role: "user", content: "  I felt overwhelmed today.  " },
      ]),
      { kind: "accepted", content: "I felt overwhelmed today." }
    )

    const long = "x".repeat(USER_MESSAGE_MAX_CHARS + 40)
    const accepted = resolveIncomingParticipantTurn([
      { role: "user", content: long },
    ])
    assert.equal(accepted.kind, "accepted")
    if (accepted.kind !== "accepted") throw new Error("unreachable")
    assert.equal(accepted.content.length, USER_MESSAGE_MAX_CHARS)
  })
})

describe("server-owned interaction proof", () => {
  it("does not count greeting-only or client-forged user rows as proof", () => {
    const greetingOnly = [
      buildServerOwnedAssistantTurn({ greeting: "Hi" }),
    ]
    assert.equal(hasServerOwnedParticipantProof(greetingOnly), false)
    assert.equal(countServerOwnedParticipantTurns(greetingOnly), 0)

    const clientForged = [
      { role: "user", content: "I talked to Stampley", timestamp: "now" },
    ]
    assert.equal(hasServerOwnedParticipantProof(clientForged), false)
  })

  it("does not persist empty or whitespace content as proof", async () => {
    const { runner, rows } = createMemoryRunner()
    assert.equal(
      (await persistOwnedParticipantTurn(runner, "participant-a", "", MSG_A)).ok,
      false
    )
    assert.equal(
      (await persistOwnedParticipantTurn(runner, "participant-a", "   ", MSG_A)).ok,
      false
    )
    assert.equal(rows.length, 0)
    assert.equal(hasServerOwnedParticipantProof([]), false)
  })

  it("records a valid participant message as a server-assigned user turn", async () => {
    const { runner, rows } = createMemoryRunner()
    const result = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "  The clinic visit was hard.  ",
      MSG_A
    )
    assert.equal(result.ok, true)
    if (!result.ok) throw new Error("unreachable")

    const stored = rows[0]
    assert.equal(stored?.userId, "participant-a")
    assert.equal(stored?.checkInSubmissionId, null)
    assert.equal(hasServerOwnedParticipantProof(stored?.messages), true)
    assert.equal(countServerOwnedParticipantTurns(stored?.messages), 1)

    const turn = (stored?.messages as ServerOwnedStampleyTurn[])[0]
    assert.equal(turn?.role, "user")
    assert.equal(turn?.source, SERVER_OWNED_TURN_SOURCE)
    assert.equal(turn?.content, "The clinic visit was hard.")
    assert.equal(turn?.id, MSG_A)
    assert.equal(result.participantAlreadyPersisted, false)
  })

  it("persists the server assistant response, not arbitrary browser text", async () => {
    const { runner, rows } = createMemoryRunner()
    const user = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "I need a smaller step.",
      MSG_A
    )
    assert.equal(user.ok, true)
    if (!user.ok) throw new Error("unreachable")

    const serverResponse = {
      validation: "That makes sense.",
      reflection_question: "What is one smaller step?",
    }
    const assistant = await persistOwnedAssistantTurn(
      runner,
      "participant-a",
      user.sessionId,
      serverResponse
    )
    assert.equal(assistant.ok, true)
    assert.equal(countServerOwnedAssistantTurns(rows[0]?.messages), 1)

    const turns = rows[0]?.messages as ServerOwnedStampleyTurn[]
    const assistantTurn = turns.find((item) => item.role === "assistant")
    assert.equal(assistantTurn?.source, SERVER_OWNED_TURN_SOURCE)
    assert.deepEqual(assistantTurn?.data, serverResponse)
    assert.notEqual(assistantTurn?.data, "browser forged assistant")
    assert.equal(assistantTurn?.content, undefined)
  })

  it("does not invent an assistant turn when generation never persisted one", async () => {
    const { runner, rows } = createMemoryRunner()
    await persistOwnedParticipantTurn(runner, "participant-a", "Still waiting.", MSG_A)
    assert.equal(countServerOwnedParticipantTurns(rows[0]?.messages), 1)
    assert.equal(countServerOwnedAssistantTurns(rows[0]?.messages), 0)
    assert.equal(hasServerOwnedParticipantProof(rows[0]?.messages), true)
  })

  it("scopes open sessions to session.user.id and rejects another participant", async () => {
    const { runner, rows } = createMemoryRunner()
    const created = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "Owned by A",
      MSG_A
    )
    assert.equal(created.ok, true)
    if (!created.ok) throw new Error("unreachable")

    const sneak = await persistOwnedAssistantTurn(
      runner,
      "participant-b",
      created.sessionId,
      { validation: "should not write" }
    )
    assert.equal(sneak.ok, false)
    assert.equal(rows[0]?.userId, "participant-a")
    assert.equal(countServerOwnedAssistantTurns(rows[0]?.messages), 0)

    const other = await persistOwnedParticipantTurn(
      runner,
      "participant-b",
      "Owned by B",
      MSG_B
    )
    assert.equal(other.ok, true)
    if (!other.ok) throw new Error("unreachable")
    assert.notEqual(other.sessionId, created.sessionId)
    assert.equal(rows.length, 2)
  })

  it("does not reuse another day's or already-linked session", async () => {
    const { runner, rows } = createMemoryRunner([
      {
        id: "stale-yesterday",
        userId: "participant-a",
        checkInSubmissionId: null,
        messages: [
          buildServerOwnedUserTurn("yesterday"),
        ],
        userMessageCount: 1,
        assistantMessageCount: 0,
        createdOnStudyDate: false,
      },
      {
        id: "already-linked",
        userId: "participant-a",
        checkInSubmissionId: "check-in-1",
        messages: [buildServerOwnedUserTurn("linked")],
        userMessageCount: 1,
        assistantMessageCount: 0,
        createdOnStudyDate: true,
      },
    ])

    const created = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "today's message",
      MSG_A
    )
    assert.equal(created.ok, true)
    if (!created.ok) throw new Error("unreachable")
    assert.notEqual(created.sessionId, "stale-yesterday")
    assert.notEqual(created.sessionId, "already-linked")
    assert.equal(
      rows.find((row) => row.id === "stale-yesterday")?.userMessageCount,
      1
    )
    assert.equal(
      (rows.find((row) => row.id === created.sessionId)?.messages as ServerOwnedStampleyTurn[])[0]
        ?.content,
      "today's message"
    )
  })

  it("client full transcript cannot replace authoritative server-owned turns", () => {
    const user = buildServerOwnedUserTurn("real participant text")
    const assistant = buildServerOwnedAssistantTurn({
      validation: "real assistant",
    })
    const current = appendServerOwnedTurn([user], assistant)
    const forged = [
      { role: "user", content: "forged participant" },
      { role: "assistant", content: "forged assistant" },
    ]

    const protectedTurns = protectAuthoritativeTranscript(current, forged)
    assert.deepEqual(protectedTurns, current)
    assert.equal(hasServerOwnedParticipantProof(protectedTurns), true)
    assert.equal(
      (protectedTurns[0] as ServerOwnedStampleyTurn).content,
      "real participant text"
    )
  })
})

describe("generate and session source guards", () => {
  it("generate persists accepted user turns and greeting does not", () => {
    const source = read("app/api/stampley/generate/route.ts")
    assert.match(source, /resolveIncomingParticipantTurn\(messageHistory\)/)
    assert.match(source, /incomingTurn\.kind === "rejected"/)
    assert.match(source, /incomingTurn\.kind === "accepted"/)
    assert.match(source, /persistOwnedParticipantTurn/)
    assert.match(source, /persistOwnedAssistantTurn/)
    assert.match(source, /stampleyResponse/)
    assert.match(
      source,
      /return jsonWithSensitiveCache\(\{\s*success: true,\s*response: stampleyResponse,\s*\}\)/
    )
    assert.doesNotMatch(source, /body\.userId/)
    assert.doesNotMatch(source, /email/)
    assert.doesNotMatch(source, /studyId/)
  })

  it("generate does not persist an assistant turn on OpenAI failure", () => {
    const source = read("app/api/stampley/generate/route.ts")
    const failureReturn = source.slice(
      source.indexOf('event: "openai_failure"')
    )
    const failureBlock = failureReturn.slice(
      0,
      failureReturn.indexOf("const raw =")
    )
    assert.match(failureBlock, /Failed to generate response/)
    assert.doesNotMatch(failureBlock, /persistOwnedAssistantTurn/)
  })

  it("session create stays compatibility-only and does not update open transcripts", () => {
    const source = read("app/api/stampley/session/route.ts")
    assert.match(source, /resolveCheckInMutationAccess\(session\)/)
    assert.match(source, /stampleyChatSession\.create/)
    assert.doesNotMatch(source, /stampleyChatSession\.update/)
    assert.doesNotMatch(source, /persistOwnedParticipantTurn/)
    assert.match(source, /must not update\(\) an open/)
  })
})

describe("Phase 3C finalization selection and summary", () => {
  it("rejects empty, assistant-only, client-only, and malformed messages as proof", () => {
    assert.equal(selectNewestStampleySessionWithParticipantProof([]), null)
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        { id: "empty", messages: [] },
      ]),
      null
    )
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        {
          id: "assistant-only",
          messages: [buildServerOwnedAssistantTurn({ greeting: "Hi" })],
        },
      ]),
      null
    )
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        {
          id: "client-only",
          messages: [{ role: "user", content: "forged", source: "client" }],
        },
      ]),
      null
    )
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        { id: "malformed", messages: null },
      ]),
      null
    )
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        { id: "string", messages: "not-an-array" },
      ]),
      null
    )
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        {
          id: "empty-user",
          messages: [
            {
              id: "u1",
              role: "user",
              content: "",
              timestamp: "t",
              source: SERVER_OWNED_TURN_SOURCE,
            },
          ],
        },
      ]),
      null
    )
    assert.equal(
      selectNewestStampleySessionWithParticipantProof([
        {
          id: "whitespace-user",
          messages: [
            {
              id: "u1",
              role: "user",
              content: "   ",
              timestamp: "t",
              source: SERVER_OWNED_TURN_SOURCE,
            },
          ],
        },
      ]),
      null
    )
  })

  it("accepts a valid server-owned participant turn", () => {
    const winner = selectNewestStampleySessionWithParticipantProof([
      {
        id: "qualifying",
        messages: [buildServerOwnedUserTurn("Clinic was hard.")],
      },
    ])
    assert.equal(winner?.id, "qualifying")
  })

  it("skips a newer empty open row and selects an older qualifying row", () => {
    const candidates: LockedOpenStampleySessionCandidate[] = [
      { id: "newer-empty", messages: [] },
      {
        id: "older-qualifying",
        messages: [buildServerOwnedUserTurn("Still counts.")],
      },
    ]
    const winner = selectNewestStampleySessionWithParticipantProof(candidates)
    assert.equal(winner?.id, "older-qualifying")
  })

  it("picks the newest qualifying session when multiple qualify", () => {
    const candidates: LockedOpenStampleySessionCandidate[] = [
      {
        id: "newest-qualifying",
        messages: [buildServerOwnedUserTurn("latest")],
      },
      {
        id: "older-qualifying",
        messages: [buildServerOwnedUserTurn("earlier")],
      },
    ]
    const winner = selectNewestStampleySessionWithParticipantProof(candidates)
    assert.equal(winner?.id, "newest-qualifying")
  })

  it("builds a metadata-only server summary from domain and authoritative counts", () => {
    const messages = appendServerOwnedTurn(
      [buildServerOwnedUserTurn("one"), buildServerOwnedUserTurn("two")],
      buildServerOwnedAssistantTurn({ validation: "ok" })
    )
    const summary = buildServerOwnedFinalizationSummary("Emotional", messages)
    assert.match(summary, /Emotional/)
    assert.match(summary, /2 participant/)
    assert.match(summary, /1 Stampley/)
    assert.doesNotMatch(summary, /one/)
    assert.doesNotMatch(summary, /two/)
    assert.doesNotMatch(summary, /ok/)
    assert.doesNotMatch(summary, /user-/)
    assert.doesNotMatch(summary, /@/)
  })

  it("link requires owned open SERVER_AUTHORITATIVE session and does not overwrite messages", async () => {
    const originalMessages = [buildServerOwnedUserTurn("authoritative")]
    let storedMessages: unknown = originalMessages
    let storedLink: string | null = null
    let storedSummary: string | null = null
    let storedUserCount = 0
    let storedAssistantCount = 0
    let updateCalls = 0

    const tx = {
      stampleyChatSession: {
        async updateMany(args: {
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
        }) {
          updateCalls += 1
          assert.equal(args.where.id, "open-1")
          assert.equal(args.where.userId, "participant-a")
          assert.equal(args.where.checkInSubmissionId, null)
          assert.equal(
            args.where.transcriptOrigin,
            STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
          )
          assert.equal("messages" in args.data, false)
          assert.equal("transcriptOrigin" in args.data, false)
          storedLink = args.data.checkInSubmissionId
          storedSummary = args.data.summary
          storedUserCount = args.data.userMessageCount
          storedAssistantCount = args.data.assistantMessageCount
          return { count: 1 }
        },
      },
    }

    await linkStampleySessionToCheckIn(tx, {
      sessionId: "open-1",
      userId: "participant-a",
      checkInSubmissionId: "check-in-1",
      domain: "Emotional",
      stressLevel: 4,
      mood: 5,
      energy: 6,
      messages: originalMessages,
    })

    assert.equal(updateCalls, 1)
    assert.equal(storedLink, "check-in-1")
    assert.equal(storedUserCount, 1)
    assert.equal(storedAssistantCount, 0)
    assert.match(String(storedSummary), /Emotional/)
    assert.deepEqual(storedMessages, originalMessages)

    await assert.rejects(
      () =>
        linkStampleySessionToCheckIn(
          {
            stampleyChatSession: {
              async updateMany() {
                return { count: 0 }
              },
            },
          },
          {
            sessionId: "open-1",
            userId: "participant-a",
            checkInSubmissionId: "check-in-2",
            domain: "Emotional",
            stressLevel: 4,
            mood: 5,
            energy: 6,
            messages: originalMessages,
          }
        ),
      (error: unknown) => error instanceof StampleySessionLinkError
    )
  })
})


describe("Phase 3C submit and client wiring", () => {
  it("submit locks proof, links session, and maps missing proof to 400 after recovery miss", () => {
    const source = read("app/api/check-in/submit/route.ts")
    const txnStart = source.indexOf("prisma.$transaction")
    const txnBody = source.slice(txnStart)

    assert.match(source, /resolveCheckInMutationAccess\(session\)/)
    assert.match(source, /validateCheckInSubmitBody/)
    assert.match(source, /resolveSubmitWeeklyDomain/)
    assert.match(
      source,
      /resolveAuthoritativeStampleySessionForFinalization\(tx, userId\)/
    )
    assert.match(source, /linkStampleySessionToCheckIn\(tx,/)
    assert.match(source, /MissingStampleyProofError/)
    assert.match(source, /MISSING_STAMPLEY_PROOF_MESSAGE/)
    assert.match(source, /status: 400/)
    assert.match(source, /alreadyCompleted: false/)

    const proofIndex = txnBody.indexOf(
      "resolveAuthoritativeStampleySessionForFinalization"
    )
    const domainIndex = txnBody.indexOf("userWeeklyDomain.create")
    const createIndex = txnBody.indexOf("checkInSubmission.create")
    const linkIndex = txnBody.indexOf("linkStampleySessionToCheckIn")
    const progressIndex = txnBody.indexOf("userStudyProgress.upsert")

    assert.notEqual(proofIndex, -1)
    assert.ok(proofIndex < domainIndex)
    assert.ok(domainIndex < createIndex)
    assert.ok(createIndex < linkIndex)
    assert.ok(linkIndex < progressIndex)
    assert.doesNotMatch(source, /body\.userId/)
    assert.doesNotMatch(txnBody, /openai|OpenAI/)
  })

  it("submit still rejects non-participants and preserves duplicate-day 409", () => {
    const source = read("app/api/check-in/submit/route.ts")
    assert.match(source, /resolveCheckInMutationAccess\(session\)/)
    assert.match(source, /STUDY_TOTAL_CHECKINS/)
    assert.match(source, /status: 403/)
    assert.match(source, /DUPLICATE_CHECK_IN_MESSAGE/)
    assert.match(source, /status: 409/)
    assert.match(source, /StampleySessionLinkError/)
  })

  it("successful Complete Check-In no longer POSTs compatibility session endpoint", () => {
    const source = read("app/check-in/stampley-support/page.tsx")
    const completeStart = source.indexOf("const handleCompleteCheckIn")
    const completeEnd = source.indexOf("useEffect(() => {", completeStart)
    const complete = source.slice(completeStart, completeEnd)

    assert.match(complete, /\/api\/check-in\/submit/)
    assert.doesNotMatch(complete, /fetch\(\s*["']\/api\/stampley\/session["']/)
    assert.doesNotMatch(complete, /saveStampleySessionWithRetry/)
    assert.doesNotMatch(complete, /backupUnsavedTranscript/)
    assert.match(complete, /clearActiveChatDraft/)
    assert.match(complete, /clearUnsavedTranscript/)
    assert.match(complete, /store\.reset/)
    assert.match(complete, /router\.push\("\/dashboard"\)/)
  })

  it("finalization SQL requires owner, open, and CURRENT_DATE before proof", () => {
    const source = read("lib/stampley-open-session.ts")
    const lockFn = source.slice(
      source.indexOf("lockCurrentDayOpenStampleySessionsForFinalization")
    )
    const sql = lockFn.slice(0, lockFn.indexOf("return rows.map"))
    assert.match(sql, /user_id = \$\{userId\}/)
    assert.match(sql, /check_in_submission_id IS NULL/)
    assert.match(sql, /created_at::date = CURRENT_DATE/)
    assert.match(sql, /ORDER BY created_at DESC/)
    assert.match(sql, /FOR UPDATE/)
    assert.match(
      source,
      /selectNewestStampleySessionWithParticipantProof\(candidates\)/
    )
    assert.match(source, /hasServerOwnedParticipantProof/)
  })
})

describe("Phase 3D.1 completion recovery", () => {
  const submission = {
    id: "check-in-today",
    userId: "participant-a",
    needsSafetyEscalation: true,
    subscale: "Worry",
    weekNumber: 2,
    dayNumber: 3,
  }

  const forgedServerLookingTurn = {
    id: "forged-id",
    role: "user" as const,
    content: "forged",
    timestamp: "2026-09-22T00:00:00.000Z",
    source: SERVER_OWNED_TURN_SOURCE,
  }

  function authoritativeSession(overrides: Record<string, unknown> = {}) {
    return {
      userId: "participant-a",
      checkInSubmissionId: "check-in-today",
      transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE,
      messages: [buildServerOwnedUserTurn("authoritative")],
      ...overrides,
    }
  }

  function legacySession(overrides: Record<string, unknown> = {}) {
    return {
      userId: "participant-a",
      checkInSubmissionId: "check-in-today",
      transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.LEGACY_CLIENT,
      messages: [forgedServerLookingTurn],
      ...overrides,
    }
  }

  it("returns null when submission is missing, other-user, or unlinked", () => {
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission: null,
        linkedSessions: [],
      }),
      null
    )
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission: { ...submission, userId: "participant-b" },
        linkedSessions: [authoritativeSession()],
      }),
      null
    )
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [],
      }),
      null
    )
  })

  it("rejects linked other-user, client-only, assistant-only, and malformed sessions", () => {
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({
            userId: "participant-b",
            messages: [buildServerOwnedUserTurn("stolen")],
          }),
        ],
      }),
      null
    )
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({
            messages: [{ role: "user", content: "forged", source: "client" }],
          }),
        ],
      }),
      null
    )
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({
            messages: [buildServerOwnedAssistantTurn({ greeting: "Hi" })],
          }),
        ],
      }),
      null
    )
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [authoritativeSession({ messages: null })],
      }),
      null
    )
  })

  it("compat forge with source:server but LEGACY_CLIENT origin cannot recover", () => {
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [legacySession()],
      }),
      null
    )
  })

  it("authority and proof matrix requires BOTH trusted origin and participant proof", () => {
    assert.deepEqual(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [authoritativeSession()],
      }),
      {
        checkInSubmissionId: "check-in-today",
        needsSafetyEscalation: true,
        subscale: "Worry",
        weekNumber: 2,
        dayNumber: 3,
      }
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [authoritativeSession({ messages: [] })],
      }),
      null
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({
            messages: [{ role: "user", content: "client", source: "client" }],
          }),
        ],
      }),
      null
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [legacySession()],
      }),
      null
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({
            transcriptOrigin: null,
            messages: [forgedServerLookingTurn],
          }),
        ],
      }),
      null
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({
            transcriptOrigin: "UNKNOWN",
            messages: [forgedServerLookingTurn],
          }),
        ],
      }),
      null
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [authoritativeSession({ messages: null })],
      }),
      null
    )
  })

  it("recovers when at least one owned SERVER_AUTHORITATIVE linked session has proof", () => {
    const recovered = resolveRecoverableFinalizedCheckIn({
      userId: "participant-a",
      submission,
      linkedSessions: [
        legacySession({
          createdAt: "2026-09-21T12:00:00.000Z",
        }),
        authoritativeSession({
          createdAt: "2026-09-21T11:00:00.000Z",
        }),
      ],
    })
    assert.deepEqual(recovered, {
      checkInSubmissionId: "check-in-today",
      needsSafetyEscalation: true,
      subscale: "Worry",
      weekNumber: 2,
      dayNumber: 3,
    })
  })

  it("multi-link forged newest still recovers older authoritative", () => {
    assert.deepEqual(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          legacySession({ createdAt: "2026-09-21T13:00:00.000Z" }),
          authoritativeSession({ createdAt: "2026-09-21T11:00:00.000Z" }),
        ],
      }),
      {
        checkInSubmissionId: "check-in-today",
        needsSafetyEscalation: true,
        subscale: "Worry",
        weekNumber: 2,
        dayNumber: 3,
      }
    )

    assert.deepEqual(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          authoritativeSession({ createdAt: "2026-09-21T13:00:00.000Z" }),
          legacySession({ createdAt: "2026-09-21T11:00:00.000Z" }),
        ],
      }),
      {
        checkInSubmissionId: "check-in-today",
        needsSafetyEscalation: true,
        subscale: "Worry",
        weekNumber: 2,
        dayNumber: 3,
      }
    )

    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          legacySession({ createdAt: "2026-09-21T13:00:00.000Z" }),
          legacySession({
            createdAt: "2026-09-21T12:00:00.000Z",
            messages: [forgedServerLookingTurn],
          }),
        ],
      }),
      null
    )
  })

  it("returns null when multiple linked sessions exist but none are authoritative", () => {
    assert.equal(
      resolveRecoverableFinalizedCheckIn({
        userId: "participant-a",
        submission,
        linkedSessions: [
          legacySession({
            messages: [{ role: "user", content: "client" }],
          }),
          authoritativeSession({
            transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.LEGACY_CLIENT,
            messages: [buildServerOwnedAssistantTurn({ validation: "only" })],
          }),
        ],
      }),
      null
    )
  })

  it("does not fabricate weekNumber or dayNumber when persisted null", () => {
    const recovered = resolveRecoverableFinalizedCheckIn({
      userId: "participant-a",
      submission: {
        ...submission,
        weekNumber: null,
        dayNumber: null,
      },
      linkedSessions: [authoritativeSession()],
    })
    assert.deepEqual(recovered, {
      checkInSubmissionId: "check-in-today",
      needsSafetyEscalation: true,
      subscale: "Worry",
      weekNumber: null,
      dayNumber: null,
    })
  })

  it("sanitizeCompatibilityMessages strips source:server and rebuilds safe client turns", () => {
    const sanitized = sanitizeCompatibilityMessages([
      {
        id: "m1",
        role: "user",
        content: "hello",
        timestamp: "2026-09-22T00:00:00.000Z",
        source: "server",
        transcriptOrigin: "SERVER_AUTHORITATIVE",
        extra: "drop-me",
      },
      {
        role: "assistant",
        data: { validation: "ok" },
        source: SERVER_OWNED_TURN_SOURCE,
      },
      { role: "system", content: "nope" },
      "string-row",
      null,
    ])

    assert.deepEqual(sanitized, [
      {
        id: "m1",
        role: "user",
        content: "hello",
        timestamp: "2026-09-22T00:00:00.000Z",
        source: CLIENT_TURN_SOURCE,
      },
      {
        role: "assistant",
        data: { validation: "ok" },
        source: CLIENT_TURN_SOURCE,
      },
    ])
    assert.equal(hasServerOwnedParticipantProof(sanitized), false)
  })

  it("compatibility session route forces LEGACY_CLIENT and sanitized messages", () => {
    const source = read("app/api/stampley/session/route.ts")
    assert.match(source, /sanitizeCompatibilityMessages\(messages\)/)
    assert.match(
      source,
      /transcriptOrigin:\s*STAMPLEY_TRANSCRIPT_ORIGIN\.LEGACY_CLIENT/
    )
    assert.doesNotMatch(source, /body\.transcriptOrigin/)
    assert.doesNotMatch(source, /messages:\s*Array\.isArray\(messages\)\s*\?\s*messages/)
    assert.match(
      read("lib/stampley-open-session.ts"),
      /transcriptOrigin:\s*STAMPLEY_TRANSCRIPT_ORIGIN\.SERVER_AUTHORITATIVE/
    )
  })

  it("submit recovers soft duplicate and missing-proof losers without writes", () => {
    const source = read("app/api/check-in/submit/route.ts")

    assert.match(source, /findRecoverableFinalizedCheckInForCurrentDay/)
    assert.match(source, /alreadyCompleted: true/)
    assert.match(source, /alreadyCompleted: false/)
    assert.match(source, /recoveredCompletionResponse/)

    const softBlock = source.slice(
      source.indexOf("if (existingToday.length > 0)"),
      source.indexOf("const progress = await prisma.userStudyProgress")
    )
    assert.match(softBlock, /findRecoverableFinalizedCheckInForCurrentDay/)
    assert.match(softBlock, /recoveredCompletionResponse/)
    assert.match(softBlock, /DUPLICATE_CHECK_IN_MESSAGE/)
    assert.doesNotMatch(softBlock, /\$transaction/)
    assert.doesNotMatch(softBlock, /checkInSubmission\.create/)
    assert.doesNotMatch(softBlock, /linkStampleySessionToCheckIn/)
    assert.doesNotMatch(softBlock, /userStudyProgress/)

    const missingBlock = source.slice(
      source.indexOf("if (error instanceof MissingStampleyProofError)")
    )
    const missingOnly = missingBlock.slice(
      0,
      missingBlock.indexOf("if (error instanceof DuplicateCheckInError")
    )
    assert.match(missingOnly, /findRecoverableFinalizedCheckInForCurrentDay/)
    assert.match(missingOnly, /recoveredCompletionResponse/)
    assert.match(missingOnly, /MISSING_STAMPLEY_PROOF_MESSAGE/)
    assert.match(missingOnly, /status: 400/)

    const uniqueBlock = source.slice(
      source.indexOf("if (error instanceof DuplicateCheckInError || isUniqueViolation")
    )
    const uniqueOnly = uniqueBlock.slice(
      0,
      uniqueBlock.indexOf("if (error instanceof StampleySessionLinkError)")
    )
    assert.match(uniqueOnly, /findRecoverableFinalizedCheckInForCurrentDay/)
    assert.match(uniqueOnly, /recoveredCompletionResponse/)
    assert.match(uniqueOnly, /status: 409/)
  })

  it("recovery SQL uses CURRENT_DATE, ownership, and SERVER_AUTHORITATIVE origin", () => {
    const source = read("lib/stampley-open-session.ts")
    const finder = source.slice(
      source.indexOf("findRecoverableFinalizedCheckInForCurrentDay")
    )
    const body = finder.slice(0, finder.indexOf("export function sanitizeCompatibilityMessages"))
    assert.match(body, /check_in_date = CURRENT_DATE/)
    assert.match(body, /user_id = \$\{userId\}/)
    assert.match(body, /check_in_submission_id = \$\{submissionRow\.id\}/)
    assert.match(body, /transcript_origin::text = \$\{STAMPLEY_TRANSCRIPT_ORIGIN\.SERVER_AUTHORITATIVE\}/)
    assert.doesNotMatch(body, /\.create\(/)
    assert.doesNotMatch(body, /\.update/)
    assert.doesNotMatch(body, /\.upsert/)
  })

  it("recovery response uses persisted fields and never echoes retry body metrics", () => {
    const source = read("app/api/check-in/submit/route.ts")
    const helper = source.slice(
      source.indexOf("function recoveredCompletionResponse")
    )
    const helperBody = helper.slice(0, helper.indexOf("export async function POST"))
    assert.match(helperBody, /alreadyCompleted: true/)
    assert.match(helperBody, /recovered\.checkInSubmissionId/)
    assert.match(helperBody, /recovered\.needsSafetyEscalation/)
    assert.match(helperBody, /recovered\.subscale/)
    assert.match(helperBody, /recovered\.dayNumber/)
    assert.match(helperBody, /recovered\.weekNumber/)
    assert.doesNotMatch(helperBody, /distress/)
    assert.doesNotMatch(helperBody, /mood/)
    assert.doesNotMatch(helperBody, /energy/)
    assert.doesNotMatch(helperBody, /reflection/)
    assert.doesNotMatch(helperBody, /copingAction/)
    assert.doesNotMatch(helperBody, /messages/)
  })
})

describe("Phase 3D.2A-1 open-session lock and messageId idempotency", () => {
  it("validates participant messageId as UUID only", () => {
    assert.equal(
      parseParticipantMessageId("11111111-1111-4111-8111-111111111111"),
      "11111111-1111-4111-8111-111111111111"
    )
    assert.equal(
      parseParticipantMessageId("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"),
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    )
    assert.equal(parseParticipantMessageId(null), null)
    assert.equal(parseParticipantMessageId(""), null)
    assert.equal(parseParticipantMessageId("   "), null)
    assert.equal(parseParticipantMessageId("not-a-uuid"), null)
    assert.equal(parseParticipantMessageId(12), null)
    assert.equal(parseParticipantMessageId(true), null)
    assert.equal(parseParticipantMessageId({ id: MSG_A }), null)
    assert.equal(parseParticipantMessageId([MSG_A]), null)
    assert.equal(
      parseParticipantMessageId("11111111-1111-4111-8111-111111111111EXTRA"),
      null
    )
  })

  it("dedupes same messageId and allows same text with different ids", async () => {
    const { runner, rows, locksAcquired } = createMemoryRunner()
    const first = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "same text",
      MSG_A
    )
    assert.equal(first.ok, true)
    if (!first.ok) throw new Error("unreachable")
    assert.equal(first.participantAlreadyPersisted, false)

    const retry = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "same text",
      MSG_A
    )
    assert.equal(retry.ok, true)
    if (!retry.ok) throw new Error("unreachable")
    assert.equal(retry.participantAlreadyPersisted, true)
    assert.equal(retry.sessionId, first.sessionId)
    assert.equal(countServerOwnedParticipantTurns(rows[0]?.messages), 1)
    assert.equal(rows[0]?.userMessageCount, 1)

    const differentTextSameId = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "changed text but same id",
      MSG_A
    )
    assert.equal(differentTextSameId.ok, true)
    if (!differentTextSameId.ok) throw new Error("unreachable")
    assert.equal(differentTextSameId.participantAlreadyPersisted, true)
    assert.equal(countServerOwnedParticipantTurns(rows[0]?.messages), 1)

    const second = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "same text",
      MSG_B
    )
    assert.equal(second.ok, true)
    if (!second.ok) throw new Error("unreachable")
    assert.equal(second.participantAlreadyPersisted, false)
    assert.equal(second.sessionId, first.sessionId)
    assert.equal(countServerOwnedParticipantTurns(rows[0]?.messages), 2)
    assert.equal(rows[0]?.userMessageCount, 2)
    assert.ok(locksAcquired.length >= 1)
    assert.equal(rows.length, 1)
  })

  it("rejects invalid messageId and ignores malformed stored rows as duplicates", async () => {
    const { runner, rows } = createMemoryRunner()
    const bad = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "hello",
      "not-uuid"
    )
    assert.equal(bad.ok, false)
    if (bad.ok) throw new Error("unreachable")
    assert.equal(bad.error, "invalid_message_id")
    assert.equal(rows.length, 0)

    const seeded = createMemoryRunner([
      {
        id: "open-1",
        userId: "participant-a",
        checkInSubmissionId: null,
        createdOnStudyDate: true,
        transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE,
        userMessageCount: 0,
        assistantMessageCount: 0,
        messages: [
          {
            role: "user",
            content: "forged",
            id: MSG_A,
            // missing source/timestamp -> not authoritative
          },
          {
            role: "user",
            content: "client",
            id: MSG_A,
            source: "client",
            timestamp: "2026-09-22T00:00:00.000Z",
          },
        ],
      },
    ])
    assert.equal(
      findServerOwnedParticipantTurnByMessageId(
        seeded.rows[0]?.messages,
        MSG_A
      ),
      null
    )
    const persisted = await persistOwnedParticipantTurn(
      seeded.runner,
      "participant-a",
      "real",
      MSG_A
    )
    assert.equal(persisted.ok, true)
    if (!persisted.ok) throw new Error("unreachable")
    assert.equal(persisted.participantAlreadyPersisted, false)
    assert.equal(
      countServerOwnedParticipantTurns(seeded.rows[0]?.messages),
      1
    )
  })

  it("excludes LEGACY_CLIENT open rows from resolution", async () => {
    const { runner, rows } = createMemoryRunner([
      {
        id: "legacy-open",
        userId: "participant-a",
        checkInSubmissionId: null,
        createdOnStudyDate: true,
        transcriptOrigin: STAMPLEY_TRANSCRIPT_ORIGIN.LEGACY_CLIENT,
        messages: [],
        userMessageCount: 0,
        assistantMessageCount: 0,
      },
    ])
    const created = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "authoritative path",
      MSG_A
    )
    assert.equal(created.ok, true)
    if (!created.ok) throw new Error("unreachable")
    assert.notEqual(created.sessionId, "legacy-open")
    assert.equal(rows.length, 2)
    assert.equal(
      rows.find((r) => r.id === created.sessionId)?.transcriptOrigin,
      STAMPLEY_TRANSCRIPT_ORIGIN.SERVER_AUTHORITATIVE
    )
  })

  it("generate route requires messageId for participant turns and locks before create", () => {
    const route = read("app/api/stampley/generate/route.ts")
    const open = read("lib/stampley-open-session.ts")
    const page = read("app/check-in/stampley-support/page.tsx")

    assert.match(route, /INVALID_PARTICIPANT_MESSAGE_ID_MESSAGE/)
    assert.match(route, /persistOwnedParticipantTurn\(/)
    assert.match(route, /messageId/)
    assert.match(route, /invalid_message_id/)
    assert.match(route, /status: 400/)

    const persistFn = open.slice(open.indexOf("export async function persistOwnedParticipantTurn"))
    const persistBody = persistFn.slice(
      0,
      persistFn.indexOf("export async function persistOwnedAssistantTurn")
    )
    const lockIndex = persistBody.indexOf("acquireCurrentDayOpenSessionLock")
    const findIndex = persistBody.indexOf("findLatestTodayOpenSessionId")
    const createIndex = persistBody.indexOf("createOpenSession")
    const rowLockIndex = persistBody.indexOf("lockOwnedOpenSession")
    assert.notEqual(lockIndex, -1)
    assert.ok(lockIndex < findIndex)
    assert.ok(findIndex < createIndex)
    assert.ok(createIndex < rowLockIndex)
    assert.match(persistBody, /findServerOwnedParticipantTurnByMessageId/)
    assert.match(persistBody, /participantAlreadyPersisted: true/)

    assert.match(open, /pg_advisory_xact_lock/)
    assert.match(open, /hashtextextended/)
    assert.match(
      open,
      /hashtextextended\(\s*\(\$\{userId\} \|\| \(':' \|\| CURRENT_DATE::text\)\),\s*0\s*\)/
    )
    assert.doesNotMatch(open, /convert_to/)
    assert.match(open, /CURRENT_DATE/)
    assert.match(open, /transcript_origin::text = \$\{STAMPLEY_TRANSCRIPT_ORIGIN\.SERVER_AUTHORITATIVE\}/)
    assert.doesNotMatch(persistBody, /openai|OpenAI/)

    const txnEnd = route.indexOf("openSessionId = persisted.sessionId")
    const openaiStart = route.indexOf("openai.chat.completions.create")
    assert.ok(txnEnd !== -1 && openaiStart !== -1 && txnEnd < openaiStart)

    assert.match(page, /crypto\.randomUUID\(\)/)
    assert.match(page, /messageId/)
    assert.match(
      page,
      /\.\.\.\(typeof messageId === "string" \? \{ messageId \} : \{\}\)/
    )
  })

  it("messageId cannot select another participant session", async () => {
    const shared = createMemoryRunner()
    const a = await persistOwnedParticipantTurn(
      shared.runner,
      "participant-a",
      "A message",
      MSG_C
    )
    assert.equal(a.ok, true)
    if (!a.ok) throw new Error("unreachable")

    const b = await persistOwnedParticipantTurn(
      shared.runner,
      "participant-b",
      "B message",
      MSG_C
    )
    assert.equal(b.ok, true)
    if (!b.ok) throw new Error("unreachable")
    assert.notEqual(a.sessionId, b.sessionId)
    assert.equal(shared.rows.length, 2)
    assert.equal(
      countServerOwnedParticipantTurns(
        shared.rows.find((r) => r.id === a.sessionId)?.messages
      ),
      1
    )
    assert.equal(
      countServerOwnedParticipantTurns(
        shared.rows.find((r) => r.id === b.sessionId)?.messages
      ),
      1
    )
  })
})
