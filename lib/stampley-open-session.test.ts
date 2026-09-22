import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { USER_MESSAGE_MAX_CHARS } from "./stampley-openai-context"
import {
  SERVER_OWNED_TURN_SOURCE,
  StampleySessionLinkError,
  appendServerOwnedTurn,
  buildServerOwnedAssistantTurn,
  buildServerOwnedFinalizationSummary,
  buildServerOwnedUserTurn,
  countServerOwnedAssistantTurns,
  countServerOwnedParticipantTurns,
  hasServerOwnedParticipantProof,
  linkStampleySessionToCheckIn,
  persistOwnedAssistantTurn,
  persistOwnedParticipantTurn,
  protectAuthoritativeTranscript,
  resolveIncomingParticipantTurn,
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
}

function createMemoryRunner(seed: MemoryRow[] = []): {
  runner: OpenSessionStoreRunner
  rows: MemoryRow[]
} {
  const rows = seed
  let seq = seed.length

  const store: OpenSessionStore = {
    async findLatestTodayOpenSessionId(userId) {
      const matches = rows.filter(
        (row) =>
          row.userId === userId &&
          row.checkInSubmissionId === null &&
          row.createdOnStudyDate
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
      })
      return id
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
    runner: {
      run(fn) {
        return fn(store)
      },
    },
  }
}

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
      (await persistOwnedParticipantTurn(runner, "participant-a", "")).ok,
      false
    )
    assert.equal(
      (await persistOwnedParticipantTurn(runner, "participant-a", "   ")).ok,
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
      "  The clinic visit was hard.  "
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
    assert.equal(turn?.role === "user", true)
  })

  it("persists the server assistant response, not arbitrary browser text", async () => {
    const { runner, rows } = createMemoryRunner()
    const user = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "I need a smaller step."
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
    await persistOwnedParticipantTurn(runner, "participant-a", "Still waiting.")
    assert.equal(countServerOwnedParticipantTurns(rows[0]?.messages), 1)
    assert.equal(countServerOwnedAssistantTurns(rows[0]?.messages), 0)
    assert.equal(hasServerOwnedParticipantProof(rows[0]?.messages), true)
  })

  it("scopes open sessions to session.user.id and rejects another participant", async () => {
    const { runner, rows } = createMemoryRunner()
    const created = await persistOwnedParticipantTurn(
      runner,
      "participant-a",
      "Owned by A"
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
      "Owned by B"
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
      "today's message"
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

  it("link requires owned open session and does not overwrite messages", async () => {
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
          assert.equal("messages" in args.data, false)
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
  it("submit locks proof, links session, and maps missing proof to 400", () => {
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
