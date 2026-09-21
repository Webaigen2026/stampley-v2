import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  DDS_CLINICAL_ATTENTION_THRESHOLD,
  DDS_DOMAINS,
  DDS_ITEM_KEYS,
  calculateDDSScores,
  getHighestDdsDomains,
  isDdsDomain,
  meetsDdsClinicalAttentionThreshold,
  parseDdsAnswers,
  parseDdsAnswersFromFormData,
  parseDdsItemValue,
  type DDSAnswers,
} from "./dds-scoring"
import { scorePostSurveyDds } from "./post-survey-scoring"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function answersFromValues(values: number[]): DDSAnswers {
  assert.equal(values.length, 17)
  const answers = {} as DDSAnswers
  for (let i = 0; i < 17; i++) {
    answers[`q${i + 1}` as keyof DDSAnswers] = values[i]
  }
  return answers
}

function fillAnswers(value: number): DDSAnswers {
  return answersFromValues(Array.from({ length: 17 }, () => value))
}

function withItems(
  base: number,
  overrides: Partial<Record<keyof DDSAnswers, number>>
): DDSAnswers {
  return { ...fillAnswers(base), ...overrides }
}

const CASE_B = answersFromValues([
  3, 2, 4, 1, 5, 4, 3, 2, 2, 6, 3, 5, 4, 4, 2, 3, 5,
])

describe("DDS-17 instrument structure", () => {
  it("has exactly 17 unique keys q1 through q17", () => {
    assert.equal(DDS_ITEM_KEYS.length, 17)
    assert.deepEqual([...DDS_ITEM_KEYS], [
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
      "q9",
      "q10",
      "q11",
      "q12",
      "q13",
      "q14",
      "q15",
      "q16",
      "q17",
    ])
    assert.equal(new Set(DDS_ITEM_KEYS).size, 17)
  })
})

describe("DDS-17 response validation", () => {
  it("accepts integers 1 through 6", () => {
    for (const value of [1, 2, 3, 4, 5, 6]) {
      assert.equal(parseDdsItemValue(value), value)
      assert.equal(parseDdsItemValue(String(value)), value)
    }
    assert.deepEqual(parseDdsAnswers(fillAnswers(3)), fillAnswers(3))
  })

  it("rejects 0, 7, decimals, partial numeric strings, and non-integers", () => {
    const rejected = [
      0,
      7,
      -1,
      1.5,
      3.9,
      "3.9",
      "3abc",
      "03",
      "3.0",
      NaN,
      Infinity,
      -Infinity,
      null,
      undefined,
      "",
      true,
      false,
      {},
      [],
    ]

    for (const value of rejected) {
      assert.equal(parseDdsItemValue(value), null, `should reject ${String(value)}`)
    }
  })

  it("rejects missing answers and requires all 17 items", () => {
    assert.equal(parseDdsAnswers(null), null)
    assert.equal(parseDdsAnswers(undefined), null)
    assert.equal(parseDdsAnswers([]), null)
    assert.equal(parseDdsAnswers({}), null)

    const missingQ17 = { ...fillAnswers(2) } as Record<string, number>
    delete missingQ17.q17
    assert.equal(parseDdsAnswers(missingQ17), null)

    const withNaN = { ...fillAnswers(2), q8: Number.NaN }
    assert.equal(parseDdsAnswers(withNaN), null)

    const formData = new FormData()
    for (let i = 1; i <= 16; i++) formData.set(`q${i}`, "3")
    assert.equal(parseDdsAnswersFromFormData(formData), null)

    const complete = new FormData()
    for (let i = 1; i <= 17; i++) complete.set(`q${i}`, "4")
    assert.deepEqual(parseDdsAnswersFromFormData(complete), fillAnswers(4))
  })
})

describe("DDS-17 canonical scoring", () => {
  it("locks domain item sets and denominators in calculateDDSScores", () => {
    const source = read("lib/dds-scoring.ts")
    const start = source.indexOf("export function calculateDDSScores")
    assert.notEqual(start, -1)
    const scoring = source.slice(start)

    assert.match(
      scoring,
      /\(answers\.q1 \+ answers\.q3 \+ answers\.q8 \+ answers\.q11 \+ answers\.q14\) \/ 5/
    )
    assert.match(
      scoring,
      /\(answers\.q2 \+ answers\.q4 \+ answers\.q9 \+ answers\.q15\) \/ 4/
    )
    assert.match(
      scoring,
      /\(answers\.q5 \+ answers\.q6 \+ answers\.q10 \+ answers\.q12 \+ answers\.q16\) \/ 5/
    )
    assert.match(
      scoring,
      /\(answers\.q7 \+ answers\.q13 \+ answers\.q17\) \/ 3/
    )
    assert.match(scoring, /answers\.q16 \+ answers\.q17\) \/ 17/)
    assert.doesNotMatch(scoring, /\/ 10/)
    assert.doesNotMatch(scoring, /distress/)
  })

  it("Case A: all 1s -> total 1 with denominator 17", () => {
    const scores = calculateDDSScores(fillAnswers(1))
    assert.equal(scores.emotional, 1)
    assert.equal(scores.physician, 1)
    assert.equal(scores.regimen, 1)
    assert.equal(scores.interpersonal, 1)
    assert.equal(scores.total, 1)
    assert.deepEqual(getHighestDdsDomains(scores), [...DDS_DOMAINS])
    assert.equal(isDdsDomain(scores.recommendedDomain), true)
  })

  it("all 6s -> total 6", () => {
    const scores = calculateDDSScores(fillAnswers(6))
    assert.equal(scores.total, 6)
    assert.equal(scores.emotional, 6)
    assert.equal(scores.physician, 6)
    assert.equal(scores.regimen, 6)
    assert.equal(scores.interpersonal, 6)
  })

  it("Emotional mapping is exactly items 1, 3, 8, 11, 14", () => {
    const scores = calculateDDSScores(
      withItems(1, { q1: 6, q3: 6, q8: 6, q11: 6, q14: 6 })
    )
    assert.equal(scores.emotional, 6)
    assert.equal(scores.physician, 1)
    assert.equal(scores.regimen, 1)
    assert.equal(scores.interpersonal, 1)
  })

  it("Physician mapping is exactly items 2, 4, 9, 15", () => {
    const scores = calculateDDSScores(
      withItems(1, { q2: 6, q4: 6, q9: 6, q15: 6 })
    )
    assert.equal(scores.physician, 6)
    assert.equal(scores.emotional, 1)
    assert.equal(scores.regimen, 1)
    assert.equal(scores.interpersonal, 1)
  })

  it("Regimen mapping is exactly items 5, 6, 10, 12, 16", () => {
    const scores = calculateDDSScores(
      withItems(1, { q5: 6, q6: 6, q10: 6, q12: 6, q16: 6 })
    )
    assert.equal(scores.regimen, 6)
    assert.equal(scores.emotional, 1)
    assert.equal(scores.physician, 1)
    assert.equal(scores.interpersonal, 1)
  })

  it("Interpersonal mapping is exactly items 7, 13, 17", () => {
    const scores = calculateDDSScores(
      withItems(1, { q7: 6, q13: 6, q17: 6 })
    )
    assert.equal(scores.interpersonal, 6)
    assert.equal(scores.emotional, 1)
    assert.equal(scores.physician, 1)
    assert.equal(scores.regimen, 1)
  })

  it("Case B matches the supplied scoring sheet", () => {
    const scores = calculateDDSScores(CASE_B)
    assert.equal(scores.emotional, 3.2)
    assert.equal(scores.physician, 1.75)
    assert.equal(scores.regimen, 4.6)
    assert.equal(scores.interpersonal, 4)
    assert.equal(scores.total, 3.41)
    assert.equal(scores.recommendedDomain, "Regimen")
  })
})

describe("DDS-17 clinical-attention threshold", () => {
  it("uses mean item score >= 3, not a 0–10 scale", () => {
    assert.equal(DDS_CLINICAL_ATTENTION_THRESHOLD, 3)
    assert.equal(meetsDdsClinicalAttentionThreshold(2.99), false)
    assert.equal(meetsDdsClinicalAttentionThreshold(3), true)
    assert.equal(meetsDdsClinicalAttentionThreshold(3.0), true)
    assert.equal(meetsDdsClinicalAttentionThreshold(3.01), true)
  })

  it("exactly 3.00 reaches the threshold", () => {
    const scores = calculateDDSScores(fillAnswers(3))
    assert.equal(scores.total, 3)
    assert.equal(meetsDdsClinicalAttentionThreshold(scores.total), true)
  })

  it("below 3.00 does not reach the threshold", () => {
    const scores = calculateDDSScores(withItems(3, { q17: 2 }))
    assert.equal(scores.total, 2.94)
    assert.equal(meetsDdsClinicalAttentionThreshold(scores.total), false)
  })
})

describe("DDS-17 domain allowlist", () => {
  it("accepts the four canonical stored values only", () => {
    assert.deepEqual([...DDS_DOMAINS], [
      "Emotional",
      "Physician",
      "Regimen",
      "Interpersonal",
    ])

    for (const domain of DDS_DOMAINS) {
      assert.equal(isDdsDomain(domain), true)
    }
  })

  it("rejects arbitrary, cased, padded, and empty strings", () => {
    const rejected = [
      "Other",
      "emotional",
      "Emotional ",
      "admin",
      "",
      "EMOTIONAL",
      "Regimen-related",
      "Focus",
      3,
      null,
      undefined,
    ]

    for (const value of rejected) {
      assert.equal(isDdsDomain(value), false, `should reject ${String(value)}`)
    }
  })

  it("confirmDomain validates with isDdsDomain before persist", () => {
    const source = read("actions/dds.ts")
    const start = source.indexOf("export async function confirmDomain")
    assert.notEqual(start, -1)
    const confirm = source.slice(start)
    assert.match(confirm, /if \(!isDdsDomain\(domain\)\)/)
    assert.match(confirm, /return \{ error: "Unable to save focus\." \}/)
    assert.doesNotMatch(confirm, /console\.(log|info|debug)\(/)
  })
})

describe("DDS-17 highest-domain ties", () => {
  it("A. unique maximum is Regimen", () => {
    const scores = calculateDDSScores(
      withItems(2, { q5: 4, q6: 4, q10: 4, q12: 4, q16: 4 })
    )
    assert.equal(scores.emotional, 2)
    assert.equal(scores.physician, 2)
    assert.equal(scores.regimen, 4)
    assert.equal(scores.interpersonal, 2)
    assert.deepEqual(getHighestDdsDomains(scores), ["Regimen"])
    assert.equal(scores.recommendedDomain, "Regimen")
  })

  it("B. two-way tie returns Emotional and Physician, not a scientific winner", () => {
    const scores = calculateDDSScores(
      withItems(2, {
        q1: 4,
        q3: 4,
        q8: 4,
        q11: 4,
        q14: 4,
        q2: 4,
        q4: 4,
        q9: 4,
        q15: 4,
      })
    )
    assert.equal(scores.emotional, 4)
    assert.equal(scores.physician, 4)
    assert.equal(scores.regimen, 2)
    assert.equal(scores.interpersonal, 2)
    assert.deepEqual(getHighestDdsDomains(scores), ["Emotional", "Physician"])
    assert.equal(getHighestDdsDomains(scores).length, 2)
  })

  it("C. four-way tie recognizes all four canonical domains", () => {
    const scores = calculateDDSScores(fillAnswers(3))
    assert.equal(scores.emotional, 3)
    assert.equal(scores.physician, 3)
    assert.equal(scores.regimen, 3)
    assert.equal(scores.interpersonal, 3)
    assert.deepEqual(getHighestDdsDomains(scores), [
      "Emotional",
      "Physician",
      "Regimen",
      "Interpersonal",
    ])
  })

  it("persisted recommendedDomain remains a single string and is not a ranking", () => {
    const schema = read("prisma/schema.prisma")
    assert.match(schema, /recommendedDomain\s+String\?/)
    assert.doesNotMatch(
      read("lib/dds-scoring.ts"),
      /scientifically preferred|clinical priority/
    )
  })
})

describe("DDS-17 post-survey equivalence", () => {
  it("scorePostSurveyDds delegates to calculateDDSScores", () => {
    const source = read("lib/post-survey-scoring.ts")
    assert.match(
      source,
      /export function scorePostSurveyDds\(answers: DDSAnswers\): DDSScores \{\s*return calculateDDSScores\(answers\)\s*\}/
    )
  })

  it("Case B is identical through the post-survey wrapper", () => {
    assert.deepEqual(scorePostSurveyDds(CASE_B), calculateDDSScores(CASE_B))
  })

  it("post-survey submit uses the shared parser and wrapper", () => {
    const source = read("actions/post-survey.ts")
    assert.match(source, /parseDdsAnswers\(data\.dds\)/)
    assert.match(source, /scorePostSurveyDds\(ddsAnswers\)/)
    assert.doesNotMatch(source, /parseInt/)
    assert.doesNotMatch(source, /hasNumericAnswer\(value\) \|\| value < 1 \|\| value > 6/)
  })
})

describe("DDS-17 0–10 separation", () => {
  it("daily check-in distress does not participate in calculateDDSScores", () => {
    const checkIn = { distress: 10, mood: 0, energy: 5 }
    const scores = calculateDDSScores(fillAnswers(1))
    assert.equal(scores.total, 1)
    assert.equal("distress" in checkIn, true)
    assert.equal("distress" in scores, false)

    const scoring = read("lib/dds-scoring.ts")
    const start = scoring.indexOf("export function calculateDDSScores")
    assert.doesNotMatch(scoring.slice(start), /distress/)
    assert.doesNotMatch(scoring.slice(start), /mood/)
    assert.doesNotMatch(scoring.slice(start), /energy/)
  })
})

describe("DDS-17 admin and Stampley consistency", () => {
  it("admin high-distress filter applies any mean >= 3 and does not rescore", () => {
    const search = read("lib/admin-directory-search.ts")
    assert.match(search, /totalScore: \{ gte: 3 \}/)
    assert.match(search, /emotionalScore: \{ gte: 3 \}/)
    assert.match(search, /physicianScore: \{ gte: 3 \}/)
    assert.match(search, /regimenScore: \{ gte: 3 \}/)
    assert.match(search, /interpersonalScore: \{ gte: 3 \}/)
    assert.doesNotMatch(search, /calculateDDSScores/)
    // Applying the supplied mean >= 3 threshold to subscales is a study
    // workflow filter, not a safety-alert rule.

    const panel = read("components/admin/dds/dds-identified-panel.tsx")
    assert.match(panel, /return Number\.isFinite\(n\) && n >= 3/)
    assert.match(panel, /formatScore\(row\.emotional_score\)/)
    assert.match(panel, /formatScore\(row\.physician_score\)/)
    assert.match(panel, /formatScore\(row\.regimen_score\)/)
    assert.match(panel, /formatScore\(row\.interpersonal_score\)/)
    assert.match(panel, />Emotional</)
    assert.match(panel, />Physician</)
    assert.match(panel, />Regimen</)
    assert.match(panel, />Interpersonal</)
    assert.doesNotMatch(panel, /calculateDDSScores/)
  })

  it("Stampley reads stored canonical domain scores, not raw answers or 0–10 distress", () => {
    const summary = read("app/api/check-in/dds-summary/route.ts")
    assert.match(summary, /emotionalScore: true/)
    assert.match(summary, /physicianScore: true/)
    assert.match(summary, /regimenScore: true/)
    assert.match(summary, /interpersonalScore: true/)
    assert.doesNotMatch(summary, /calculateDDSScores/)
    assert.doesNotMatch(summary, /\bq1\b/)
    assert.doesNotMatch(summary, /distress/)
  })
})

describe("DDS-17 protocol UI numbering and labels", () => {
  it("onboarding displays official item numbers from qN ids, not section order", () => {
    const client = read("app/survey/dds/dds-client.tsx")
    assert.match(client, /function officialDdsItemNumber/)
    assert.match(client, /officialDdsItemNumber\(\s*question\.id\s*\)/)
    assert.match(client, /Item \{questionNumber\}/)
    assert.doesNotMatch(client, /globalQuestionNumberStart/)
    assert.match(client, /label: "A Slight Problem"/)
    assert.match(client, /label: "A Moderate Problem"/)
    assert.match(client, /label: "Somewhat Serious Problem"/)
    assert.match(client, /label: "A Serious Problem"/)
    assert.match(client, /label: "A Very Serious Problem"/)
  })

  it("onboarding and post-survey still store ids q1–q17", () => {
    const client = read("app/survey/dds/dds-client.tsx")
    for (const key of DDS_ITEM_KEYS) {
      assert.match(client, new RegExp(`id: "${key}"`))
    }

    const post = read("lib/post-survey-constants.ts")
    for (const key of DDS_ITEM_KEYS) {
      assert.match(post, new RegExp(`id: "${key}"`))
    }
    assert.match(post, /label: "A Slight Problem"/)
    assert.match(post, /label: "A Moderate Problem"/)
    assert.match(post, /label: "A Serious Problem"/)
    assert.match(post, /label: "A Very Serious Problem"/)
  })
})

describe("DDS-17 submit paths do not use parseInt", () => {
  it("onboarding submitDDS uses the shared FormData parser", () => {
    const source = read("actions/dds.ts")
    const start = source.indexOf("export async function submitDDS")
    const next = source.indexOf("export async function confirmDomain")
    const submit = source.slice(start, next)
    assert.match(submit, /parseDdsAnswersFromFormData\(formData\)/)
    assert.match(submit, /const scores = calculateDDSScores\(answers\)/)
    assert.doesNotMatch(submit, /parseInt/)
    assert.doesNotMatch(submit, /console\.(log|info|debug)\(/)
  })
})

describe("DDS-17 results page protocol interpretation", () => {
  it("uses the canonical threshold helper and does not keep custom DDS bands", () => {
    const page = read("app/survey/dds/results/page.tsx")
    assert.match(page, /meetsDdsClinicalAttentionThreshold\(totalScore\)/)
    assert.match(page, /getHighestDdsDomains\(/)
    assert.doesNotMatch(page, /function getSeverity/)
    assert.doesNotMatch(page, /getSeverity\(/)
    assert.doesNotMatch(page, /Mild/)
    assert.doesNotMatch(page, /High Distress/)
    assert.doesNotMatch(page, /Severe/)
    assert.doesNotMatch(page, /Very Severe/)
    assert.doesNotMatch(page, />= 2/)
    assert.doesNotMatch(page, />= 4/)
    assert.doesNotMatch(page, /score >= 4/)
    assert.doesNotMatch(page, /score >= 2/)
  })

  it("does not present a unique recommendation when multiple domains share the maximum", () => {
    const confirmation = read("app/survey/dds/results/domain-confirmation.tsx")
    assert.match(confirmation, /highestDomains\.length === 1/)
    assert.match(confirmation, /Tied highest mean/)
    assert.doesNotMatch(confirmation, />[\s]*Recommended[\s]*</)
    assert.match(confirmation, /confirmDomain\(selectedDomain\)/)
  })
})
