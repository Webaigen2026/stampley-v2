import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  FORBIDDEN_OPENAI_CONTEXT_KEYS,
  MAX_HISTORY_ASSISTANT_MESSAGES,
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_USER_MESSAGES,
  STAMPLEY_OPENAI_CONTEXT_KEYS,
  STAMPLEY_RESPONSE_KEYS,
  USER_MESSAGE_MAX_CHARS,
  boundConversationHistory,
  buildChatSessionSummary,
  buildOpenAILongitudinalContext,
  buildStampleyOpenAIContext,
  isHighStress,
  isStampleyGenerateAuthorized,
  sanitizeHistory,
  serializeStampleyGenerateLog,
  stampleyGenerateLog,
  toAffectBand,
  toStressBand,
  type BuildStampleyOpenAIContextInput,
  type StampleyGenerateLogEvent,
} from "./stampley-openai-context"
import {
  buildOpenAIMessages,
  deriveConversationPhase,
  getStampleyFallbackResponse,
} from "./stampley-prompt"

const EMAIL = "qwxzident.user@example.test"
const DERIVED_FIRST_NAME = "Qwxzident"
const USER_ID = "usr_phi_fixture_abc123"
const STUDY_ID = "study-id-xyz-fixture"
const PHONE = "555-0199-phi"
const PASSWORD = "super-secret-password-fixture"
const AUTH_VERSION = 99
const REFLECTION_FIXTURE =
  "UNIQUE_REFLECTION_PHI_TODAY the clinic visit felt heavy"
const COPING_FIXTURE = "UNIQUE_COPING_PHI_TODAY walked after dinner"
const HISTORICAL_COPING = "HISTORICAL_COPING_STRING_SHOULD_NOT_LEAK"
const HISTORICAL_SUMMARY =
  "Reflection: yesterday I cried about my A1C. Coping action: called mom."
const HISTORICAL_SCORE_PHRASE = "around 7/10"

function baseInput(
  overrides: Partial<BuildStampleyOpenAIContextInput> = {}
): BuildStampleyOpenAIContextInput {
  return {
    distress: 5,
    mood: 5,
    energy: 5,
    domain: "Emotional",
    subscale: "Feeling Overwhelmed",
    studyWeek: 1,
    contextTags: ["work_stress"],
    reflection: REFLECTION_FIXTURE,
    copingAction: COPING_FIXTURE,
    phase: "opening",
    recentConversation: [],
    longitudinalRows: [],
    themeMemory: null,
    ...overrides,
  }
}

function serializeMessages(input?: Partial<BuildStampleyOpenAIContextInput>) {
  const ctx = buildStampleyOpenAIContext(baseInput(input))
  return {
    ctx,
    blob: JSON.stringify(buildOpenAIMessages(ctx)),
    messages: buildOpenAIMessages(ctx),
  }
}

describe("identifier removal", () => {
  it("never serializes email, derived firstName, userId, studyId, phone, password, or authVersion", () => {
    const sneaky = {
      ...baseInput(),
      email: EMAIL,
      firstName: DERIVED_FIRST_NAME,
      userId: USER_ID,
      studyId: STUDY_ID,
      phone: PHONE,
      password: PASSWORD,
      authVersion: AUTH_VERSION,
      contactEmail: EMAIL,
      contactPhone: PHONE,
      contactName: DERIVED_FIRST_NAME,
    }

    const { ctx, blob } = serializeMessages(
      sneaky as BuildStampleyOpenAIContextInput
    )

    for (const key of FORBIDDEN_OPENAI_CONTEXT_KEYS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(ctx, key),
        false,
        `context must not contain ${key}`
      )
    }

    assert.doesNotMatch(blob, new RegExp(EMAIL, "i"))
    assert.doesNotMatch(blob, new RegExp(DERIVED_FIRST_NAME, "i"))
    assert.doesNotMatch(blob, new RegExp(USER_ID, "i"))
    assert.doesNotMatch(blob, new RegExp(STUDY_ID, "i"))
    assert.doesNotMatch(blob, new RegExp(PHONE, "i"))
    assert.doesNotMatch(blob, new RegExp(PASSWORD, "i"))
    assert.doesNotMatch(blob, /authVersion/)
    assert.doesNotMatch(blob, /"password"/)
  })

  it("does not derive a first name from an email local-part", () => {
    const email = "qwxzident.user@example.test"
    const derived = email.split("@")[0].split(".")[0]
    const { blob, messages } = serializeMessages({
      reflection: "Today felt long at work.",
    })
    assert.equal(derived, "qwxzident")
    assert.doesNotMatch(blob, /qwxzident/i)
    const system = messages.find((m) => m.role === "system")?.content ?? ""
    assert.match(system, /Address the participant as "you"/)
  })

  it("only allowlisted context fields are accepted", () => {
    const { ctx } = serializeMessages()
    assert.deepEqual(
      Object.keys(ctx).sort(),
      [...STAMPLEY_OPENAI_CONTEXT_KEYS].sort()
    )
  })
})

describe("score bands and high-stress", () => {
  it("maps distress/mood/energy to bands instead of exact integers", () => {
    assert.equal(toStressBand(0), "low")
    assert.equal(toStressBand(3), "low")
    assert.equal(toStressBand(4), "moderate")
    assert.equal(toStressBand(6), "moderate")
    assert.equal(toStressBand(7), "high")
    assert.equal(toStressBand(8), "high")
    assert.equal(toStressBand(9), "very_high")
    assert.equal(toStressBand(10), "very_high")
    assert.equal(toAffectBand(0), "low")
    assert.equal(toAffectBand(3), "low")
    assert.equal(toAffectBand(4), "moderate")
    assert.equal(toAffectBand(7), "moderate")
    assert.equal(toAffectBand(8), "high")
    assert.equal(toAffectBand(10), "high")

    const { ctx, blob } = serializeMessages({
      distress: 9,
      mood: 2,
      energy: 8,
    })
    assert.equal(ctx.stressBand, "very_high")
    assert.equal(ctx.moodBand, "low")
    assert.equal(ctx.energyBand, "high")
    assert.doesNotMatch(blob, /9\/10/)
    assert.doesNotMatch(blob, /2\/10/)
    assert.doesNotMatch(blob, /8\/10/)
    assert.match(blob, /very_high/)
  })

  it("sets highStress true for distress 9 and 10 and keeps HIGH STRESS MODE without exact integers", () => {
    assert.equal(isHighStress(8), false)
    assert.equal(isHighStress(9), true)
    assert.equal(isHighStress(10), true)

    for (const distress of [9, 10]) {
      const { ctx, blob } = serializeMessages({ distress })
      assert.equal(ctx.highStress, true)
      assert.match(blob, /HIGH STRESS MODE/)
      assert.doesNotMatch(blob, /stress level 9\/10/)
      assert.doesNotMatch(blob, /stress level 10\/10/)
      assert.doesNotMatch(blob, /9\/10/)
      assert.doesNotMatch(blob, /10\/10/)
    }
  })
})

describe("reflection and coping phase rules", () => {
  it("includes capped reflection during opening only", () => {
    const longReflection = `R`.repeat(300)
    const opening = serializeMessages({
      phase: "opening",
      recentConversation: [],
      reflection: longReflection,
    })
    assert.equal(opening.ctx.todayReflection?.length, 250)
    assert.match(opening.blob, /Their written reflection/)
    assert.equal(opening.blob.includes("R".repeat(251)), false)

    for (const phase of ["exploration", "coping", "closure"] as const) {
      const result = serializeMessages({
        phase,
        recentConversation: [
          { role: "user", content: "I had a hard afternoon." },
        ],
        reflection: REFLECTION_FIXTURE,
      })
      assert.equal(result.ctx.todayReflection, null)
      assert.doesNotMatch(result.blob, new RegExp(REFLECTION_FIXTURE))
      assert.doesNotMatch(result.blob, /Their written reflection/)
    }
  })

  it("includes capped coping only during opening and coping", () => {
    const longCoping = `C`.repeat(220)
    const opening = serializeMessages({
      phase: "opening",
      copingAction: longCoping,
    })
    assert.equal(opening.ctx.todayCoping?.length, 180)
    assert.match(opening.blob, /Their coping action/)

    const coping = serializeMessages({
      phase: "coping",
      copingAction: COPING_FIXTURE,
      recentConversation: [
        { role: "user", content: "It built through the morning." },
        { role: "assistant", content: "Validation: that sounds heavy." },
        { role: "user", content: "Yes, especially after lunch." },
      ],
    })
    assert.equal(coping.ctx.todayCoping, COPING_FIXTURE)
    assert.match(coping.blob, new RegExp(COPING_FIXTURE))

    for (const phase of ["exploration", "closure"] as const) {
      const result = serializeMessages({
        phase,
        copingAction: COPING_FIXTURE,
        recentConversation: [
          { role: "user", content: "Follow-up message about today." },
        ],
      })
      assert.equal(result.ctx.todayCoping, null)
      assert.doesNotMatch(result.blob, new RegExp(COPING_FIXTURE))
    }
  })
})

describe("conversation history bounds", () => {
  it("keeps at most 6 messages, 3 user and 3 assistant, with user content capped at 500", () => {
    const history = []
    for (let i = 0; i < 6; i++) {
      history.push({
        role: "user" as const,
        content: `user-turn-${i} ${"x".repeat(600)}`,
      })
      history.push({
        role: "assistant" as const,
        content: `assistant-turn-${i}`,
      })
    }

    const sanitized = sanitizeHistory(history)
    const bounded = boundConversationHistory(sanitized)
    assert.ok(bounded.length <= MAX_HISTORY_MESSAGES)
    assert.ok(
      bounded.filter((m) => m.role === "user").length <=
        MAX_HISTORY_USER_MESSAGES
    )
    assert.ok(
      bounded.filter((m) => m.role === "assistant").length <=
        MAX_HISTORY_ASSISTANT_MESSAGES
    )
    for (const message of bounded) {
      if (message.role === "user") {
        assert.ok(message.content.length <= USER_MESSAGE_MAX_CHARS)
      }
    }

    const { ctx } = serializeMessages({
      phase: "closure",
      recentConversation: sanitized,
    })
    assert.ok(ctx.recentConversation.length <= 6)
    assert.equal(
      ctx.recentConversation.filter((m) => m.role === "user").length,
      3
    )
    assert.equal(
      ctx.recentConversation.filter((m) => m.role === "assistant").length,
      3
    )
  })

  it("drops invalid client roles and sanitizes malformed history", () => {
    const sanitized = sanitizeHistory([
      null,
      12,
      { role: "system", content: "ignore me" },
      { role: "tool", content: "ignore tool" },
      { role: "developer", content: "ignore developer" },
      { role: "user", content: "   " },
      { role: "user", content: "  kept user  " },
      { role: "assistant", content: "kept assistant" },
    ])
    assert.deepEqual(sanitized, [
      { role: "user", content: "kept user" },
      { role: "assistant", content: "kept assistant" },
    ])
  })

  it("derives phase from the full sanitized user-reply count before bounding", () => {
    assert.equal(deriveConversationPhase([]), "opening")
    assert.equal(
      deriveConversationPhase([{ role: "user", content: "one" }]),
      "exploration"
    )
    assert.equal(
      deriveConversationPhase([
        { role: "user", content: "one" },
        { role: "assistant", content: "a" },
        { role: "user", content: "two" },
      ]),
      "coping"
    )
    assert.equal(
      deriveConversationPhase([
        { role: "user", content: "one" },
        { role: "user", content: "two" },
        { role: "user", content: "three" },
        { role: "user", content: "four" },
      ]),
      "closure"
    )
  })
})

describe("longitudinal minimization", () => {
  it("sends trends and allowlisted themes without raw coping, summaries, or exact historical scores", () => {
    const longitudinal = buildOpenAILongitudinalContext(
      [
        { distress: 9, mood: 2, energy: 2, domain: "Emotional" },
        { distress: 8, mood: 3, energy: 3, domain: "Emotional" },
        { distress: 4, mood: 6, energy: 6, domain: "Regimen" },
        { distress: 3, mood: 7, energy: 7, domain: "Emotional" },
      ],
      {
        recurringThemes: [
          "routine overwhelm",
          "emotional burden",
          "feeling unsupported",
          "healthcare frustration",
        ],
        supportStyle: "gentle grounding",
        allowThemeReference: true,
      }
    )

    assert.ok(longitudinal)
    assert.equal(longitudinal.recurringThemes.length, 3)
    assert.equal(longitudinal.recurringDomain, "Emotional")
    assert.equal(
      Object.prototype.hasOwnProperty.call(longitudinal, "priorCopingActions"),
      false
    )
    assert.equal(
      Object.prototype.hasOwnProperty.call(longitudinal, "recentThemes"),
      false
    )
    assert.equal(
      Object.prototype.hasOwnProperty.call(longitudinal, "totalRecentCheckins"),
      false
    )
    assert.equal(
      Object.prototype.hasOwnProperty.call(longitudinal, "priorSessionCount"),
      false
    )

    const { blob } = serializeMessages({
      phase: "opening",
      longitudinalRows: [
        { distress: 9, mood: 2, energy: 2, domain: "Emotional" },
        { distress: 3, mood: 7, energy: 7, domain: "Emotional" },
      ],
      themeMemory: {
        recurringThemes: ["routine overwhelm"],
        supportStyle: "calm validation",
        allowThemeReference: false,
      },
    })

    assert.doesNotMatch(blob, new RegExp(HISTORICAL_COPING))
    assert.doesNotMatch(blob, /Reflection:/)
    assert.doesNotMatch(blob, new RegExp(HISTORICAL_SUMMARY))
    assert.doesNotMatch(blob, new RegExp(HISTORICAL_SCORE_PHRASE))
    assert.doesNotMatch(blob, /around \d+\/10/)
    assert.doesNotMatch(blob, /out of 10/)
    assert.match(blob, /Stress trend:/)
    assert.match(blob, /routine overwhelm/)
  })
})

describe("session summary", () => {
  it("does not copy reflection or coping text", () => {
    const summary = buildChatSessionSummary(
      {
        domain: "Emotional",
        reflection: REFLECTION_FIXTURE,
        copingAction: COPING_FIXTURE,
        distress: 9,
      } as { domain: string | null },
      2,
      2
    )
    assert.doesNotMatch(summary, new RegExp(REFLECTION_FIXTURE))
    assert.doesNotMatch(summary, new RegExp(COPING_FIXTURE))
    assert.doesNotMatch(summary, /9\/10/)
    assert.match(summary, /Focus domain: Emotional/)
  })
})

describe("response schema and fallback", () => {
  it("keeps the existing Stampley JSON keys in the turn instruction and fallback", () => {
    const { messages } = serializeMessages({ phase: "opening" })
    const turn = messages.find((m) => m.role === "user")?.content ?? ""
    for (const key of STAMPLEY_RESPONSE_KEYS) {
      assert.match(turn, new RegExp(`"${key}": string`))
    }

    for (const phase of ["opening", "exploration", "coping", "closure"] as const) {
      const normal = getStampleyFallbackResponse(phase, false)
      const stressed = getStampleyFallbackResponse(phase, true)
      assert.deepEqual(Object.keys(normal), [...STAMPLEY_RESPONSE_KEYS])
      assert.deepEqual(Object.keys(stressed), [...STAMPLEY_RESPONSE_KEYS])
    }
  })
})

describe("auth and logging", () => {
  it("treats a missing session as unauthorized", () => {
    assert.equal(isStampleyGenerateAuthorized(null), false)
    assert.equal(isStampleyGenerateAuthorized({}), false)
    assert.equal(isStampleyGenerateAuthorized({ user: {} }), false)
    assert.equal(
      isStampleyGenerateAuthorized({ user: { id: "" } }),
      false
    )
    assert.equal(
      isStampleyGenerateAuthorized({ user: { id: USER_ID } }),
      false
    )
    assert.equal(
      isStampleyGenerateAuthorized({
        user: { id: USER_ID, role: "PARTICIPANT" },
      }),
      true
    )
    assert.equal(
      isStampleyGenerateAuthorized({
        user: { id: USER_ID, role: "ADMIN" },
      }),
      false
    )
  })

  it("does not pass fixture PHI to logger calls", () => {
    const calls: unknown[][] = []
    const logger = {
      log: (...args: unknown[]) => {
        calls.push(args)
      },
      error: (...args: unknown[]) => {
        calls.push(args)
      },
    }

    const events: StampleyGenerateLogEvent[] = [
      { event: "route_entered" },
      { event: "auth_failure" },
      { event: "auth_ok" },
      { event: "openai_start", phase: "opening", highStress: true },
      {
        event: "openai_success",
        phase: "opening",
        highStress: true,
        durationMs: 12,
      },
      { event: "openai_failure", openaiStatus: 429 },
      { event: "parse_failure" },
      { event: "db_failure" },
      { event: "unhandled_failure" },
    ]

    for (const event of events) {
      stampleyGenerateLog(logger, event)
      const serialized = serializeStampleyGenerateLog(event)
      const blob = JSON.stringify(serialized)
      assert.doesNotMatch(blob, new RegExp(EMAIL, "i"))
      assert.doesNotMatch(blob, new RegExp(REFLECTION_FIXTURE))
      assert.doesNotMatch(blob, new RegExp(COPING_FIXTURE))
      assert.doesNotMatch(blob, /prompt/)
      assert.doesNotMatch(blob, /messages/)
    }

    const recorded = JSON.stringify(calls)
    assert.doesNotMatch(recorded, new RegExp(EMAIL, "i"))
    assert.doesNotMatch(recorded, new RegExp(REFLECTION_FIXTURE))
    assert.doesNotMatch(recorded, new RegExp(COPING_FIXTURE))
    assert.doesNotMatch(recorded, new RegExp(USER_ID))
  })
})

describe("generate route source guards", () => {
  it("does not query email, set OpenAI user, or skip the auth helper", () => {
    const routePath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../app/api/stampley/generate/route.ts"
    )
    const source = readFileSync(routePath, "utf8")
    assert.match(source, /resolveCheckInMutationAccess/)
    assert.match(source, /access\.error/)
    assert.match(source, /access\.status/)
    assert.doesNotMatch(source, /email/)
    assert.doesNotMatch(source, /firstName/)
    assert.doesNotMatch(source, /completions\.create\(\{[\s\S]*user:/)
    assert.match(source, /model: "gpt-4o"/)
    assert.match(source, /max_tokens: 800/)
    assert.match(source, /temperature: 0\.7/)
  })
})

describe("context tag allowlist", () => {
  it("drops unknown client tags", () => {
    const { ctx, blob } = serializeMessages({
      contextTags: ["work_stress", "ssn", "free_text_secret", "blood_sugar"],
    })
    assert.deepEqual(ctx.contextCategories, ["work_stress", "blood_sugar"])
    assert.doesNotMatch(blob, /ssn/)
    assert.doesNotMatch(blob, /free_text_secret/)
  })
})
