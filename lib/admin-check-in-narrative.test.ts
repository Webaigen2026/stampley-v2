import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { hasCapability } from "./admin-capabilities"
import { GenericAdminFailure } from "./admin-phi-page"
import {
  ADMIN_CHECK_IN_LIST_FIELDS,
  ADMIN_CHECK_IN_NARRATIVE_DETAIL_FIELDS,
  isCheckInId,
  mapAdminCheckInListRow,
  mapAdminCheckInNarrativeDetail,
} from "./admin-check-in-narratives"
import {
  canReadCheckInNarrative,
  resolveAdminCheckInNarrativeGet,
  CHECK_IN_NARRATIVE_FORBIDDEN,
  CHECK_IN_NARRATIVE_GENERIC_FAILURE,
  CHECK_IN_NARRATIVE_NOT_FOUND,
  CHECK_IN_NARRATIVE_UNAUTHORIZED,
} from "./admin-check-in-narrative-get"
import { jsonWithSensitiveCache, hasSensitiveCachePolicy } from "./sensitive-cache-headers"
import type { AuditActor } from "./audit"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const CHECK_IN_ID = "11111111-1111-4111-8111-111111111111"
const PARTICIPANT_ID = "22222222-2222-4222-8222-222222222222"

const listRow = {
  id: CHECK_IN_ID,
  email: "participant@example.com",
  checkInDate: "2026-09-01",
  createdAt: "2026-09-01T12:00:00.000Z",
  distress: 8,
  mood: 4,
  energy: 3,
  domain: "Emotional",
  subscale: "Worry",
  needsSafetyEscalation: false,
  userId: PARTICIPANT_ID,
  reflection: "I cannot sleep",
  copingAction: "Went for a walk",
  contextTags: ["work_stress"],
}

function sessionFor(role: AuditActor["role"] | null, id = "staff-1") {
  if (!role) return { user: { id: undefined, role: undefined } }
  return { user: { id, role } }
}

describe("HIPAA-5.6.2B check-in list DTO minimization", () => {
  it("list mapper keep-lists metadata and never copies reflection or coping", () => {
    const mapped = mapAdminCheckInListRow(listRow)
    assert.deepEqual(Object.keys(mapped).sort(), [...ADMIN_CHECK_IN_LIST_FIELDS].sort())
    assert.equal("reflection" in mapped, false)
    assert.equal("copingAction" in mapped, false)
    assert.equal("contextTags" in mapped, false)
    assert.equal("userId" in mapped, false)
    assert.equal(JSON.stringify(mapped).includes("I cannot sleep"), false)
    assert.equal(JSON.stringify(mapped).includes("Went for a walk"), false)
    assert.equal(mapped.email, "participant@example.com")
    assert.equal(mapped.distress, 8)
  })

  it("detail DTO is reflection and copingAction only", () => {
    const detail = mapAdminCheckInNarrativeDetail({
      reflection: "I cannot sleep",
      copingAction: "Went for a walk",
    })
    assert.deepEqual(Object.keys(detail), [...ADMIN_CHECK_IN_NARRATIVE_DETAIL_FIELDS])
    assert.equal("userId" in detail, false)
    assert.equal("email" in detail, false)
    assert.equal("studyId" in detail, false)
    assert.equal("contextTags" in detail, false)
    assert.equal("distress" in detail, false)
    assert.equal("mood" in detail, false)
    assert.equal("energy" in detail, false)
    assert.equal("domain" in detail, false)
    assert.equal(detail.reflection, "I cannot sleep")
    assert.equal(detail.copingAction, "Went for a walk")
  })

  it("admin check-in list and profile queries do not select reflection or copingAction", () => {
    const list = read("app/admin/check-ins/page.tsx")
    const profile = read("app/admin/users/[id]/page.tsx")
    assert.doesNotMatch(list, /reflection:\s*true/)
    assert.doesNotMatch(list, /copingAction:\s*true/)
    assert.doesNotMatch(list, /contextTags:\s*true/)
    assert.doesNotMatch(list, /userId:\s*true/)
    assert.match(list, /mapAdminCheckInListRow/)
    assert.match(list, /includesNarratives:\s*false/)
    assert.match(list, /CheckInNarrativeCard/)
    assert.doesNotMatch(profile, /reflection:\s*canViewNarratives/)
    assert.doesNotMatch(profile, /copingAction:\s*canViewNarratives/)
    assert.doesNotMatch(profile, /contextTags:\s*canViewNarratives/)
    assert.match(profile, /mapAdminCheckInListRow/)
    assert.match(profile, /includesNarratives:\s*false/)
    assert.match(profile, /canViewNarratives \?/)
  })

  it("CheckInNarrativeCard initial props cannot carry reflection or copingAction", () => {
    const source = read("components/admin/check-ins/check-in-narrative-card.tsx")
    assert.match(source, /checkInId/)
    assert.match(source, /onToggleNarrative/)
    assert.doesNotMatch(source, /useEffect/)
    assert.match(source, /\/api\/admin\/check-ins\//)
    assert.match(source, /cache:\s*"no-store"/)
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/i)
    assert.doesNotMatch(
      source,
      /export function CheckInNarrativeCard\([^)]*reflection/
    )
    assert.doesNotMatch(
      source,
      /export function CheckInNarrativeCard\([^)]*copingAction/
    )
  })
})

describe("HIPAA-5.6.2B check-in narrative detail authorization", () => {
  it("allows ADMIN and CLINICAL_REVIEWER and denies others", () => {
    assert.equal(canReadCheckInNarrative("ADMIN"), true)
    assert.equal(canReadCheckInNarrative("CLINICAL_REVIEWER"), true)
    assert.equal(hasCapability("ADMIN", "canViewCheckInNarratives"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewCheckInNarratives"), true)
    assert.equal(canReadCheckInNarrative("STUDY_COORDINATOR"), false)
    assert.equal(canReadCheckInNarrative("PARTICIPANT"), false)
    assert.equal(canReadCheckInNarrative(null), false)
  })

  it("rejects unauthenticated, participant, and coordinator callers before lookup", async () => {
    const loadCheckIn = async () => {
      throw new Error("should not load")
    }
    const denied: string[] = []

    const unauth = await resolveAdminCheckInNarrativeGet({
      session: null,
      checkInId: CHECK_IN_ID,
      loadCheckIn,
      recordDenied: async () => {
        denied.push("unauth")
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(unauth, { status: 401, body: CHECK_IN_NARRATIVE_UNAUTHORIZED })

    const participant = await resolveAdminCheckInNarrativeGet({
      session: sessionFor("PARTICIPANT", "p-1"),
      checkInId: CHECK_IN_ID,
      loadCheckIn,
      recordDenied: async (actor) => {
        denied.push(actor.role)
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(participant, { status: 403, body: CHECK_IN_NARRATIVE_FORBIDDEN })

    const coordinator = await resolveAdminCheckInNarrativeGet({
      session: sessionFor("STUDY_COORDINATOR", "c-1"),
      checkInId: CHECK_IN_ID,
      loadCheckIn,
      recordDenied: async (actor) => {
        denied.push(actor.role)
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(coordinator, { status: 403, body: CHECK_IN_NARRATIVE_FORBIDDEN })
    assert.deepEqual(denied, ["PARTICIPANT", "STUDY_COORDINATOR"])
  })

  it("still denies when denied-access audit logging fails", async () => {
    const result = await resolveAdminCheckInNarrativeGet({
      session: sessionFor("STUDY_COORDINATOR", "c-1"),
      checkInId: CHECK_IN_ID,
      loadCheckIn: async () => {
        throw new Error("should not load")
      },
      recordDenied: async () => {
        throw new Error("audit log failed")
      },
      recordView: async () => {
        throw new Error("should not view")
      },
    })
    assert.deepEqual(result, { status: 403, body: CHECK_IN_NARRATIVE_FORBIDDEN })
    assert.equal(JSON.stringify(result.body).includes("I cannot sleep"), false)
  })

  it("returns a minimized narrative for ADMIN and CLINICAL_REVIEWER", async () => {
    const views: Array<{ resourceId: string; subjectUserId: string }> = []
    const loadCheckIn = async (id: string) => {
      assert.equal(id, CHECK_IN_ID)
      return {
        id: CHECK_IN_ID,
        userId: PARTICIPANT_ID,
        reflection: "I cannot sleep",
        copingAction: "Went for a walk",
      }
    }

    for (const role of ["ADMIN", "CLINICAL_REVIEWER"] as const) {
      views.length = 0
      const result = await resolveAdminCheckInNarrativeGet({
        session: sessionFor(role),
        checkInId: CHECK_IN_ID,
        loadCheckIn,
        recordDenied: async () => {
          throw new Error("should not deny")
        },
        recordView: async (input) => {
          views.push(input)
        },
      })
      assert.equal(result.status, 200)
      assert.deepEqual(Object.keys(result.body), ["reflection", "copingAction"])
      assert.equal("userId" in result.body, false)
      assert.equal("email" in result.body, false)
      assert.equal("studyId" in result.body, false)
      assert.equal("contextTags" in result.body, false)
      assert.equal("distress" in result.body, false)
      assert.equal(JSON.stringify(result.body).includes("participant@example.com"), false)
      assert.deepEqual(views, [
        { resourceId: CHECK_IN_ID, subjectUserId: PARTICIPANT_ID },
      ])
    }
  })

  it("rejects malformed and missing check-in IDs without auditing a view", async () => {
    assert.equal(isCheckInId("not-a-uuid"), false)
    assert.equal(isCheckInId(CHECK_IN_ID), true)

    let loaded = false
    let viewed = false
    const malformed = await resolveAdminCheckInNarrativeGet({
      session: sessionFor("ADMIN"),
      checkInId: "not-a-uuid",
      loadCheckIn: async () => {
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
    assert.deepEqual(malformed, { status: 400, body: CHECK_IN_NARRATIVE_NOT_FOUND })
    assert.equal(loaded, false)
    assert.equal(viewed, false)

    const missing = await resolveAdminCheckInNarrativeGet({
      session: sessionFor("ADMIN"),
      checkInId: CHECK_IN_ID,
      loadCheckIn: async () => null,
      recordDenied: async () => {
        throw new Error("should not deny")
      },
      recordView: async () => {
        viewed = true
      },
    })
    assert.deepEqual(missing, { status: 404, body: CHECK_IN_NARRATIVE_NOT_FOUND })
    assert.equal(viewed, false)
  })

  it("does not return the narrative when fail-closed audit persistence fails", async () => {
    const result = await resolveAdminCheckInNarrativeGet({
      session: sessionFor("ADMIN"),
      checkInId: CHECK_IN_ID,
      loadCheckIn: async () => ({
        id: CHECK_IN_ID,
        userId: PARTICIPANT_ID,
        reflection: "I cannot sleep",
        copingAction: "Went for a walk",
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
      body: CHECK_IN_NARRATIVE_GENERIC_FAILURE,
    })
    assert.equal(JSON.stringify(result.body).includes("I cannot sleep"), false)
    assert.equal(JSON.stringify(result.body).includes("Went for a walk"), false)
  })
})

describe("HIPAA-5.6.2B check-in narrative route wiring", () => {
  it("uses capability checks, Prisma findUnique, sensitive cache, and fail-closed audit", () => {
    const route = read("app/api/admin/check-ins/[id]/route.ts")
    const helper = read("lib/admin-check-in-narrative-get.ts")
    assert.match(route, /resolveAdminCheckInNarrativeGet/)
    assert.match(route, /jsonWithSensitiveCache/)
    assert.match(route, /recordPhiPageViewOrThrow/)
    assert.match(route, /findUnique/)
    assert.match(route, /reflection: true/)
    assert.match(route, /copingAction: true/)
    assert.match(route, /includesNarratives:\s*true/)
    assert.doesNotMatch(route, /email:\s*true/)
    assert.doesNotMatch(route, /findMany/)
    assert.match(helper, /canViewCheckInNarratives/)
    assert.match(helper, /GenericAdminFailure/)
  })

  it("applies HIPAA-5.4 sensitive cache headers to the detail JSON", async () => {
    const response = jsonWithSensitiveCache(
      { reflection: "hi", copingAction: "walk" },
      { status: 200 }
    )
    assert.equal(hasSensitiveCachePolicy(response.headers), true)
    assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0")
    assert.equal(response.headers.get("Pragma"), "no-cache")
    assert.equal(response.headers.get("Expires"), "0")
  })
})
