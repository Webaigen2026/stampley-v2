import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { hasCapability } from "./admin-capabilities"
import { GenericAdminFailure } from "./admin-phi-page"
import {
  ADMIN_STAMPLEY_SESSION_LIST_FIELDS,
  ADMIN_STAMPLEY_TRANSCRIPT_DETAIL_FIELDS,
  isStampleySessionId,
  mapStampleySessionListRow,
  mapStampleyTranscriptDetail,
} from "./admin-stampley-sessions"
import {
  canReadStampleyTranscript,
  resolveAdminStampleyTranscriptGet,
  STAMPLEY_TRANSCRIPT_FORBIDDEN,
  STAMPLEY_TRANSCRIPT_GENERIC_FAILURE,
  STAMPLEY_TRANSCRIPT_NOT_FOUND,
  STAMPLEY_TRANSCRIPT_UNAUTHORIZED,
} from "./admin-stampley-transcript"
import { jsonWithSensitiveCache, hasSensitiveCachePolicy } from "./sensitive-cache-headers"
import type { AuditActor } from "./audit"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const SESSION_ID = "11111111-1111-4111-8111-111111111111"
const PARTICIPANT_ID = "22222222-2222-4222-8222-222222222222"

const listRow = {
  id: SESSION_ID,
  user_id: PARTICIPANT_ID,
  email: "participant@example.com",
  check_in_date: "2026-09-01",
  domain: "Emotional",
  stress_level: 9,
  mood: 4,
  energy: 3,
  user_message_count: 2,
  assistant_message_count: 2,
  summary: "Talked about insulin",
  created_at: "2026-09-01T12:00:00.000Z",
  messages: [{ role: "user", content: "secret transcript" }],
}

const transcriptMessages = [
  { role: "user", content: "I feel exhausted", timestamp: "2026-09-01T12:00:00.000Z" },
  {
    role: "assistant",
    data: { greeting: "I hear you", validation: "That is a lot" },
  },
]

function sessionFor(role: AuditActor["role"] | null, id = "staff-1") {
  if (!role) return { user: { id: undefined, role: undefined } }
  return { user: { id, role } }
}

describe("HIPAA-5.6.2A Stampley list DTO minimization", () => {
  it("list mapper keep-lists metadata and never copies messages", () => {
    const mapped = mapStampleySessionListRow(listRow)
    assert.deepEqual(Object.keys(mapped).sort(), [...ADMIN_STAMPLEY_SESSION_LIST_FIELDS].sort())
    assert.equal("messages" in mapped, false)
    assert.equal(JSON.stringify(mapped).includes("secret transcript"), false)
    assert.equal(mapped.summary, "Talked about insulin")
    assert.equal(mapped.email, "participant@example.com")
    assert.equal(mapped.stressLevel, 9)
  })

  it("transcript detail DTO is messages-only", () => {
    const detail = mapStampleyTranscriptDetail(transcriptMessages)
    assert.deepEqual(Object.keys(detail), [...ADMIN_STAMPLEY_TRANSCRIPT_DETAIL_FIELDS])
    assert.equal("email" in detail, false)
    assert.equal("userId" in detail, false)
    assert.equal("studyId" in detail, false)
    assert.equal("stressLevel" in detail, false)
    assert.equal("summary" in detail, false)
    assert.equal(detail.messages[0]?.content, "I feel exhausted")
    assert.equal(detail.messages[1]?.data?.greeting, "I hear you")
  })

  it("admin Stampley list and profile queries do not select messages", () => {
    const list = read("app/admin/stampley-chats/page.tsx")
    const profile = read("app/admin/users/[id]/page.tsx")
    assert.doesNotMatch(list, /\bs\.messages\b/)
    assert.doesNotMatch(list, /\bmessages,\s*$/m)
    assert.match(list, /s\.summary/)
    assert.match(list, /includesTranscripts:\s*false/)
    assert.match(list, /mapStampleySessionListRow/)
    assert.doesNotMatch(profile, /messages:\s*true/)
    assert.match(profile, /mapStampleySessionListRow/)
    assert.match(profile, /includesTranscripts:\s*false/)
    assert.match(profile, /reflection: canViewNarratives/)
    assert.match(profile, /copingAction: canViewNarratives/)
  })

  it("StampleySessionCard initial props cannot carry messages", () => {
    const source = read("components/admin/stampley-chats/stampley-session-card.tsx")
    assert.match(source, /AdminStampleySessionListItem/)
    assert.doesNotMatch(source, /session\.messages/)
    assert.doesNotMatch(
      source,
      /export type AdminStampleySession = \{[\s\S]*messages:/
    )
    assert.match(source, /onToggleTranscript/)
    assert.doesNotMatch(source, /useEffect/)
    assert.match(source, /\/api\/admin\/stampley-sessions\//)
    assert.match(source, /cache:\s*"no-store"/)
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i)
  })
})

describe("HIPAA-5.6.2A Stampley transcript detail authorization", () => {
  it("allows ADMIN and CLINICAL_REVIEWER and denies others", () => {
    assert.equal(canReadStampleyTranscript("ADMIN"), true)
    assert.equal(canReadStampleyTranscript("CLINICAL_REVIEWER"), true)
    assert.equal(hasCapability("ADMIN", "canViewTranscripts"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewTranscripts"), true)
    assert.equal(canReadStampleyTranscript("STUDY_COORDINATOR"), false)
    assert.equal(canReadStampleyTranscript("PARTICIPANT"), false)
    assert.equal(canReadStampleyTranscript(null), false)
  })

  it("rejects unauthenticated, participant, and coordinator callers", async () => {
    const loadSession = async () => {
      throw new Error("should not load")
    }
    const denied: string[] = []

    const unauth = await resolveAdminStampleyTranscriptGet({
      session: null,
      sessionId: SESSION_ID,
      loadSession,
      recordDenied: async () => {
        denied.push("unauth")
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(unauth, { status: 401, body: STAMPLEY_TRANSCRIPT_UNAUTHORIZED })

    const participant = await resolveAdminStampleyTranscriptGet({
      session: sessionFor("PARTICIPANT", "p-1"),
      sessionId: SESSION_ID,
      loadSession,
      recordDenied: async (actor) => {
        denied.push(actor.role)
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(participant, { status: 403, body: STAMPLEY_TRANSCRIPT_FORBIDDEN })

    const coordinator = await resolveAdminStampleyTranscriptGet({
      session: sessionFor("STUDY_COORDINATOR", "c-1"),
      sessionId: SESSION_ID,
      loadSession,
      recordDenied: async (actor) => {
        denied.push(actor.role)
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(coordinator, { status: 403, body: STAMPLEY_TRANSCRIPT_FORBIDDEN })
    assert.deepEqual(denied, ["PARTICIPANT", "STUDY_COORDINATOR"])
  })

  it("returns a minimized transcript for ADMIN and CLINICAL_REVIEWER", async () => {
    const views: Array<{ resourceId: string; subjectUserId: string }> = []
    const loadSession = async (id: string) => {
      assert.equal(id, SESSION_ID)
      return {
        id: SESSION_ID,
        userId: PARTICIPANT_ID,
        messages: transcriptMessages,
      }
    }

    for (const role of ["ADMIN", "CLINICAL_REVIEWER"] as const) {
      views.length = 0
      const result = await resolveAdminStampleyTranscriptGet({
        session: sessionFor(role),
        sessionId: SESSION_ID,
        loadSession,
        recordDenied: async () => {
          throw new Error("should not deny")
        },
        recordView: async (input) => {
          views.push(input)
        },
      })
      assert.equal(result.status, 200)
      assert.deepEqual(Object.keys(result.body), ["messages"])
      assert.equal(JSON.stringify(result.body).includes("participant@example.com"), false)
      assert.equal("userId" in result.body, false)
      assert.deepEqual(views, [
        { resourceId: SESSION_ID, subjectUserId: PARTICIPANT_ID },
      ])
    }
  })

  it("rejects malformed and missing session IDs without auditing a view", async () => {
    assert.equal(isStampleySessionId("not-a-uuid"), false)
    assert.equal(isStampleySessionId(SESSION_ID), true)

    let loaded = false
    let viewed = false
    const malformed = await resolveAdminStampleyTranscriptGet({
      session: sessionFor("ADMIN"),
      sessionId: "not-a-uuid",
      loadSession: async () => {
        loaded = true
        return null
      },
      recordDenied: async () => {
        throw new Error("should not deny")
      },
      recordView: async () => {
        viewed = true
      },
    })
    assert.deepEqual(malformed, { status: 400, body: STAMPLEY_TRANSCRIPT_NOT_FOUND })
    assert.equal(loaded, false)
    assert.equal(viewed, false)

    const missing = await resolveAdminStampleyTranscriptGet({
      session: sessionFor("ADMIN"),
      sessionId: SESSION_ID,
      loadSession: async () => null,
      recordDenied: async () => {
        throw new Error("should not deny")
      },
      recordView: async () => {
        viewed = true
      },
    })
    assert.deepEqual(missing, { status: 404, body: STAMPLEY_TRANSCRIPT_NOT_FOUND })
    assert.equal(viewed, false)
  })

  it("does not return the transcript when fail-closed audit persistence fails", async () => {
    const result = await resolveAdminStampleyTranscriptGet({
      session: sessionFor("ADMIN"),
      sessionId: SESSION_ID,
      loadSession: async () => ({
        id: SESSION_ID,
        userId: PARTICIPANT_ID,
        messages: transcriptMessages,
      }),
      recordDenied: async () => {
        throw new Error("should not deny")
      },
      recordView: async () => {
        throw new GenericAdminFailure()
      },
    })
    assert.deepEqual(result, {
      status: 500,
      body: STAMPLEY_TRANSCRIPT_GENERIC_FAILURE,
    })
    assert.equal(JSON.stringify(result.body).includes("I feel exhausted"), false)
  })
})

describe("HIPAA-5.6.2A Stampley transcript route wiring", () => {
  it("uses capability checks, Prisma findUnique, sensitive cache, and fail-closed audit", () => {
    const route = read("app/api/admin/stampley-sessions/[id]/route.ts")
    const helper = read("lib/admin-stampley-transcript.ts")
    assert.match(route, /resolveAdminStampleyTranscriptGet/)
    assert.match(route, /jsonWithSensitiveCache/)
    assert.match(route, /recordPhiPageViewOrThrow/)
    assert.match(route, /findUnique/)
    assert.match(route, /messages: true/)
    assert.match(route, /includesTranscripts:\s*true/)
    assert.doesNotMatch(route, /email:\s*true/)
    assert.doesNotMatch(route, /findMany/)
    assert.match(helper, /canViewTranscripts/)
    assert.match(helper, /GenericAdminFailure/)
  })

  it("applies HIPAA-5.4 sensitive cache headers to the detail JSON", async () => {
    const response = jsonWithSensitiveCache(
      { messages: [{ role: "user", content: "hi" }] },
      { status: 200 }
    )
    assert.equal(hasSensitiveCachePolicy(response.headers), true)
    assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0")
    assert.equal(response.headers.get("Pragma"), "no-cache")
    assert.equal(response.headers.get("Expires"), "0")
  })
})
