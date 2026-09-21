import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { hasCapability } from "./admin-capabilities"
import { GenericAdminFailure } from "./admin-phi-page"
import { isStampleySessionId } from "./admin-stampley-sessions"
import {
  ADMIN_ANALYTICS_ENGAGEMENT_LIST_FIELDS,
  ADMIN_STAMPLEY_SUMMARY_DETAIL_FIELDS,
  mapAnalyticsEngagementListRow,
  mapStampleySummaryDetail,
} from "./admin-stampley-summary"
import {
  canReadStampleySummary,
  resolveAdminStampleySummaryGet,
  STAMPLEY_SUMMARY_FORBIDDEN,
  STAMPLEY_SUMMARY_GENERIC_FAILURE,
  STAMPLEY_SUMMARY_NOT_FOUND,
  STAMPLEY_SUMMARY_UNAUTHORIZED,
} from "./admin-stampley-summary-get"
import {
  jsonWithSensitiveCache,
  hasSensitiveCachePolicy,
} from "./sensitive-cache-headers"
import type { AuditActor } from "./audit"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const SESSION_ID = "11111111-1111-4111-8111-111111111111"
const PARTICIPANT_ID = "22222222-2222-4222-8222-222222222222"

function sessionFor(role: AuditActor["role"] | null, id = "staff-1") {
  if (!role) return { user: { id: undefined, role: undefined } }
  return { user: { id, role } }
}

function engagementQuery(source: string) {
  const marker = source.indexOf("s.user_message_count")
  assert.notEqual(marker, -1)
  const selectStart = source.lastIndexOf("SELECT", marker)
  assert.notEqual(selectStart, -1)
  const end = source.indexOf("LIMIT 100", marker)
  assert.notEqual(end, -1)
  return source.slice(selectStart, end + "LIMIT 100".length)
}

describe("HIPAA-5.6.2D1 Analytics engagement list minimization", () => {
  it("list mapper keep-lists metadata and never copies summary", () => {
    const mapped = mapAnalyticsEngagementListRow({
      id: SESSION_ID,
      email: "participant@example.com",
      user_message_count: 3,
      assistant_message_count: 4,
      linked_check_in_date: "2026-09-01",
      created_at: "2026-09-01T12:00:00.000Z",
      summary: "Talked about insulin",
      messages: [{ role: "user", content: "secret transcript" }],
      userId: PARTICIPANT_ID,
    })
    assert.deepEqual(Object.keys(mapped).sort(), [
      ...ADMIN_ANALYTICS_ENGAGEMENT_LIST_FIELDS,
    ].sort())
    assert.equal("summary" in mapped, false)
    assert.equal("messages" in mapped, false)
    assert.equal("userId" in mapped, false)
    assert.equal(JSON.stringify(mapped).includes("Talked about insulin"), false)
    assert.equal(JSON.stringify(mapped).includes("secret transcript"), false)
    assert.equal(mapped.id, SESSION_ID)
    assert.equal(mapped.email, "participant@example.com")
  })

  it("detail DTO is summary only", () => {
    const detail = mapStampleySummaryDetail("Talked about insulin")
    assert.deepEqual(Object.keys(detail), [...ADMIN_STAMPLEY_SUMMARY_DETAIL_FIELDS])
    assert.equal(detail.summary, "Talked about insulin")
    assert.equal("messages" in detail, false)
    assert.equal("email" in detail, false)
    assert.equal("userId" in detail, false)
    assert.deepEqual(mapStampleySummaryDetail("   "), { summary: null })
    assert.deepEqual(mapStampleySummaryDetail(null), { summary: null })
  })

  it("Analytics engagement query selects id and does not select summary or messages", () => {
    const data = read("lib/admin-analytics-data.ts")
    const results = read("components/admin/analytics/analytics-results.tsx")
    const page = read("app/admin/analytics/page.tsx")
    const query = engagementQuery(data)
    assert.match(query, /s\.id/)
    assert.match(query, /u\.email/)
    assert.match(query, /s\.user_message_count/)
    assert.match(query, /s\.assistant_message_count/)
    assert.match(query, /LIMIT 100/)
    assert.match(query, /ORDER BY s\.created_at DESC/)
    assert.doesNotMatch(query, /s\.summary/)
    assert.doesNotMatch(query, /s\.messages/)
    assert.doesNotMatch(data, /row\.summary/)
    assert.doesNotMatch(results, /line-clamp-3/)
    assert.match(data, /mapAnalyticsEngagementListRow/)
    assert.match(results, /StampleySummaryCell/)
    assert.match(results, /sessionId=\{row\.id\}/)
    assert.match(page, /requireAdminPage\("canViewAggregateAnalytics"\)/)
    assert.match(page, /includesNarratives:\s*false/)
    assert.match(page, /ADMIN_ANALYTICS_VIEWED/)
  })

  it("leaves Analytics aggregates, filters, and coordinator identified gating unchanged", () => {
    const page = read("app/admin/analytics/page.tsx")
    const data = read("lib/admin-analytics-data.ts")
    assert.match(data, /total_stampley_sessions/)
    assert.match(data, /high_stress_checkins/)
    assert.match(page, /canViewIdentifiedAnalytics/)
    assert.match(data, /shapeAnalyticsOverview/)
    assert.match(page, /Export Stampley sessions CSV/)
    assert.doesNotMatch(page, /canViewAggregateAnalytics\s*\|\|/)
    assert.doesNotMatch(page, /canViewTranscripts\s*\|\|/)
  })
})

describe("HIPAA-5.6.2D1 Stampley summary cell", () => {
  it("fetches only after explicit click and never on mount", () => {
    const source = read("components/admin/analytics/stampley-summary-cell.tsx")
    assert.match(source, /"use client"/)
    assert.match(source, /export function StampleySummaryCell/)
    assert.match(source, /sessionId/)
    assert.match(source, /onToggleSummary/)
    assert.match(source, /\/api\/admin\/stampley-sessions\//)
    assert.match(source, /\/summary/)
    assert.match(source, /cache:\s*"no-store"/)
    assert.match(source, /if \(loading\) return/)
    assert.match(source, /View summary/)
    assert.match(source, /Hide summary/)
    assert.match(source, /Unable to load summary\./)
    assert.match(source, /Try again/)
    assert.match(source, /No summary available\./)
    assert.doesNotMatch(source, /useEffect/)
    assert.doesNotMatch(source, /useLayoutEffect/)
    assert.doesNotMatch(source, /IntersectionObserver/)
    assert.doesNotMatch(source, /prefetch/i)
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/i)
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML/)
    assert.doesNotMatch(
      source,
      /export function StampleySummaryCell\([^)]*summary/
    )
    assert.doesNotMatch(source, /messages/)
  })
})

describe("HIPAA-5.6.2D1 Stampley summary detail authorization", () => {
  it("allows ADMIN and CLINICAL_REVIEWER and denies others", () => {
    assert.equal(canReadStampleySummary("ADMIN"), true)
    assert.equal(canReadStampleySummary("CLINICAL_REVIEWER"), true)
    assert.equal(hasCapability("ADMIN", "canViewTranscripts"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewTranscripts"), true)
    assert.equal(canReadStampleySummary("STUDY_COORDINATOR"), false)
    assert.equal(canReadStampleySummary("PARTICIPANT"), false)
    assert.equal(canReadStampleySummary(null), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewTranscripts"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewAggregateAnalytics"), true)
  })

  it("rejects unauthenticated, participant, and coordinator callers before lookup", async () => {
    const loadSession = async () => {
      throw new Error("should not load")
    }
    const denied: string[] = []

    const unauth = await resolveAdminStampleySummaryGet({
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
    assert.deepEqual(unauth, { status: 401, body: STAMPLEY_SUMMARY_UNAUTHORIZED })

    const participant = await resolveAdminStampleySummaryGet({
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
    assert.deepEqual(participant, { status: 403, body: STAMPLEY_SUMMARY_FORBIDDEN })

    const coordinator = await resolveAdminStampleySummaryGet({
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
    assert.deepEqual(coordinator, { status: 403, body: STAMPLEY_SUMMARY_FORBIDDEN })
    assert.deepEqual(denied, ["PARTICIPANT", "STUDY_COORDINATOR"])
  })

  it("still denies when denied-access audit logging fails", async () => {
    const result = await resolveAdminStampleySummaryGet({
      session: sessionFor("STUDY_COORDINATOR", "c-1"),
      sessionId: SESSION_ID,
      loadSession: async () => {
        throw new Error("should not load")
      },
      recordDenied: async () => {
        throw new Error("audit log failed")
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(result, { status: 403, body: STAMPLEY_SUMMARY_FORBIDDEN })
    assert.equal(JSON.stringify(result.body).includes("Talked about insulin"), false)
  })

  it("returns a minimized summary for ADMIN and CLINICAL_REVIEWER", async () => {
    const views: Array<{ resourceId: string; subjectUserId: string }> = []
    const loadSession = async (id: string) => {
      assert.equal(id, SESSION_ID)
      return {
        id: SESSION_ID,
        userId: PARTICIPANT_ID,
        summary: "Talked about insulin",
        messages: [{ role: "user", content: "secret transcript" }],
      }
    }

    for (const role of ["ADMIN", "CLINICAL_REVIEWER"] as const) {
      views.length = 0
      const result = await resolveAdminStampleySummaryGet({
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
      assert.deepEqual(Object.keys(result.body), ["summary"])
      assert.equal("messages" in result.body, false)
      assert.equal("userId" in result.body, false)
      assert.equal("email" in result.body, false)
      assert.equal(JSON.stringify(result.body).includes("secret transcript"), false)
      assert.equal(JSON.stringify(result.body).includes("participant@example.com"), false)
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
    const malformed = await resolveAdminStampleySummaryGet({
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
    assert.deepEqual(malformed, { status: 400, body: STAMPLEY_SUMMARY_NOT_FOUND })
    assert.equal(loaded, false)
    assert.equal(viewed, false)

    const missing = await resolveAdminStampleySummaryGet({
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
    assert.deepEqual(missing, { status: 404, body: STAMPLEY_SUMMARY_NOT_FOUND })
    assert.equal(viewed, false)
  })

  it("does not return the summary when fail-closed audit persistence fails", async () => {
    const result = await resolveAdminStampleySummaryGet({
      session: sessionFor("ADMIN"),
      sessionId: SESSION_ID,
      loadSession: async () => ({
        id: SESSION_ID,
        userId: PARTICIPANT_ID,
        summary: "Talked about insulin",
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
      body: STAMPLEY_SUMMARY_GENERIC_FAILURE,
    })
    assert.equal(JSON.stringify(result.body).includes("Talked about insulin"), false)
  })
})

describe("HIPAA-5.6.2D1 Stampley summary route wiring", () => {
  it("uses canViewTranscripts, narrow Prisma select, sensitive cache, and fail-closed audit", () => {
    const route = read("app/api/admin/stampley-sessions/[id]/summary/route.ts")
    const helper = read("lib/admin-stampley-summary-get.ts")
    const transcript = read("app/api/admin/stampley-sessions/[id]/route.ts")
    assert.match(route, /resolveAdminStampleySummaryGet/)
    assert.match(route, /jsonWithSensitiveCache/)
    assert.match(route, /recordPhiPageViewOrThrow/)
    assert.match(route, /findUnique/)
    assert.match(route, /summary: true/)
    assert.match(route, /includesNarratives:\s*true/)
    assert.match(route, /includesTranscripts:\s*false/)
    assert.doesNotMatch(route, /messages:\s*true/)
    assert.doesNotMatch(route, /email:\s*true/)
    assert.doesNotMatch(route, /findMany/)
    assert.doesNotMatch(route, /canViewAggregateAnalytics/)
    assert.match(helper, /canViewTranscripts/)
    assert.match(helper, /GenericAdminFailure/)
    assert.match(transcript, /resolveAdminStampleyTranscriptGet/)
    assert.match(transcript, /messages: true/)
    assert.doesNotMatch(transcript, /summary: true/)
  })

  it("applies HIPAA-5.4 sensitive cache headers to the detail JSON", async () => {
    const response = jsonWithSensitiveCache(
      { summary: "hi" },
      { status: 200 }
    )
    assert.equal(hasSensitiveCachePolicy(response.headers), true)
    assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0")
    assert.equal(response.headers.get("Pragma"), "no-cache")
    assert.equal(response.headers.get("Expires"), "0")
  })
})
