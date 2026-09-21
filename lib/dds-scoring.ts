export const DDS_ITEM_KEYS = [
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
] as const

export type DdsItemKey = (typeof DDS_ITEM_KEYS)[number]

/** Canonical stored DDS-17 domain names. Exact match only. */
export const DDS_DOMAINS = [
  "Emotional",
  "Physician",
  "Regimen",
  "Interpersonal",
] as const

export type DdsDomain = (typeof DDS_DOMAINS)[number]

export const DDS_CLINICAL_ATTENTION_THRESHOLD = 3

const DDS_DOMAIN_SET = new Set<string>(DDS_DOMAINS)

export type DDSAnswers = {
    q1: number; q2: number; q3: number; q4: number;
    q5: number; q6: number; q7: number; q8: number;
    q9: number; q10: number; q11: number; q12: number;
    q13: number; q14: number; q15: number; q16: number;
    q17: number;
  }
  
  export type DDSScores = {
    emotional: number
    physician: number
    regimen: number
    interpersonal: number
    total: number
    recommendedDomain: DdsDomain
  }

/**
 * Accepts only DDS-17 item responses 1–6.
 * Integers and exact single-digit strings ("3") are allowed.
 * parseInt-style partials ("3.9", "3abc") are rejected.
 */
export function parseDdsItemValue(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) return null
    return raw
  }

  if (typeof raw === "string" && /^[1-6]$/.test(raw)) {
    return Number(raw)
  }

  return null
}

export function parseDdsAnswers(raw: unknown): DDSAnswers | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const source = raw as Record<string, unknown>
  const answers = {} as DDSAnswers

  for (const key of DDS_ITEM_KEYS) {
    const value = parseDdsItemValue(source[key])
    if (value == null) return null
    answers[key] = value
  }

  return answers
}

export function parseDdsAnswersFromFormData(
  formData: FormData
): DDSAnswers | null {
  const raw: Record<string, unknown> = {}
  for (const key of DDS_ITEM_KEYS) {
    raw[key] = formData.get(key)
  }
  return parseDdsAnswers(raw)
}

export function isDdsDomain(value: unknown): value is DdsDomain {
  return typeof value === "string" && DDS_DOMAIN_SET.has(value)
}

export function meetsDdsClinicalAttentionThreshold(score: number): boolean {
  return Number.isFinite(score) && score >= DDS_CLINICAL_ATTENTION_THRESHOLD
}

/**
 * Returns every canonical domain whose mean equals the maximum.
 * Listing order follows DDS_DOMAINS and is not a scientific ranking.
 */
export function getHighestDdsDomains(scores: {
  emotional: number
  physician: number
  regimen: number
  interpersonal: number
}): DdsDomain[] {
  const byDomain: Record<DdsDomain, number> = {
    Emotional: scores.emotional,
    Physician: scores.physician,
    Regimen: scores.regimen,
    Interpersonal: scores.interpersonal,
  }
  const values = DDS_DOMAINS.map((domain) => byDomain[domain])
  if (values.some((value) => !Number.isFinite(value))) return []
  const max = Math.max(...values)
  return DDS_DOMAINS.filter((domain) => byDomain[domain] === max)
}

  export function calculateDDSScores(answers: DDSAnswers): DDSScores {
    const emotional = parseFloat(
      ((answers.q1 + answers.q3 + answers.q8 + answers.q11 + answers.q14) / 5).toFixed(2)
    )
    const physician = parseFloat(
      ((answers.q2 + answers.q4 + answers.q9 + answers.q15) / 4).toFixed(2)
    )
    const regimen = parseFloat(
      ((answers.q5 + answers.q6 + answers.q10 + answers.q12 + answers.q16) / 5).toFixed(2)
    )
    const interpersonal = parseFloat(
      ((answers.q7 + answers.q13 + answers.q17) / 3).toFixed(2)
    )
    const total = parseFloat(
      ((answers.q1 + answers.q2 + answers.q3 + answers.q4 + answers.q5 +
        answers.q6 + answers.q7 + answers.q8 + answers.q9 + answers.q10 +
        answers.q11 + answers.q12 + answers.q13 + answers.q14 + answers.q15 +
        answers.q16 + answers.q17) / 17).toFixed(2)
    )
  
    const scores: { domain: DdsDomain; score: number }[] = [
      { domain: "Emotional", score: emotional },
      { domain: "Regimen", score: regimen },
      { domain: "Physician", score: physician },
      { domain: "Interpersonal", score: interpersonal },
    ]
  
    // Persisted recommendedDomain remains a single string for the existing schema.
    // Insertion-order ties are a storage convenience, not a scientific ranking.
    // Use getHighestDdsDomains() when presenting which domains share the maximum.
    scores.sort((a, b) => b.score - a.score)
    const recommendedDomain = scores[0].domain
  
    return { emotional, physician, regimen, interpersonal, total, recommendedDomain }
  }
