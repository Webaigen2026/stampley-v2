import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { STUDY_TOTAL_CHECKINS } from "./check-in-utils"
import {
  calculatePhqSeverity,
  calculatePhqTotal,
  calculateSusScore,
  scorePostSurveyDds,
} from "./post-survey-scoring"
import {
  isIntegerInRange,
  isPostSurveyStudyComplete,
  isPrismaUniqueConflict,
  isReasonableEmailShape,
  needsMentalHealthFollowupFromPhq,
  parsePostSurveyPhqAnswers,
  parsePostSurveyStampleyFeedback,
  parsePostSurveySusAnswers,
  PHQ_MENTAL_HEALTH_FOLLOWUP_TOTAL_THRESHOLD,
  POST_SURVEY_CONTACT_CONSENT_REQUIRED,
  POST_SURVEY_CONTACT_EMAIL_MAX_LENGTH,
  POST_SURVEY_CONTACT_INVALID,
  POST_SURVEY_CONTACT_NAME_MAX_LENGTH,
  POST_SURVEY_CONTACT_PHONE_MAX_LENGTH,
  POST_SURVEY_REFLECTION_MAX_LENGTH,
  POST_SURVEY_REFLECTION_TOO_LONG,
  POST_SURVEY_SECTIONS_INCOMPLETE,
  POST_SURVEY_UNAUTHORIZED,
  resolvePostSurveyContactFields,
  resolvePostSurveyFormPageDestination,
  resolvePostSurveyPageSession,
  resolvePostSurveyResultsPageDestination,
  resolvePostSurveySubmitAuth,
  validatePostSurveySubmitPayload,
} from "./post-survey-submit-validation"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function completeDds(): Record<string, number> {
  const out: Record<string, number> = {}
  for (let i = 1; i <= 17; i++) out[`q${i}`] = 3
  return out
}

function completePhq(overrides: Record<string, number> = {}): Record<string, number> {
  const out: Record<string, number> = {}
  for (let i = 1; i <= 9; i++) out[`phq${i}`] = 1
  return { ...out, ...overrides }
}

function completeSus(overrides: Record<string, number> = {}): Record<string, number> {
  const out: Record<string, number> = {}
  for (let i = 1; i <= 10; i++) out[`sus${i}`] = 3
  return { ...out, ...overrides }
}

function completeStampley(
  overrides: Record<string, number> = {}
): Record<string, number> {
  const out: Record<string, number> = {}
  for (let i = 1; i <= 5; i++) out[`se${i}`] = 4
  return { ...out, ...overrides }
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    dds: completeDds(),
    phq: completePhq(),
    sus: completeSus(),
    stampley: completeStampley(),
    openReflection: "  Feeling supported overall.  ",
    futureResearchContact: true as boolean | null,
    contactName: "Alex Participant",
    contactEmail: "alex@example.test",
    contactPhone: "+1 555 0100",
    ...overrides,
  }
}

describe("post-survey submit authorization", () => {
  it("rejects unauthenticated and missing-id sessions", () => {
    assert.deepEqual(resolvePostSurveySubmitAuth(null), {
      ok: false,
      error: POST_SURVEY_UNAUTHORIZED,
    })
    assert.deepEqual(
      resolvePostSurveySubmitAuth({ user: { role: "PARTICIPANT" } }),
      { ok: false, error: POST_SURVEY_UNAUTHORIZED }
    )
    assert.deepEqual(
      resolvePostSurveySubmitAuth({
        user: { id: "", role: "PARTICIPANT" },
      }),
      { ok: false, error: POST_SURVEY_UNAUTHORIZED }
    )
  })

  it("allows PARTICIPANT and rejects ADMIN/STAFF/other roles", () => {
    assert.deepEqual(
      resolvePostSurveySubmitAuth({
        user: { id: "participant-1", role: "PARTICIPANT" },
      }),
      { ok: true, userId: "participant-1" }
    )
    for (const role of [
      "ADMIN",
      "STAFF",
      "STUDY_COORDINATOR",
      "CLINICAL_REVIEWER",
      "unknown",
      null,
    ]) {
      assert.deepEqual(
        resolvePostSurveySubmitAuth({
          user: { id: "user-1", role },
        }),
        { ok: false, error: POST_SURVEY_UNAUTHORIZED }
      )
    }
  })
})

describe("post-survey page authorization", () => {
  it("separates unauthenticated vs non-participant page sessions", () => {
    assert.deepEqual(resolvePostSurveyPageSession(null), {
      status: "unauthenticated",
    })
    assert.deepEqual(
      resolvePostSurveyPageSession({ user: { id: "a1", role: "ADMIN" } }),
      { status: "forbidden" }
    )
    assert.deepEqual(
      resolvePostSurveyPageSession({ user: { id: "s1", role: "STAFF" } }),
      { status: "forbidden" }
    )
    assert.deepEqual(
      resolvePostSurveyPageSession({
        user: { id: "p1", role: "PARTICIPANT" },
      }),
      { status: "ok", userId: "p1" }
    )
  })

  it("gates survey and results destinations by eligibility/completion", () => {
    assert.deepEqual(
      resolvePostSurveyFormPageDestination({
        studyComplete: false,
        postSurveyCompleted: false,
      }),
      { status: "redirect", to: "/dashboard" }
    )
    assert.deepEqual(
      resolvePostSurveyFormPageDestination({
        studyComplete: true,
        postSurveyCompleted: true,
      }),
      { status: "redirect", to: "/survey/post-survey/results" }
    )
    assert.deepEqual(
      resolvePostSurveyFormPageDestination({
        studyComplete: true,
        postSurveyCompleted: false,
      }),
      { status: "render" }
    )

    assert.deepEqual(
      resolvePostSurveyResultsPageDestination({
        studyComplete: false,
        postSurveyCompleted: false,
      }),
      { status: "redirect", to: "/dashboard" }
    )
    assert.deepEqual(
      resolvePostSurveyResultsPageDestination({
        studyComplete: true,
        postSurveyCompleted: false,
      }),
      { status: "redirect", to: "/survey/post-survey" }
    )
    assert.deepEqual(
      resolvePostSurveyResultsPageDestination({
        studyComplete: true,
        postSurveyCompleted: true,
      }),
      { status: "render" }
    )
  })

  it("wires pages to PARTICIPANT session helpers and own-user access", () => {
    const surveyPage = read("app/survey/post-survey/page.tsx")
    const resultsPage = read("app/survey/post-survey/results/page.tsx")
    assert.match(surveyPage, /resolvePostSurveyPageSession/)
    assert.match(surveyPage, /resolvePostSurveyFormPageDestination/)
    assert.match(surveyPage, /getPostSurveyAccessStatus\(pageSession\.userId\)/)
    assert.match(resultsPage, /resolvePostSurveyPageSession/)
    assert.match(resultsPage, /resolvePostSurveyResultsPageDestination/)
    assert.match(resultsPage, /getPostSurveyAccessStatus\(pageSession\.userId\)/)
    assert.doesNotMatch(resultsPage, /searchParams/)
    assert.doesNotMatch(resultsPage, /params\.userId/)
  })
})

describe("post-survey PHQ follow-up persistence (Phase 2.1)", () => {
  it("matches Pre-Survey rule: phq9 > 0 OR total >= 15", () => {
    const pre = read("actions/pre-survey.ts")
    assert.match(
      pre,
      /needsFollowup = Number\(data\.phq9\) > 0 \|\| phqTotal >= 15/
    )
    assert.match(pre, /needsMentalHealthFollowup: needsFollowup/)

    // LOW
    assert.equal(
      needsMentalHealthFollowupFromPhq({ phq9: 0, phqTotal: 0 }),
      false
    )
    // BOUNDARY: total=14 + phq9=0 -> false
    assert.equal(
      needsMentalHealthFollowupFromPhq({ phq9: 0, phqTotal: 14 }),
      false
    )
    // ITEM 9
    assert.equal(
      needsMentalHealthFollowupFromPhq({ phq9: 1, phqTotal: 1 }),
      true
    )
    // HIGH TOTAL / BOUNDARY: total=15 + phq9=0 -> true
    assert.equal(
      needsMentalHealthFollowupFromPhq({ phq9: 0, phqTotal: 15 }),
      true
    )
    // BOTH
    assert.equal(
      needsMentalHealthFollowupFromPhq({ phq9: 2, phqTotal: 20 }),
      true
    )
    assert.equal(PHQ_MENTAL_HEALTH_FOLLOWUP_TOTAL_THRESHOLD, 15)
  })

  it("schema + migration add nullable needs_mental_health_followup", () => {
    const schema = read("prisma/schema.prisma")
    const postModel = schema.slice(
      schema.indexOf("model PostSurveyResponse"),
      schema.indexOf("model PreSurveyResponse")
    )
    assert.match(
      postModel,
      /needsMentalHealthFollowup Boolean\? @map\("needs_mental_health_followup"\)/
    )

    const migration = read(
      "prisma/migrations/20260923011500_add_post_survey_phq_followup/migration.sql"
    )
    assert.match(
      migration,
      /ALTER TABLE "post_survey_responses"[\s\n]+ADD COLUMN "needs_mental_health_followup" BOOLEAN;/
    )
    assert.doesNotMatch(migration, /NOT NULL/)
    assert.doesNotMatch(migration, /DEFAULT/)
    assert.doesNotMatch(migration, /DROP|UPDATE|DELETE/i)
  })

  it("submit derives safety server-side and persists it; browser cannot override", () => {
    const action = read("actions/post-survey.ts")
    assert.match(action, /needsMentalHealthFollowupFromPhq/)
    assert.match(
      action,
      /needsMentalHealthFollowup = needsMentalHealthFollowupFromPhq\(\{[\s\n]*phq9: phqAnswers\.phq9,[\s\n]*phqTotal,/
    )
    assert.match(action, /needsMentalHealthFollowup,/)
    assert.match(action, /phqTotal = calculatePhqTotal\(phqAnswers\)/)
    assert.match(action, /phqSeverity = calculatePhqSeverity\(phqTotal\)/)

    // Payload type / validate path must not accept a browser safety flag
    assert.doesNotMatch(
      action,
      /data\.needsMentalHealthFollowup|input\.needsMentalHealthFollowup/
    )
    const validation = read("lib/post-survey-submit-validation.ts")
    assert.doesNotMatch(
      validation,
      /needsMentalHealthFollowup:\s*(input|data|raw)/
    )

    // Malformed / missing / decimal PHQ rejected before create
    assert.equal(parsePostSurveyPhqAnswers(completePhq({ phq1: 1.5 })), null)
    const missing9 = completePhq()
    delete missing9.phq9
    assert.equal(parsePostSurveyPhqAnswers(missing9), null)
    assert.equal(parsePostSurveyPhqAnswers(completePhq({ phq9: 1.1 })), null)
  })
})

describe("post-survey eligibility helper", () => {
  it("rejects below 20 and allows 20+", () => {
    assert.equal(STUDY_TOTAL_CHECKINS, 20)
    assert.equal(isPostSurveyStudyComplete(19), false)
    assert.equal(isPostSurveyStudyComplete(20), true)
    assert.equal(isPostSurveyStudyComplete(21), true)
    assert.equal(isPostSurveyStudyComplete(0), false)
  })
})

describe("post-survey integer/range validation", () => {
  it("rejects PHQ decimals, strings, NaN, Infinity, and out-of-range", () => {
    assert.equal(isIntegerInRange(1.5, 0, 3), false)
    assert.equal(isIntegerInRange(NaN, 0, 3), false)
    assert.equal(isIntegerInRange(Infinity, 0, 3), false)
    assert.equal(isIntegerInRange("1", 0, 3), false)
    assert.equal(parsePostSurveyPhqAnswers(completePhq({ phq1: 1.5 })), null)
    assert.equal(parsePostSurveyPhqAnswers(completePhq({ phq1: 4 })), null)
    assert.equal(parsePostSurveyPhqAnswers(completePhq({ phq9: -1 })), null)
    assert.ok(parsePostSurveyPhqAnswers(completePhq({ phq9: 3 })))
  })

  it("rejects SUS and Stampley decimals and out-of-range", () => {
    assert.equal(parsePostSurveySusAnswers(completeSus({ sus2: 2.5 })), null)
    assert.equal(parsePostSurveySusAnswers(completeSus({ sus1: 0 })), null)
    assert.equal(parsePostSurveySusAnswers(completeSus({ sus10: 6 })), null)
    assert.ok(parsePostSurveySusAnswers(completeSus()))
    assert.equal(
      parsePostSurveyStampleyFeedback(completeStampley({ se1: 3.2 })),
      null
    )
    assert.equal(
      parsePostSurveyStampleyFeedback(completeStampley({ se5: 0 })),
      null
    )
    assert.ok(parsePostSurveyStampleyFeedback(completeStampley()))
  })

  it("rejects missing keys and unknown extra keys", () => {
    const phqMissing = completePhq()
    delete phqMissing.phq9
    assert.equal(parsePostSurveyPhqAnswers(phqMissing), null)

    const phqExtra = completePhq()
    ;(phqExtra as Record<string, number>).phq10 = 1
    assert.equal(parsePostSurveyPhqAnswers(phqExtra), null)

    const susExtra = completeSus()
    ;(susExtra as Record<string, number>).extra = 1
    assert.equal(parsePostSurveySusAnswers(susExtra), null)
  })
})

describe("post-survey required fields and consent", () => {
  it("rejects missing sections and missing consent", () => {
    assert.equal(
      validatePostSurveySubmitPayload(
        validPayload({ phq: completePhq({ phq1: 1.5 }) })
      ).ok,
      false
    )
    const missingDds = validatePostSurveySubmitPayload(
      validPayload({ dds: { q1: 1 } })
    )
    assert.equal(missingDds.ok, false)
    if (!missingDds.ok) {
      assert.equal(missingDds.error, POST_SURVEY_SECTIONS_INCOMPLETE)
    }

    const missingConsent = validatePostSurveySubmitPayload(
      validPayload({ futureResearchContact: null })
    )
    assert.equal(missingConsent.ok, false)
    if (!missingConsent.ok) {
      assert.equal(missingConsent.error, POST_SURVEY_CONTACT_CONSENT_REQUIRED)
    }
  })
})

describe("post-survey reflection validation", () => {
  it("accepts optional/empty and rejects oversized", () => {
    const empty = validatePostSurveySubmitPayload(
      validPayload({ openReflection: "   " })
    )
    assert.equal(empty.ok, true)
    if (empty.ok) assert.equal(empty.data.openReflection, null)

    const ok = validatePostSurveySubmitPayload(
      validPayload({ openReflection: "Useful support." })
    )
    assert.equal(ok.ok, true)
    if (ok.ok) assert.equal(ok.data.openReflection, "Useful support.")

    const tooLong = validatePostSurveySubmitPayload(
      validPayload({
        openReflection: "x".repeat(POST_SURVEY_REFLECTION_MAX_LENGTH + 1),
      })
    )
    assert.equal(tooLong.ok, false)
    if (!tooLong.ok) {
      assert.equal(tooLong.error, POST_SURVEY_REFLECTION_TOO_LONG)
    }
  })
})

describe("post-survey contact privacy and validation", () => {
  it("forcibly nulls contacts when consent=false", () => {
    const result = resolvePostSurveyContactFields({
      futureResearchContact: false,
      contactName: "Should Not Persist",
      contactEmail: "leak@example.test",
      contactPhone: "555-0199",
    })
    assert.deepEqual(result, {
      ok: true,
      data: {
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      },
    })

    const validated = validatePostSurveySubmitPayload(
      validPayload({
        futureResearchContact: false,
        contactName: "Should Not Persist",
        contactEmail: "leak@example.test",
        contactPhone: "555-0199",
      })
    )
    assert.equal(validated.ok, true)
    if (validated.ok) {
      assert.equal(validated.data.contactName, null)
      assert.equal(validated.data.contactEmail, null)
      assert.equal(validated.data.contactPhone, null)
      assert.equal(validated.data.futureResearchContact, false)
    }
  })

  it("preserves optional contacts when consent=true and validates bounds/email", () => {
    const empty = validatePostSurveySubmitPayload(
      validPayload({
        futureResearchContact: true,
        contactName: "  ",
        contactEmail: "",
        contactPhone: "   ",
      })
    )
    assert.equal(empty.ok, true)
    if (empty.ok) {
      assert.equal(empty.data.contactName, null)
      assert.equal(empty.data.contactEmail, null)
      assert.equal(empty.data.contactPhone, null)
    }

    const preserved = validatePostSurveySubmitPayload(validPayload())
    assert.equal(preserved.ok, true)
    if (preserved.ok) {
      assert.equal(preserved.data.contactName, "Alex Participant")
      assert.equal(preserved.data.contactEmail, "alex@example.test")
      assert.equal(preserved.data.contactPhone, "+1 555 0100")
    }

    assert.equal(isReasonableEmailShape("not-an-email"), false)
    assert.equal(
      validatePostSurveySubmitPayload(
        validPayload({ contactEmail: "not-an-email" })
      ).ok,
      false
    )
    assert.equal(
      validatePostSurveySubmitPayload(
        validPayload({
          contactName: "n".repeat(POST_SURVEY_CONTACT_NAME_MAX_LENGTH + 1),
        })
      ).ok,
      false
    )
    assert.equal(
      validatePostSurveySubmitPayload(
        validPayload({
          contactPhone: "1".repeat(POST_SURVEY_CONTACT_PHONE_MAX_LENGTH + 1),
        })
      ).ok,
      false
    )
    assert.equal(
      validatePostSurveySubmitPayload(
        validPayload({
          contactEmail: `${"a".repeat(POST_SURVEY_CONTACT_EMAIL_MAX_LENGTH)}@x.co`,
        })
      ).ok,
      false
    )

    const invalid = resolvePostSurveyContactFields({
      futureResearchContact: true,
      contactName: "ok",
      contactEmail: "bad",
      contactPhone: null,
    })
    assert.equal(invalid.ok, false)
    if (!invalid.ok) assert.equal(invalid.error, POST_SURVEY_CONTACT_INVALID)
  })
})

describe("post-survey scoring authority", () => {
  it("computes DDS/PHQ/SUS from validated answers and ignores client score fields", () => {
    const validated = validatePostSurveySubmitPayload(
      validPayload({
        // Client cannot force scores through validation payload.
        ddsScores: { total: 99 },
        phqTotal: 99,
        susScore: 99,
      } as Record<string, unknown>)
    )
    assert.equal(validated.ok, true)
    if (!validated.ok) return

    const ddsScores = scorePostSurveyDds(validated.data.ddsAnswers)
    const phqTotal = calculatePhqTotal(validated.data.phqAnswers)
    const phqSeverity = calculatePhqSeverity(phqTotal)
    const susScore = calculateSusScore(validated.data.susAnswers)

    assert.equal(typeof ddsScores.total, "number")
    assert.notEqual(ddsScores.total, 99)
    assert.equal(phqTotal, 9)
    assert.equal(phqSeverity, "Mild")
    assert.equal(typeof susScore, "number")
    assert.notEqual(susScore, 99)
  })
})

describe("post-survey concurrency / unique conflict helper", () => {
  it("detects Prisma P2002 without exposing details", () => {
    assert.equal(isPrismaUniqueConflict({ code: "P2002" }), true)
    assert.equal(isPrismaUniqueConflict({ code: "P2003" }), false)
    assert.equal(isPrismaUniqueConflict(new Error("nope")), false)
    assert.equal(isPrismaUniqueConflict(null), false)
  })
})

describe("post-survey submit action wiring", () => {
  it("uses PARTICIPANT auth, create-only, unique-conflict redirect, and no upsert", () => {
    const source = read("actions/post-survey.ts")
    assert.match(source, /resolvePostSurveySubmitAuth/)
    assert.match(source, /validatePostSurveySubmitPayload/)
    assert.match(source, /getPostSurveyAccessStatus/)
    assert.match(source, /scorePostSurveyDds\(ddsAnswers\)/)
    assert.match(source, /calculatePhqTotal\(phqAnswers\)/)
    assert.match(source, /calculateSusScore\(susAnswers\)/)
    assert.match(source, /prisma\.postSurveyResponse\.create/)
    assert.match(source, /isPrismaUniqueConflict/)
    assert.match(source, /redirect\("\/survey\/post-survey\/results"\)/)
    assert.doesNotMatch(source, /\.upsert\(/)
    assert.doesNotMatch(source, /console\.log/)
  })

  it("access status uses shared study-complete helper", () => {
    const source = read("lib/post-survey-access.ts")
    assert.match(source, /isPostSurveyStudyComplete/)
    assert.doesNotMatch(
      source,
      /totalCheckins >= STUDY_TOTAL_CHECKINS/
    )
  })
})
