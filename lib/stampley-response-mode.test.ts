import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildStampleyTurnInstruction,
  buildOpenAIMessages,
  getStampleyFallbackResponse,
  type StampleyOpenAIContext,
} from "./stampley-prompt"
import {
  isExplicitClosingIntent,
  isPersonalizedMedicalDecisionRequest,
  isPracticalSupportRequest,
  selectStampleyResponseMode,
} from "./stampley-response-mode"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function baseCtx(
  phase: StampleyOpenAIContext["phase"]
): StampleyOpenAIContext {
  return {
    phase,
    supportDomain: "Emotional",
    subscale: "",
    studyWeek: 1,
    stressBand: "moderate",
    moodBand: "moderate",
    energyBand: "moderate",
    highStress: false,
    contextCategories: [],
    todayReflection: null,
    todayCoping: null,
    longitudinal: null,
    recentConversation: [],
  }
}

describe("practical-support detector", () => {
  const positives = [
    "What should I do?",
    "What can I do right now?",
    "What do you recommend?",
    "What are your advice?",
    "Can you give me some advice?",
    "How can I handle this?",
    "What should I ask my doctor?",
    "What else can I do?",
    "Any suggestions?",
    "What can I try today?",
    "Is there anything I can do?",
    "Any tips?",
    "Do you have ideas?",
    "What would help?",
    "What can help me?",
    "How do I deal with this?",
    "What should I try?",
    "What can I ask my doctor?",
    "Is there anything that might help?",
    "What can I do today?",
  ]

  for (const text of positives) {
    it(`matches practical request: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const negatives = [
    "I should do better.",
    "My doctor told me what to do.",
    "I can do this.",
    "I don't know what to do anymore.",
    "What do you mean?",
    "Really?",
    "Why do I feel like this?",
  ]

  for (const text of negatives) {
    it(`does not match non-request: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), false)
    })
  }
})

describe("medical-boundary detector", () => {
  const positives = [
    "Should I increase my insulin?",
    "Should I change my medication?",
    "Should I stop taking metformin?",
    "How much insulin should I take?",
    "What dose should I take?",
    "Can you diagnose this?",
    "Should I lower my insulin?",
    "Do I need a different medication?",
    "Can I take more insulin?",
    "Can I take less insulin?",
    "Should I take more insulin?",
    "Should I take less insulin?",
    "Would it help to take more insulin?",
    "What should I do about my insulin dose?",
    "What should I do about my medication dose?",
    "Can I change my dose?",
    "Should I change my dose?",
    "Can I take a higher dose?",
    "Can I take a lower dose?",
  ]

  for (const text of positives) {
    it(`matches medical decision: ${text}`, () => {
      assert.equal(isPersonalizedMedicalDecisionRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "MEDICAL_BOUNDARY"
      )
    })
  }

  const negatives = [
    "What should I ask my doctor?",
    "How can I remember my medication?",
    "I missed my medication and feel frustrated.",
    "What does blood sugar mean?",
    "Can you explain insulin?",
    "What does insulin do?",
    "My doctor changed my medication.",
    "What should I write down for my appointment?",
  ]

  for (const text of negatives) {
    it(`does not match non-decision medical topic: ${text}`, () => {
      assert.equal(isPersonalizedMedicalDecisionRequest(text), false)
    })
  }

  it("routes ask-doctor to PRACTICAL_SUPPORT not MEDICAL_BOUNDARY", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "What should I ask my doctor?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
  })
})

describe("closing-intent detector", () => {
  const positives = [
    "Thanks, that's all.",
    "That's all I wanted to talk about.",
    "I'm done.",
    "That's it for today.",
    "No, that's all.",
    "I think I'm good now.",
  ]

  for (const text of positives) {
    it(`matches closing intent: ${text}`, () => {
      assert.equal(isExplicitClosingIntent(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "CLOSE"
      )
    })
  }

  it("practical request overrides closing language", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Thanks, but what should I do tomorrow?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I'm good, but what should I ask my doctor?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "That's helpful. What else can I do?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
  })
})

describe("response-mode precedence", () => {
  it("medical + practical -> MEDICAL_BOUNDARY", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText:
          "What should I do, should I increase my insulin?",
        phase: "closure",
      }),
      "MEDICAL_BOUNDARY"
    )
  })

  it("closure phase + practical -> PRACTICAL_SUPPORT", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "What should I ask my doctor tomorrow?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "What can I actually do today?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
  })

  it("closure phase + medical -> MEDICAL_BOUNDARY", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Should I increase my insulin?",
        phase: "closure",
      }),
      "MEDICAL_BOUNDARY"
    )
  })

  it("closure phase + explicit close -> CLOSE", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Thanks, that's all.",
        phase: "closure",
      }),
      "CLOSE"
    )
  })

  it("phase defaults without strong intent", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I'm exhausted from dealing with my blood sugar.",
        phase: "opening",
      }),
      "EMPATHY"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "The pressure built slowly today.",
        phase: "exploration",
      }),
      "REFLECT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Still feeling worn down.",
        phase: "coping",
      }),
      "REFLECT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Just reflecting on the day.",
        phase: "closure",
      }),
      "CLOSE"
    )
  })

  it("greeting / empty text uses phase default only", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: null,
        phase: "opening",
      }),
      "EMPATHY"
    )
  })
})

describe("response-mode prompt priority", () => {
  it("PRACTICAL_SUPPORT overrides closure-phase wrap-up instructions", () => {
    const instruction = buildStampleyTurnInstruction(
      baseCtx("closure"),
      "PRACTICAL_SUPPORT"
    )
    assert.match(instruction, /RESPONSE MODE: PRACTICAL_SUPPORT/)
    assert.match(instruction, /overrides phase pacing/i)
    assert.match(instruction, /Answer the newest actionable request first/)
    assert.match(instruction, /1–3 bounded, non-clinical practical options/)
    assert.match(instruction, /at most ONE/)
    assert.match(instruction, /NEVER diagnose, prescribe, recommend dose/)
    assert.doesNotMatch(instruction, /CLOSURE goal: emotional release/)
    assert.doesNotMatch(
      instruction,
      /You do not need to solve everything tonight/
    )
  })

  it("MEDICAL_BOUNDARY stays dominant under closure phase", () => {
    const instruction = buildStampleyTurnInstruction(
      baseCtx("closure"),
      "MEDICAL_BOUNDARY"
    )
    assert.match(instruction, /RESPONSE MODE: MEDICAL_BOUNDARY/)
    assert.match(instruction, /Do NOT diagnose, prescribe, recommend a dose/)
    assert.match(instruction, /clinician, care team, or pharmacist/)
    assert.match(instruction, /useful non-prescriptive next steps/)
    assert.match(instruction, /NEVER diagnose or give medical treatment advice/)
    assert.doesNotMatch(instruction, /CLOSURE goal: emotional release/)
  })

  it("CLOSE keeps no-diagnosis constraints", () => {
    const instruction = buildStampleyTurnInstruction(baseCtx("closure"), "CLOSE")
    assert.match(instruction, /RESPONSE MODE: CLOSE/)
    assert.match(instruction, /NEVER diagnose or give medical treatment advice/)
  })

  it("buildOpenAIMessages embeds selected mode in turn instruction", () => {
    const messages = buildOpenAIMessages(baseCtx("closure"), "PRACTICAL_SUPPORT")
    const turn = messages[messages.length - 1]
    assert.equal(turn?.role, "user")
    assert.match(String(turn?.content), /RESPONSE MODE: PRACTICAL_SUPPORT/)
  })

  it("highStress preserves PRACTICAL_SUPPORT mode semantics", () => {
    const ctx = { ...baseCtx("closure"), highStress: true }
    const instruction = buildStampleyTurnInstruction(ctx, "PRACTICAL_SUPPORT")
    assert.match(instruction, /RESPONSE MODE: PRACTICAL_SUPPORT/)
    assert.match(instruction, /HIGH STRESS \+ PRACTICAL/)
    assert.match(instruction, /still answer the actionable request/)
  })

  it("highStress preserves MEDICAL_BOUNDARY mode semantics", () => {
    const ctx = { ...baseCtx("closure"), highStress: true }
    const instruction = buildStampleyTurnInstruction(ctx, "MEDICAL_BOUNDARY")
    assert.match(instruction, /RESPONSE MODE: MEDICAL_BOUNDARY/)
    assert.match(instruction, /HIGH STRESS \+ MEDICAL_BOUNDARY/)
    assert.match(instruction, /still refuse personalized treatment/)
  })
})

describe("authoritative participant-text wiring", () => {
  it("mode follows persisted authoritative text, not a differing request body", () => {
    const requestBodyText = "What should I do?"
    const persistedAuthoritativeText = "Should I increase my insulin?"

    assert.equal(isPracticalSupportRequest(requestBodyText), true)
    assert.equal(
      selectStampleyResponseMode({
        participantText: persistedAuthoritativeText,
        phase: "closure",
      }),
      "MEDICAL_BOUNDARY"
    )
    assert.notEqual(
      selectStampleyResponseMode({
        participantText: requestBodyText,
        phase: "closure",
      }),
      selectStampleyResponseMode({
        participantText: persistedAuthoritativeText,
        phase: "closure",
      })
    )
  })

  it("generate route selects mode from persisted participantContent", () => {
    const route = read("app/api/stampley/generate/route.ts")
    assert.match(route, /selectStampleyResponseMode/)
    assert.match(route, /authoritativeParticipantText = persisted\.participantContent/)
    assert.match(
      route,
      /participantText: authoritativeParticipantText/
    )
    assert.doesNotMatch(
      route,
      /selectStampleyResponseMode\(\{[\s\S]*messageHistory/
    )
    assert.match(route, /buildOpenAIMessages\(openaiContext, responseMode\)/)
    assert.match(
      route,
      /getStampleyFallbackResponse\(\s*openaiContext\.phase,\s*openaiContext\.highStress,\s*responseMode/
    )
    assert.match(
      route,
      /highStress remains an independent tone modifier/
    )
  })
})

describe("mode-aware fallbacks", () => {
  it("PRACTICAL_SUPPORT fallback is useful and non-clinical", () => {
    const fb = getStampleyFallbackResponse("closure", false, "PRACTICAL_SUPPORT")
    assert.match(fb.validation, /concrete|workable|looking for/i)
    assert.ok(
      fb.micro_skill.trim().length > 0 || fb.education_chip.trim().length > 0
    )
    const joined = Object.values(fb).join(" ").toLowerCase()
    assert.doesNotMatch(joined, /\b(units?|mg|increase your|stop taking|diagnose)\b/)
    assert.equal(fb.reflection_question, "")
  })

  it("MEDICAL_BOUNDARY fallback refuses treatment and gives care-team next step", () => {
    const fb = getStampleyFallbackResponse("closure", false, "MEDICAL_BOUNDARY")
    assert.match(fb.validation, /can'?t advise|cannot advise/i)
    assert.match(
      Object.values(fb).join(" "),
      /clinician|care team|pharmacist/i
    )
    const joined = Object.values(fb).join(" ").toLowerCase()
    assert.doesNotMatch(joined, /\b(increase your dose|take \d+|diagnose)\b/)
    assert.match(joined, /prescribed plan|readings|symptoms/)
  })

  it("highStress keeps PRACTICAL_SUPPORT semantics shorter", () => {
    const normal = getStampleyFallbackResponse(
      "closure",
      false,
      "PRACTICAL_SUPPORT"
    )
    const stressed = getStampleyFallbackResponse(
      "closure",
      true,
      "PRACTICAL_SUPPORT"
    )
    assert.match(stressed.validation, /workable|looking for/i)
    assert.ok(stressed.micro_skill.trim().length > 0)
    assert.ok(
      Object.values(stressed).join("").length <=
        Object.values(normal).join("").length
    )
    assert.doesNotMatch(
      Object.values(stressed).join(" ").toLowerCase(),
      /\b(increase your|stop taking|units?)\b/
    )
  })

  it("highStress keeps MEDICAL_BOUNDARY semantics", () => {
    const stressed = getStampleyFallbackResponse(
      "closure",
      true,
      "MEDICAL_BOUNDARY"
    )
    assert.match(stressed.validation, /can'?t|medication|dose/i)
    assert.match(
      Object.values(stressed).join(" "),
      /clinician|care team|pharmacist/i
    )
  })

  it("mode-aware fallback ignores closure phase template", () => {
    const practical = getStampleyFallbackResponse(
      "closure",
      false,
      "PRACTICAL_SUPPORT"
    )
    const medical = getStampleyFallbackResponse(
      "closure",
      false,
      "MEDICAL_BOUNDARY"
    )
    assert.doesNotMatch(practical.closure, /solve everything tonight/i)
    assert.doesNotMatch(medical.closure, /solve everything tonight/i)
    assert.doesNotMatch(practical.validation, /Thank you for checking in honestly/i)
  })
})
