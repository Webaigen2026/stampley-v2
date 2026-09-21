import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { hasCapability } from "./admin-capabilities"
import { GenericAdminFailure } from "./admin-phi-page"
import {
  ADMIN_POST_SURVEY_REFLECTION_DETAIL_FIELDS,
  isPostSurveyResponseId,
  mapPostSurveyReflectionDetail,
} from "./admin-post-survey-reflection"
import {
  canReadPostSurveyReflection,
  resolveAdminPostSurveyReflectionGet,
  POST_SURVEY_REFLECTION_FORBIDDEN,
  POST_SURVEY_REFLECTION_GENERIC_FAILURE,
  POST_SURVEY_REFLECTION_NOT_FOUND,
  POST_SURVEY_REFLECTION_UNAUTHORIZED,
} from "./admin-post-survey-reflection-get"
import {
  jsonWithSensitiveCache,
  hasSensitiveCachePolicy,
} from "./sensitive-cache-headers"
import type { AuditActor } from "./audit"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const RESPONSE_ID = "11111111-1111-4111-8111-111111111111"
const PARTICIPANT_ID = "22222222-2222-4222-8222-222222222222"
const REFLECTION = "The study helped me talk about insulin."

function sessionFor(role: AuditActor["role"] | null, id = "staff-1") {
  if (!role) return { user: { id: undefined, role: undefined } }
  return { user: { id, role } }
}

describe("HIPAA-5.6.2D2 Post-Survey reflection mapper", () => {
  it("validates Post-Survey response UUIDs strictly", () => {
    assert.equal(isPostSurveyResponseId(RESPONSE_ID), true)
    assert.equal(isPostSurveyResponseId("not-a-uuid"), false)
    assert.equal(isPostSurveyResponseId(""), false)
    assert.equal(isPostSurveyResponseId(null), false)
  })

  it("maps a minimized openReflection DTO and never copies extra fields", () => {
    const detail = mapPostSurveyReflectionDetail(REFLECTION)
    assert.deepEqual(Object.keys(detail), [...ADMIN_POST_SURVEY_REFLECTION_DETAIL_FIELDS])
    assert.equal(detail.openReflection, REFLECTION)
    assert.equal("id" in detail, false)
    assert.equal("userId" in detail, false)
    assert.equal("email" in detail, false)
    assert.equal("stampleyFeedback" in detail, false)
    assert.deepEqual(mapPostSurveyReflectionDetail("   "), { openReflection: null })
    assert.deepEqual(mapPostSurveyReflectionDetail(""), { openReflection: null })
    assert.deepEqual(mapPostSurveyReflectionDetail(null), { openReflection: null })
  })
})

describe("HIPAA-5.6.2D2 Post-Survey list and profile minimization", () => {
  it("list select/mapper and both admin surfaces exclude openReflection", () => {
    const helper = read("lib/admin-phi-minimization.ts")
    const list = read("app/admin/post-surveys/page.tsx")
    const profile = read("app/admin/users/[id]/page.tsx")
    const details = read("components/admin/post-surveys/post-survey-response-details.tsx")
    assert.match(helper, /stampleyFeedback:\s*caps\.canViewSurveyFreeText/)
    assert.doesNotMatch(helper, /openReflection:\s*caps\.canViewSurveyFreeText/)
    assert.doesNotMatch(helper, /mapped\.open_reflection/)
    assert.match(list, /includesNarratives:\s*false/)
    assert.match(list, /ADMIN_POST_SURVEY_LIST_VIEWED/)
    assert.match(list, /showOpenReflection=\{caps\.canViewSurveyFreeText\}/)
    assert.match(list, /responseId=/)
    assert.doesNotMatch(list, /open_reflection/)
    assert.doesNotMatch(list, /openReflection:/)
    assert.match(profile, /id:\s*canViewSurveyFreeText/)
    assert.doesNotMatch(profile, /openReflection:\s*canViewClinical/)
    assert.doesNotMatch(profile, /open_reflection/)
    assert.match(profile, /showOpenReflection=\{canViewSurveyFreeText\}/)
    assert.match(profile, /includesNarratives:\s*false/)
    assert.match(details, /PostSurveyReflectionCell/)
    assert.match(details, /showOpenReflection/)
    assert.doesNotMatch(details, /record\.open_reflection/)
    assert.match(details, /stampleyFeedback/)
  })
})

describe("HIPAA-5.6.2D2 Post-Survey reflection cell", () => {
  it("fetches only after explicit click and never on mount", () => {
    const source = read("components/admin/post-surveys/post-survey-reflection-cell.tsx")
    assert.match(source, /"use client"/)
    assert.match(source, /export function PostSurveyReflectionCell/)
    assert.match(source, /responseId/)
    assert.match(source, /\/api\/admin\/post-surveys\//)
    assert.match(source, /\/reflection/)
    assert.match(source, /cache:\s*"no-store"/)
    assert.match(source, /if \(loading\) return/)
    assert.match(source, /View reflection/)
    assert.match(source, /Hide reflection/)
    assert.match(source, /Unable to load reflection\./)
    assert.match(source, /Try again/)
    assert.match(source, /Not provided/)
    assert.match(source, /setLoaded\(true\)/)
    assert.match(source, /if \(loaded\)/)
    assert.doesNotMatch(source, /useEffect/)
    assert.doesNotMatch(source, /useLayoutEffect/)
    assert.doesNotMatch(source, /IntersectionObserver/)
    assert.doesNotMatch(source, /prefetch/i)
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/i)
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML/)
    assert.doesNotMatch(
      source,
      /export function PostSurveyReflectionCell\([^)]*openReflection/
    )
  })
})

describe("HIPAA-5.6.2D2 Post-Survey reflection authorization", () => {
  it("allows ADMIN and CLINICAL_REVIEWER and denies others", () => {
    assert.equal(canReadPostSurveyReflection("ADMIN"), true)
    assert.equal(canReadPostSurveyReflection("CLINICAL_REVIEWER"), true)
    assert.equal(hasCapability("ADMIN", "canViewSurveyFreeText"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewSurveyFreeText"), true)
    assert.equal(canReadPostSurveyReflection("STUDY_COORDINATOR"), false)
    assert.equal(canReadPostSurveyReflection("PARTICIPANT"), false)
    assert.equal(canReadPostSurveyReflection(null), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewSurveyFreeText"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewClinicalSurveyData"), false)
  })

  it("rejects unauthenticated, participant, and coordinator callers before lookup", async () => {
    const loadResponse = async () => {
      throw new Error("should not load")
    }
    const denied: string[] = []

    const unauth = await resolveAdminPostSurveyReflectionGet({
      session: null,
      responseId: RESPONSE_ID,
      loadResponse,
      recordDenied: async () => {
        denied.push("unauth")
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(unauth, {
      status: 401,
      body: POST_SURVEY_REFLECTION_UNAUTHORIZED,
    })

    const participant = await resolveAdminPostSurveyReflectionGet({
      session: sessionFor("PARTICIPANT", "p-1"),
      responseId: RESPONSE_ID,
      loadResponse,
      recordDenied: async (actor) => {
        denied.push(actor.role)
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(participant, {
      status: 403,
      body: POST_SURVEY_REFLECTION_FORBIDDEN,
    })

    const coordinator = await resolveAdminPostSurveyReflectionGet({
      session: sessionFor("STUDY_COORDINATOR", "c-1"),
      responseId: RESPONSE_ID,
      loadResponse,
      recordDenied: async (actor) => {
        denied.push(actor.role)
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(coordinator, {
      status: 403,
      body: POST_SURVEY_REFLECTION_FORBIDDEN,
    })
    assert.deepEqual(denied, ["PARTICIPANT", "STUDY_COORDINATOR"])
  })

  it("still denies when denied-access audit logging fails", async () => {
    const result = await resolveAdminPostSurveyReflectionGet({
      session: sessionFor("STUDY_COORDINATOR", "c-1"),
      responseId: RESPONSE_ID,
      loadResponse: async () => {
        throw new Error("should not load")
      },
      recordDenied: async () => {
        throw new Error("audit log failed")
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(result, {
      status: 403,
      body: POST_SURVEY_REFLECTION_FORBIDDEN,
    })
    assert.equal(JSON.stringify(result.body).includes(REFLECTION), false)
  })

  it("returns a minimized reflection for ADMIN and CLINICAL_REVIEWER", async () => {
    const views: Array<{ resourceId: string; subjectUserId: string }> = []
    const loadResponse = async (id: string) => {
      assert.equal(id, RESPONSE_ID)
      return {
        id: RESPONSE_ID,
        userId: PARTICIPANT_ID,
        openReflection: REFLECTION,
        email: "participant@example.com",
        stampleyFeedback: { se1: 4 },
      }
    }

    for (const role of ["ADMIN", "CLINICAL_REVIEWER"] as const) {
      views.length = 0
      const result = await resolveAdminPostSurveyReflectionGet({
        session: sessionFor(role),
        responseId: RESPONSE_ID,
        loadResponse,
        recordDenied: async () => {
          throw new Error("should not deny")
        },
        recordView: async (input) => {
          views.push(input)
        },
      })
      assert.equal(result.status, 200)
      assert.deepEqual(Object.keys(result.body), ["openReflection"])
      assert.equal("email" in result.body, false)
      assert.equal("userId" in result.body, false)
      assert.equal("stampleyFeedback" in result.body, false)
      assert.equal(JSON.stringify(result.body).includes("participant@example.com"), false)
      assert.deepEqual(result.body, { openReflection: REFLECTION })
      assert.deepEqual(views, [
        { resourceId: RESPONSE_ID, subjectUserId: PARTICIPANT_ID },
      ])
    }
  })

  it("rejects malformed and missing response IDs without auditing a view", async () => {
    let loaded = false
    let viewed = false
    const malformed = await resolveAdminPostSurveyReflectionGet({
      session: sessionFor("ADMIN"),
      responseId: "not-a-uuid",
      loadResponse: async () => {
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
    assert.deepEqual(malformed, {
      status: 400,
      body: POST_SURVEY_REFLECTION_NOT_FOUND,
    })
    assert.equal(loaded, false)
    assert.equal(viewed, false)

    const missing = await resolveAdminPostSurveyReflectionGet({
      session: sessionFor("ADMIN"),
      responseId: RESPONSE_ID,
      loadResponse: async () => null,
      recordDenied: async () => {
        throw new Error("should not deny")
      },
      recordView: async () => {
        viewed = true
      },
    })
    assert.deepEqual(missing, {
      status: 404,
      body: POST_SURVEY_REFLECTION_NOT_FOUND,
    })
    assert.equal(viewed, false)
  })

  it("does not return the reflection when fail-closed audit persistence fails", async () => {
    const result = await resolveAdminPostSurveyReflectionGet({
      session: sessionFor("ADMIN"),
      responseId: RESPONSE_ID,
      loadResponse: async () => ({
        id: RESPONSE_ID,
        userId: PARTICIPANT_ID,
        openReflection: REFLECTION,
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
      body: POST_SURVEY_REFLECTION_GENERIC_FAILURE,
    })
    assert.equal(JSON.stringify(result.body).includes(REFLECTION), false)
  })
})

describe("HIPAA-5.6.2D2 Post-Survey reflection route wiring", () => {
  it("uses canViewSurveyFreeText, narrow Prisma select, sensitive cache, and fail-closed audit", () => {
    const route = read("app/api/admin/post-surveys/[id]/reflection/route.ts")
    const helper = read("lib/admin-post-survey-reflection-get.ts")
    const transcript = read("app/api/admin/stampley-sessions/[id]/route.ts")
    const summary = read("app/api/admin/stampley-sessions/[id]/summary/route.ts")
    const checkIn = read("app/api/admin/check-ins/[id]/route.ts")
    const safety = read("app/admin/safety/page.tsx")
    assert.match(route, /resolveAdminPostSurveyReflectionGet/)
    assert.match(route, /jsonWithSensitiveCache/)
    assert.match(route, /recordPhiPageViewOrThrow/)
    assert.match(route, /findUnique/)
    assert.match(route, /openReflection:\s*true/)
    assert.match(route, /includesNarratives:\s*true/)
    assert.match(route, /ADMIN_POST_SURVEY_LIST_VIEWED/)
    assert.match(route, /resourceType:\s*"POST_SURVEY"/)
    assert.doesNotMatch(route, /stampleyFeedback:\s*true/)
    assert.doesNotMatch(route, /email:\s*true/)
    assert.doesNotMatch(route, /ddsAnswers:\s*true/)
    assert.doesNotMatch(route, /include:/)
    assert.doesNotMatch(route, /canViewClinicalSurveyData/)
    assert.doesNotMatch(route, /canViewAggregateAnalytics/)
    assert.match(helper, /canViewSurveyFreeText/)
    assert.match(helper, /GenericAdminFailure/)
    assert.match(transcript, /resolveAdminStampleyTranscriptGet/)
    assert.match(summary, /resolveAdminStampleySummaryGet/)
    assert.match(checkIn, /resolveAdminCheckInNarrativeGet/)
    assert.match(safety, /SafetyReflectionCell/)
  })

  it("applies HIPAA-5.4 sensitive cache headers to the detail JSON", async () => {
    const response = jsonWithSensitiveCache(
      { openReflection: "hi" },
      { status: 200 }
    )
    assert.equal(hasSensitiveCachePolicy(response.headers), true)
    assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0")
    assert.equal(response.headers.get("Pragma"), "no-cache")
    assert.equal(response.headers.get("Expires"), "0")
  })
})
