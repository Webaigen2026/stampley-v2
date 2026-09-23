import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildStampleyTurnInstruction,
  buildOpenAIMessages,
  buildStampleySystemPrompt,
  getStampleyFallbackResponse,
  type StampleyOpenAIContext,
} from "./stampley-prompt"
import {
  isExplicitClosingIntent,
  isPersonalizedMedicalDecisionRequest,
  isPracticalSupportRequest,
  isReadinessToActionSignal,
  hasMedicationTreatmentActionLanguage,
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

describe("B-5 practical request recall", () => {
  const listPrep = [
    "Can you help me make a list?",
    "Help me make a list.",
    "Can you help me prepare a list?",
    "Help me prepare some questions.",
    "Can you help me prepare questions for my doctor?",
    "Can you help me make a list of questions to ask?",
    "Help me make a list of questions.",
  ]

  for (const text of listPrep) {
    it(`list/question prep -> PRACTICAL: ${text}`, () => {
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

  const options = [
    "What are some options?",
    "What options do I have?",
    "Can you give me some options?",
    "Give me a few options.",
    "What are my options?",
  ]

  for (const text of options) {
    it(`options request -> PRACTICAL: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const ideas = [
    "Can you give me a few ideas?",
    "Do you have any ideas?",
    "Give me some ideas.",
    "Can you help me think of some ideas?",
    "Help me think of some ideas.",
  ]

  for (const text of ideas) {
    it(`ideas request -> PRACTICAL: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const alternatives = [
    "What are some alternatives?",
    "Can you suggest some alternatives?",
    "Help me think of alternatives.",
    "Can you help me find alternatives?",
  ]

  for (const text of alternatives) {
    it(`alternatives request -> PRACTICAL: ${text}`, () => {
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

  it("clinician appointment preparation routes PRACTICAL", () => {
    for (const text of [
      "Help me organize what I want to discuss at my appointment.",
      "Can you help me prepare questions for my doctor?",
    ]) {
      assert.equal(isPracticalSupportRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("descriptive / non-request statements stay non-practical", () => {
    for (const text of [
      "I made a list yesterday.",
      "My doctor gave me a list.",
      "I already have some options.",
      "There are several options.",
      "I wrote down some questions.",
      "I helped my mother make a list.",
      "My doctor suggested alternatives.",
    ]) {
      assert.equal(isPracticalSupportRequest(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("negated help / idea requests stay non-practical", () => {
    for (const text of [
      "I don't need help.",
      "I don't want any ideas.",
      "I do not want any options.",
    ]) {
      assert.equal(isPracticalSupportRequest(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("third-party help statements stay non-practical", () => {
    assert.equal(isPracticalSupportRequest("My friend needs help."), false)
    assert.notEqual(
      selectStampleyResponseMode({
        participantText: "My friend needs help.",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
  })

  it("bare ambiguous help stays conservative (no history resolution)", () => {
    for (const text of [
      "help me",
      "Help me.",
      "Can you help me with that?",
      "Could you help me with this?",
      "Help me with that.",
    ]) {
      assert.equal(isPracticalSupportRequest(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })
})

describe("B-5 medical collision matrix for practical recall", () => {
  const collisions = [
    "Can you help me increase my insulin?",
    "Can you help me lower my dose?",
    "Can you help me decide how much insulin to take?",
    "Give me options for changing my medication.",
    "What are my options for increasing my dose?",
    "Can you suggest an alternative medication?",
    "Help me choose a different medicine.",
    "Would another dose help?",
    "Can you help me change my treatment?",
    "Give me ideas for adjusting my insulin.",
  ]

  for (const text of collisions) {
    it(`never PRACTICAL for treatment-seeking: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), false)
      const mode = selectStampleyResponseMode({
        participantText: text,
        phase: "closure",
      })
      assert.notEqual(mode, "PRACTICAL_SUPPORT")
      if (isPersonalizedMedicalDecisionRequest(text)) {
        assert.equal(mode, "MEDICAL_BOUNDARY")
      }
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
      "REFLECT"
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

describe("B-3 closure eligibility", () => {
  it("turn count / closure phase alone does not force CLOSE", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I'm still worried about tomorrow.",
        phase: "closure",
      }),
      "REFLECT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I don't understand.",
        phase: "closure",
      }),
      "REFLECT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Can you explain what you mean?",
        phase: "closure",
      }),
      "REFLECT"
    )
  })

  it("quiet affirmative in late phase is soft CLOSE", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I feel a little better.",
        phase: "closure",
      }),
      "CLOSE"
    )
  })

  it("explicit close works without reply-count threshold", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Thanks, that's all.",
        phase: "closure",
      }),
      "CLOSE"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I'm done for today.",
        phase: "exploration",
      }),
      "CLOSE"
    )
  })

  it("mixed close + unresolved question is not CLOSE", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I'm done, but can you explain one more thing?",
        phase: "closure",
      }),
      "REFLECT"
    )
  })

  it("mixed close + practical/medical keeps stronger intent", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Thanks, but what else can I do?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "That's all, but should I change my medication?",
        phase: "closure",
      }),
      "MEDICAL_BOUNDARY"
    )
  })

  it("new substantive concern suppresses closure", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Actually, I'm scared about tomorrow.",
        phase: "closure",
      }),
      "REFLECT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Something else is bothering me.",
        phase: "closure",
      }),
      "REFLECT"
    )
  })

  it("highStress does not force CLOSE on new concern or change strong intent", () => {
    // highStress is not an input to selection — mode is independent.
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Actually, I'm scared about tomorrow.",
        phase: "closure",
      }),
      "REFLECT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "What else can I do?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Should I increase my insulin?",
        phase: "closure",
      }),
      "MEDICAL_BOUNDARY"
    )
  })
})

describe("B-3 anti-repetition prompt", () => {
  it("system and late-pacing prompts discourage repetition and forced closure", () => {
    const ctx = baseCtx("closure")
    const system = buildStampleySystemPrompt(ctx)
    assert.match(system, /do not repeat the same validation formula/i)
    assert.match(system, /Build on what was already said/i)
    assert.match(system, /Do not force closure from turn count/i)
    assert.match(system, /not every turn needs a question/i)
    assert.match(system, /prefer concise synthesis or specific validation/i)
    assert.match(system, /do not ask another question merely to keep the conversation going/i)

    const reflect = buildStampleyTurnInstruction(ctx, "REFLECT")
    assert.match(reflect, /LATE PACING/i)
    assert.match(reflect, /do not force wrap-up from turn count alone/i)
    assert.match(reflect, /avoid repeating recent validation/i)
    assert.match(reflect, /OPTIONAL/i)
    assert.match(reflect, /do not manufacture a question/i)
    assert.match(reflect, /actionable options belong in PRACTICAL_SUPPORT/i)
    assert.doesNotMatch(reflect, /You do not need to solve everything tonight/)
    assert.doesNotMatch(reflect, /CLOSURE goal: emotional release/)

    const exploration = buildStampleyTurnInstruction(
      baseCtx("exploration"),
      "REFLECT"
    )
    assert.match(exploration, /OPTIONAL/i)
    assert.match(exploration, /materially advances understanding/i)
    assert.match(exploration, /do not manufacture a question/i)
    assert.match(exploration, /actionable options belong in PRACTICAL_SUPPORT/i)
    assert.doesNotMatch(
      exploration,
      /reflection_question: ONE curious deepening question/
    )

    const practical = buildStampleyTurnInstruction(ctx, "PRACTICAL_SUPPORT")
    assert.match(practical, /prefer a different safe category/i)
    assert.match(practical, /do not mandatorily say "one small step"/i)
    assert.match(practical, /observation or hypothesis/i)
    assert.match(practical, /do not confirm medical causation/i)
  })
})

describe("B-4 readiness-to-action detector", () => {
  it("observation alone stays REFLECT", () => {
    const text = "I notice this tends to happen in the morning."
    assert.equal(isReadinessToActionSignal(text), false)
    assert.equal(
      selectStampleyResponseMode({ participantText: text, phase: "exploration" }),
      "REFLECT"
    )
  })

  it("pattern / possible contributor alone stays REFLECT", () => {
    const text = "I think this happens after certain drinks."
    assert.equal(isReadinessToActionSignal(text), false)
    assert.equal(
      selectStampleyResponseMode({ participantText: text, phase: "coping" }),
      "REFLECT"
    )
  })

  it("emotional / difficult-day statements stay REFLECT", () => {
    for (const text of [
      "Today was difficult.",
      "I'm worried about tomorrow.",
      "I don't know why.",
    ]) {
      assert.equal(isReadinessToActionSignal(text), false)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "REFLECT"
      )
    }
  })

  const intentionPositives = [
    "I want to try cutting back on late-night snacks.",
    "I'd like to try a short walk after dinner.",
    "I plan to drink water instead of soda with lunch.",
    "I think I should try setting a bedtime reminder.",
  ]

  for (const text of intentionPositives) {
    it(`intention readiness -> PRACTICAL: ${text}`, () => {
      assert.equal(isReadinessToActionSignal(text), true)
      assert.equal(isPracticalSupportRequest(text), false)
      assert.equal(
        selectStampleyResponseMode({ participantText: text, phase: "closure" }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const willingnessPositives = [
    "I can try writing down what I eat for a few days.",
    "I could try taking a short break when stress builds.",
    "I'm willing to try a calmer evening routine.",
    "I'll try packing snacks the night before.",
  ]

  for (const text of willingnessPositives) {
    it(`willingness readiness -> PRACTICAL: ${text}`, () => {
      assert.equal(isReadinessToActionSignal(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const selfProposed = [
    "I'll start keeping a simple meal log.",
    "I'll stop checking my phone during meals.",
    "I'll reduce how often I have sugary drinks.",
    "I'll switch to water with dinner.",
    "I'll keep track of my evening stress for a week.",
    "I'll set a reminder to stretch after work.",
  ]

  for (const text of selfProposed) {
    it(`self-proposed action -> PRACTICAL: ${text}`, () => {
      assert.equal(isReadinessToActionSignal(text), true)
      assert.equal(
        selectStampleyResponseMode({ participantText: text, phase: "opening" }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  it("acceptance with action language -> PRACTICAL", () => {
    for (const text of [
      "Yes, I can try that.",
      "That sounds doable.",
      "I think that could work.",
    ]) {
      assert.equal(isReadinessToActionSignal(text), true)
      assert.equal(
        selectStampleyResponseMode({ participantText: text, phase: "coping" }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("bare affirmatives are not readiness", () => {
    for (const text of ["yes", "yeah", "okay", "sure", "got it", "ok", "yep"]) {
      assert.equal(isReadinessToActionSignal(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("negation / refusal is not readiness", () => {
    for (const text of [
      "I don't want to change anything.",
      "I'm not ready to change.",
      "I can't try that.",
      "I won't try that.",
      "I don't think I can do that.",
      "I was going to try that but didn't.",
      "I planned to do it but didn't.",
      "I wasn't able to do that.",
    ]) {
      assert.equal(isReadinessToActionSignal(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("uncertainty is not readiness", () => {
    for (const text of ["Maybe.", "I don't know.", "Not sure."]) {
      assert.equal(isReadinessToActionSignal(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "exploration",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("third-party intention is not readiness", () => {
    const text = "My doctor wants me to change it."
    assert.equal(isReadinessToActionSignal(text), false)
    assert.notEqual(
      selectStampleyResponseMode({ participantText: text, phase: "closure" }),
      "PRACTICAL_SUPPORT"
    )
  })

  it("failed / past plans are not readiness", () => {
    for (const text of [
      "I was going to change it but I couldn't.",
      "I tried that already and it didn't work.",
    ]) {
      assert.equal(isReadinessToActionSignal(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("readiness works in all phases", () => {
    const text = "I'll try taking a short walk after meals."
    for (const phase of [
      "opening",
      "exploration",
      "coping",
      "closure",
    ] as const) {
      assert.equal(
        selectStampleyResponseMode({ participantText: text, phase }),
        "PRACTICAL_SUPPORT"
      )
    }
  })

  it("readiness blocks soft CLOSE", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I'll try a calmer bedtime routine.",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
  })

  it("explicit practical request still wins without readiness patterns", () => {
    assert.equal(isReadinessToActionSignal("Any tips?"), false)
    assert.equal(isPracticalSupportRequest("Any tips?"), true)
    assert.equal(
      selectStampleyResponseMode({
        participantText: "Any tips?",
        phase: "closure",
      }),
      "PRACTICAL_SUPPORT"
    )
  })
})

describe("B-4 medication/treatment exclusion from readiness", () => {
  const collisions = [
    "I'll increase my insulin.",
    "I want to reduce my insulin.",
    "I plan to take more medication.",
    "I'll skip my medication.",
    "I think I should double my next dose.",
    "I can take another pill.",
    "I'll change my dosage.",
    "I'll try taking more insulin.",
    "I'm willing to lower my dose.",
    "I'll stop my medication.",
  ]

  for (const text of collisions) {
    it(`treatment-action never PRACTICAL via readiness: ${text}`, () => {
      assert.equal(hasMedicationTreatmentActionLanguage(text), true)
      assert.equal(isReadinessToActionSignal(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
      const mode = selectStampleyResponseMode({
        participantText: text,
        phase: "closure",
      })
      if (isPersonalizedMedicalDecisionRequest(text)) {
        assert.equal(mode, "MEDICAL_BOUNDARY")
      } else {
        // Fail closed: REFLECT (or CLOSE only if soft-close — should not)
        assert.equal(mode, "REFLECT")
      }
    })
  }
})

describe("B-4 multi-turn progression regression", () => {
  it("observation -> pattern -> readiness progresses to PRACTICAL", () => {
    const turn1 = selectStampleyResponseMode({
      participantText: "I've been feeling worn down by my routine lately.",
      phase: "exploration",
    })
    assert.equal(turn1, "REFLECT")

    const turn2 = selectStampleyResponseMode({
      participantText: "I notice it builds when evenings get busy.",
      phase: "coping",
    })
    assert.equal(turn2, "REFLECT")

    const turn3 = selectStampleyResponseMode({
      participantText: "I want to try a shorter evening wind-down.",
      phase: "closure",
    })
    assert.equal(turn3, "PRACTICAL_SUPPORT")
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

  it("REFLECT + late phase fallback is not forced CLOSE copy", () => {
    const fb = getStampleyFallbackResponse("closure", false, "REFLECT")
    assert.doesNotMatch(
      Object.values(fb).join(" "),
      /solve everything tonight/i
    )
    assert.equal(fb.closure, "")
    assert.match(fb.validation, /still something on your mind|heavy/i)
  })

  it("CLOSE mode fallback allows wrap-up without canned tonight line", () => {
    const fb = getStampleyFallbackResponse("closure", false, "CLOSE")
    assert.match(fb.closure, /Complete Check-in/i)
    assert.doesNotMatch(fb.closure, /solve everything tonight/i)
  })
})

describe("B-6 direct guidance routing recall", () => {
  const directPositives = [
    // Screenshot / production failures
    "what will you suggest me to do next",
    "what to do",
    "I dont know you tell me",
    "I don't know, you tell me.",
    "you tell me",
    // Suggestion family
    "What will you suggest me to do next?",
    "What do you suggest I do next?",
    "What do you suggest?",
    "Can you suggest something?",
    "Can you suggest something I can try?",
    "Suggest something I can do.",
    // What-to-do / can-try
    "What should I do next?",
    "What can I do right now?",
    "What to do next?",
    "What can I try?",
    "What can I do next?",
    // Tell-me
    "Tell me what to do.",
    "Tell me what I can try.",
    // Idea / next-step
    "Give me an idea.",
    "Give me a next step.",
    // Recommend
    "What would you recommend I try?",
    "What would you recommend?",
    // Guidance
    "I need some guidance.",
    "Can you give me some guidance?",
  ]

  for (const text of directPositives) {
    it(`direct guidance -> PRACTICAL: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "closure",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  it("screenshot phrase #1 exact production string", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "what will you suggest me to do next",
        phase: "coping",
      }),
      "PRACTICAL_SUPPORT"
    )
  })

  it("screenshot phrase #2 exact production string", () => {
    assert.equal(
      selectStampleyResponseMode({
        participantText: "what to do",
        phase: "coping",
      }),
      "PRACTICAL_SUPPORT"
    )
  })

  it("screenshot phrase #3 narrow you-tell-me family (newest-text, no history)", () => {
    // Safe as an explicit handoff to Stampley ("provide the guidance"),
    // not bare "I don't know" and not history-resolved anaphora.
    assert.equal(
      selectStampleyResponseMode({
        participantText: "I dont know you tell me",
        phase: "coping",
      }),
      "PRACTICAL_SUPPORT"
    )
  })

  const emotional = [
    "I don't know what to do anymore.",
    "I don't know how to handle this anymore.",
    "I feel lost.",
    "I don't know.",
    "I have no idea what to do anymore.",
    "I don't know if I can do this.",
    "I feel overwhelmed and don't know what to do.",
    "I don't know what comes next.",
    "help me",
    "help me with that",
  ]

  for (const text of emotional) {
    it(`emotional/ambiguous stays non-practical: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const negated = [
    "I don't want suggestions.",
    "Don't suggest anything.",
    "I am not asking for advice.",
    "I don't need guidance.",
    "Please don't tell me what to do.",
    "I don't want ideas.",
    "I don't need recommendations.",
  ]

  for (const text of negated) {
    it(`negation stays non-practical: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const thirdParty = [
    "My friend asked what to do.",
    "My wife asked me what she should do.",
    "My doctor told me what to do.",
    "My friend wants suggestions.",
    "My brother needs guidance.",
  ]

  for (const text of thirdParty) {
    it(`third-party stays non-practical: ${text}`, () => {
      assert.equal(isPracticalSupportRequest(text), false)
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  const medicalMustWin = [
    "What should I do about my insulin dose?",
    "Tell me how much insulin to take.",
    "What medication should I try?",
    "Can you suggest a different medication?",
    "What would you recommend for my insulin?",
    "Give me an idea for changing my dose.",
    "What should I take next?",
    "Should I take another dose?",
    "Tell me what dose I should use.",
    "Can you suggest how much metformin to take?",
    "What can I do about my medication dose?",
    "What should I do with my insulin?",
  ]

  for (const text of medicalMustWin) {
    it(`medical guidance stays MEDICAL_BOUNDARY: ${text}`, () => {
      assert.equal(isPersonalizedMedicalDecisionRequest(text), true)
      assert.equal(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "MEDICAL_BOUNDARY"
      )
      assert.notEqual(
        selectStampleyResponseMode({
          participantText: text,
          phase: "coping",
        }),
        "PRACTICAL_SUPPORT"
      )
    })
  }

  it("MEDICAL_BOUNDARY still precedes PRACTICAL_SUPPORT for suggest+med", () => {
    const text = "Can you suggest a different medication?"
    // Even if practical patterns mention "suggest", medical wins.
    assert.equal(isPersonalizedMedicalDecisionRequest(text), true)
    assert.equal(
      selectStampleyResponseMode({
        participantText: text,
        phase: "exploration",
      }),
      "MEDICAL_BOUNDARY"
    )
  })
})
