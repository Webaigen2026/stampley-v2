import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function functionSource(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`)
  assert.notEqual(start, -1, `missing ${name}`)
  const next = source.indexOf("export async function ", start + 1)
  return next === -1 ? source.slice(start) : source.slice(start, next)
}

describe("HIPAA-5.6.1 unused participant DTO minimization", () => {
  it("dds-summary browser payload is only the four domain scores", () => {
    const ddsSummary = {
      emotionalScore: 2.1,
      regimenScore: 2.2,
      physicianScore: 2.3,
      interpersonalScore: 2.4,
    }
    const payload = { ddsSummary }

    assert.deepEqual(Object.keys(payload), ["ddsSummary"])
    assert.deepEqual(Object.keys(ddsSummary), [
      "emotionalScore",
      "regimenScore",
      "physicianScore",
      "interpersonalScore",
    ])
    assert.equal("totalScore" in ddsSummary, false)
    assert.equal("highestDomain" in ddsSummary, false)

    const source = read("app/api/check-in/dds-summary/route.ts")
    assert.match(
      source,
      /return jsonWithSensitiveCache\(\{\s*ddsSummary: \{\s*emotionalScore,\s*regimenScore,\s*physicianScore,\s*interpersonalScore,\s*\},\s*\}\)/
    )
    assert.doesNotMatch(source, /totalScore/)
    assert.doesNotMatch(source, /highestDomain/)
    assert.match(source, /emotionalScore: true/)
    assert.match(source, /regimenScore: true/)
    assert.match(source, /physicianScore: true/)
    assert.match(source, /interpersonalScore: true/)
  })

  it("submitDDS success return is { success: true } and does not include scores", () => {
    const success = { success: true as const }

    assert.deepEqual(success, { success: true })
    assert.deepEqual(Object.keys(success), ["success"])
    assert.equal("scores" in success, false)

    const submit = functionSource(read("actions/dds.ts"), "submitDDS")
    assert.match(submit, /return \{ success: true \}/)
    assert.doesNotMatch(submit, /return \{ success: true,\s*scores/)
    assert.doesNotMatch(submit, /scores\s*\}/)
    assert.match(submit, /const scores = calculateDDSScores\(answers\)/)
    assert.match(submit, /totalScore: scores\.total/)
    assert.match(submit, /recommendedDomain: scores\.recommendedDomain/)

    const client = read("app/survey/dds/dds-client.tsx")
    assert.doesNotMatch(client, /\.scores/)
  })

  it("weekly-domain GET browser payload is only currentWeekDomain and usedPreviousDomains", () => {
    const payload = {
      currentWeekDomain: "Emotional",
      usedPreviousDomains: [] as string[],
    }

    assert.deepEqual(Object.keys(payload).sort(), [
      "currentWeekDomain",
      "usedPreviousDomains",
    ])
    assert.equal("currentWeek" in payload, false)
    assert.equal("isLocked" in payload, false)
    assert.equal("totalCompleted" in payload, false)

    const get = functionSource(
      read("app/api/check-in/weekly-domain/route.ts"),
      "GET"
    )
    assert.match(
      get,
      /return jsonWithSensitiveCache\(\{\s*currentWeekDomain,\s*usedPreviousDomains,\s*\}\)/
    )
    assert.doesNotMatch(
      get,
      /return jsonWithSensitiveCache\(\{[\s\S]*\bcurrentWeek,/
    )
    assert.doesNotMatch(get, /\bisLocked\b/)
    assert.doesNotMatch(
      get,
      /return jsonWithSensitiveCache\(\{[\s\S]*\btotalCompleted,/
    )
    assert.match(get, /const totalCompleted = await fetchUserTotalCheckins/)
    assert.match(get, /const currentWeek = getStudyWeekForNextCheckIn/)

    const post = functionSource(
      read("app/api/check-in/weekly-domain/route.ts"),
      "POST"
    )
    assert.match(post, /isWeeklyDomainLocked/)
    assert.match(post, /weekNumber: currentWeek/)
    assert.match(
      post,
      /return jsonWithSensitiveCache\(\{\s*success: true,\s*weekNumber: currentWeek,\s*domain,\s*\}\)/
    )
  })

  it("Stampley generate browser payload is only success and response", () => {
    const payload = {
      success: true as const,
      response: { message: "ok" },
    }

    assert.deepEqual(Object.keys(payload).sort(), ["response", "success"])
    assert.equal("conversationPhase" in payload, false)
    assert.equal("highStress" in payload, false)

    const source = read("app/api/stampley/generate/route.ts")
    const successReturn =
      /return jsonWithSensitiveCache\(\{\s*success: true,\s*response: stampleyResponse,\s*\}\)/
    assert.match(source, successReturn)
    const returned = source.match(successReturn)?.[0] ?? ""
    assert.doesNotMatch(returned, /conversationPhase/)
    assert.doesNotMatch(returned, /highStress/)
    assert.doesNotMatch(source, /conversationPhase:/)
    assert.match(source, /const highStress = isHighStress\(distressScore\)/)
    assert.match(source, /highStress: openaiContext\.highStress/)
    assert.match(
      source,
      /getStampleyFallbackResponse\(\s*openaiContext\.phase,\s*openaiContext\.highStress/
    )
    assert.match(source, /resolveCheckInMutationAccess/)
  })

  it("Stampley sidebar DdsSummary type no longer includes unused summary fields", () => {
    const source = read("components/stampley/stampley-sidebar.tsx")
    const type = source.match(/export type DdsSummary = \{([\s\S]*?)\}/)
    assert.ok(type)
    assert.deepEqual(
      [...type[1].matchAll(/^\s*(\w+):/gm)].map((match) => match[1]),
      [
        "emotionalScore",
        "regimenScore",
        "physicianScore",
        "interpersonalScore",
      ]
    )
    assert.doesNotMatch(type[1], /totalScore/)
    assert.doesNotMatch(type[1], /highestDomain/)
    assert.match(source, /ddsSummary\.emotionalScore/)
    assert.match(source, /ddsSummary\.regimenScore/)
    assert.match(source, /ddsSummary\.physicianScore/)
    assert.match(source, /ddsSummary\.interpersonalScore/)
  })
})
