import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  ALLOWED_CONTEXT_TAGS,
  COPING_MAX_LENGTH,
  REFLECTION_MAX_LENGTH,
  validateCheckInSubmitBody,
} from "./check-in-submit-validation"

const VALID_PAYLOAD = {
  distress: 5,
  mood: 6,
  energy: 7,
  contextTags: ["work_stress"],
  reflection: "Work was stressful today.",
  copingAction: "I took a short walk.",
  domain: "Emotional",
}

const METRIC_FIELDS = ["distress", "mood", "energy"] as const
const ACCEPTED_SCORES = [0, 1, 5, 9, 10]
const REJECTED_SCORES: Array<{ label: string; value: unknown }> = [
  { label: "-1", value: -1 },
  { label: "11", value: 11 },
  { label: "3.5", value: 3.5 },
  { label: "NaN", value: Number.NaN },
  { label: "Infinity", value: Number.POSITIVE_INFINITY },
  { label: "-Infinity", value: Number.NEGATIVE_INFINITY },
  { label: '"9"', value: "9" },
  { label: "null", value: null },
  { label: "undefined", value: undefined },
  { label: "true", value: true },
  { label: "false", value: false },
  { label: "{}", value: {} },
  { label: "[]", value: [] },
]

function assertOk(body: unknown) {
  const result = validateCheckInSubmitBody(body)
  assert.equal(result.ok, true, `expected accept, got ${JSON.stringify(result)}`)
  if (!result.ok) throw new Error("unreachable")
  return result.data
}

function assertRejected(body: unknown, error?: string) {
  const result = validateCheckInSubmitBody(body)
  assert.equal(result.ok, false, `expected reject for ${JSON.stringify(body)}`)
  if (result.ok) throw new Error("unreachable")
  if (error) assert.equal(result.error, error)
  return result.error
}

function withOverrides(
  overrides: Record<string, unknown>
): Record<string, unknown> {
  return { ...VALID_PAYLOAD, ...overrides }
}

describe("validateCheckInSubmitBody valid payload", () => {
  it("accepts a complete valid payload and returns only the helper fields", () => {
    const data = assertOk(VALID_PAYLOAD)

    assert.deepEqual(data, {
      distress: 5,
      mood: 6,
      energy: 7,
      contextTags: ["work_stress"],
      reflection: "Work was stressful today.",
      copingAction: "I took a short walk.",
    })
    assert.equal("domain" in data, false)
  })
})

describe("validateCheckInSubmitBody daily metrics", () => {
  for (const field of METRIC_FIELDS) {
    it(`accepts integer ${field} values 0, 1, 5, 9, and 10`, () => {
      for (const value of ACCEPTED_SCORES) {
        const data = assertOk(withOverrides({ [field]: value }))
        assert.equal(data[field], value)
      }
    })

    it(`rejects malformed or out-of-range ${field} without coercing strings`, () => {
      for (const { value } of REJECTED_SCORES) {
        assertRejected(
          withOverrides({ [field]: value }),
          `Invalid ${field} value`
        )
      }

      const { [field]: _omitted, ...missing } = VALID_PAYLOAD
      assertRejected(missing, `Invalid ${field} value`)
    })
  }
})

describe("validateCheckInSubmitBody contextTags", () => {
  it("uses the current seven-tag allowlist", () => {
    assert.deepEqual([...ALLOWED_CONTEXT_TAGS], [
      "doctors_appointment",
      "blood_sugar",
      "missed_medication",
      "work_stress",
      "conflict",
      "felt_supported",
      "unwell",
    ])
  })

  it("accepts one valid tag, multiple valid tags, and the full allowlist", () => {
    assert.deepEqual(assertOk(withOverrides({ contextTags: ["work_stress"] })).contextTags, [
      "work_stress",
    ])
    assert.deepEqual(
      assertOk(
        withOverrides({
          contextTags: ["work_stress", "blood_sugar", "felt_supported"],
        })
      ).contextTags,
      ["work_stress", "blood_sugar", "felt_supported"]
    )
    assert.deepEqual(
      assertOk(withOverrides({ contextTags: [...ALLOWED_CONTEXT_TAGS] })).contextTags,
      [...ALLOWED_CONTEXT_TAGS]
    )
  })

  it("currently accepts duplicate valid tags", () => {
    const data = assertOk(
      withOverrides({ contextTags: ["work_stress", "work_stress"] })
    )
    assert.deepEqual(data.contextTags, ["work_stress", "work_stress"])
  })

  it("rejects empty, unknown, mixed, and malformed contextTags", () => {
    const rejected = [
      [],
      ["fake_tag"],
      ["work_stress", "fake_tag"],
      "work_stress",
      [1],
      [null],
      {},
      null,
    ]

    for (const value of rejected) {
      assertRejected(
        withOverrides({ contextTags: value }),
        "At least one valid context factor is required"
      )
    }

    const { contextTags: _omittedTags, ...missing } = VALID_PAYLOAD
    assertRejected(missing, "At least one valid context factor is required")
  })
})

describe("validateCheckInSubmitBody reflection", () => {
  it("accepts non-empty text up to 250 characters and returns trimmed text", () => {
    assert.equal(assertOk(withOverrides({ reflection: "x" })).reflection, "x")
    assert.equal(
      assertOk(withOverrides({ reflection: "Work was stressful today." })).reflection,
      "Work was stressful today."
    )

    const exact = "r".repeat(REFLECTION_MAX_LENGTH)
    assert.equal(assertOk(withOverrides({ reflection: exact })).reflection, exact)
    assert.equal(exact.length, 250)

    const padded = `  ${"r".repeat(REFLECTION_MAX_LENGTH)}  `
    assert.equal(assertOk(withOverrides({ reflection: padded })).reflection, exact)
    assert.equal(
      assertOk(withOverrides({ reflection: "  leading and trailing  " })).reflection,
      "leading and trailing"
    )
  })

  it("rejects empty, whitespace-only, non-string, and over-limit reflection", () => {
    assertRejected(withOverrides({ reflection: "" }), "Reflection is required")
    assertRejected(withOverrides({ reflection: "   " }), "Reflection is required")
    assertRejected(withOverrides({ reflection: null }), "Reflection is required")
    assertRejected(withOverrides({ reflection: undefined }), "Reflection is required")
    assertRejected(withOverrides({ reflection: 12 }), "Reflection is required")
    assertRejected(withOverrides({ reflection: {} }), "Reflection is required")
    assertRejected(withOverrides({ reflection: [] }), "Reflection is required")

    const { reflection: _omittedReflection, ...missing } = VALID_PAYLOAD
    assertRejected(missing, "Reflection is required")

    assertRejected(
      withOverrides({ reflection: "r".repeat(REFLECTION_MAX_LENGTH + 1) }),
      "Reflection must be 250 characters or fewer"
    )
    assertRejected(
      withOverrides({
        reflection: `  ${"r".repeat(REFLECTION_MAX_LENGTH + 1)}  `,
      }),
      "Reflection must be 250 characters or fewer"
    )
  })
})

describe("validateCheckInSubmitBody copingAction", () => {
  it("accepts non-empty text up to 180 characters and returns trimmed text", () => {
    assert.equal(assertOk(withOverrides({ copingAction: "x" })).copingAction, "x")
    assert.equal(
      assertOk(withOverrides({ copingAction: "I took a short walk." })).copingAction,
      "I took a short walk."
    )

    const exact = "c".repeat(COPING_MAX_LENGTH)
    assert.equal(assertOk(withOverrides({ copingAction: exact })).copingAction, exact)
    assert.equal(exact.length, 180)

    const padded = `  ${"c".repeat(COPING_MAX_LENGTH)}  `
    assert.equal(assertOk(withOverrides({ copingAction: padded })).copingAction, exact)
    assert.equal(
      assertOk(withOverrides({ copingAction: "  a walk  " })).copingAction,
      "a walk"
    )
  })

  it("rejects empty, whitespace-only, non-string, and over-limit copingAction", () => {
    assertRejected(withOverrides({ copingAction: "" }), "Coping action is required")
    assertRejected(withOverrides({ copingAction: "   " }), "Coping action is required")
    assertRejected(withOverrides({ copingAction: null }), "Coping action is required")
    assertRejected(
      withOverrides({ copingAction: undefined }),
      "Coping action is required"
    )
    assertRejected(withOverrides({ copingAction: 12 }), "Coping action is required")
    assertRejected(withOverrides({ copingAction: {} }), "Coping action is required")
    assertRejected(withOverrides({ copingAction: [] }), "Coping action is required")

    const { copingAction: _omittedCoping, ...missing } = VALID_PAYLOAD
    assertRejected(missing, "Coping action is required")

    assertRejected(
      withOverrides({ copingAction: "c".repeat(COPING_MAX_LENGTH + 1) }),
      "Coping action must be 180 characters or fewer"
    )
    assertRejected(
      withOverrides({
        copingAction: `  ${"c".repeat(COPING_MAX_LENGTH + 1)}  `,
      }),
      "Coping action must be 180 characters or fewer"
    )
  })
})

describe("validateCheckInSubmitBody complete payloads", () => {
  it("accepts all metrics at 0", () => {
    const data = assertOk(
      withOverrides({ distress: 0, mood: 0, energy: 0 })
    )
    assert.equal(data.distress, 0)
    assert.equal(data.mood, 0)
    assert.equal(data.energy, 0)
  })

  it("accepts all metrics at 10", () => {
    const data = assertOk(
      withOverrides({ distress: 10, mood: 10, energy: 10 })
    )
    assert.equal(data.distress, 10)
    assert.equal(data.mood, 10)
    assert.equal(data.energy, 10)
  })

  it("accepts multiple context tags", () => {
    const tags = ["doctors_appointment", "conflict", "unwell"]
    assert.deepEqual(
      assertOk(withOverrides({ contextTags: tags })).contextTags,
      tags
    )
  })

  it("accepts narratives exactly at the current maximum lengths", () => {
    const data = assertOk(
      withOverrides({
        reflection: "r".repeat(REFLECTION_MAX_LENGTH),
        copingAction: "c".repeat(COPING_MAX_LENGTH),
      })
    )
    assert.equal(data.reflection.length, 250)
    assert.equal(data.copingAction.length, 180)
  })
})

describe("validateCheckInSubmitBody malformed body shape", () => {
  it("rejects non-object bodies as invalid request body", () => {
    for (const value of [null, undefined, "string", 123, true]) {
      assertRejected(value, "Invalid request body")
    }
  })

  it("treats empty objects and arrays as objects and then rejects missing distress", () => {
    assertRejected({}, "Invalid distress value")
    assertRejected([], "Invalid distress value")
  })
})
