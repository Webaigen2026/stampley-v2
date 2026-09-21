import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { isCheckInDomain } from "./check-in-subscale"
import {
  getDomainForStudyWeek,
  getStudyWeekForNextCheckIn,
  getUsedDomainsFromPreviousWeeks,
  isDomainSelectable,
  isWeeklyDomainLocked,
  STUDY_DOMAINS,
  type WeeklyDomainRow,
} from "./weekly-domain-progress"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const VALID_DOMAINS = [
  "Emotional",
  "Regimen",
  "Physician",
  "Interpersonal",
] as const

describe("check-in weekly domain allowlist", () => {
  it("accepts the four canonical stored domain values", () => {
    assert.deepEqual([...STUDY_DOMAINS], [...VALID_DOMAINS])
    for (const domain of VALID_DOMAINS) {
      assert.equal(isCheckInDomain(domain), true)
    }
  })

  it("rejects cased, padded, empty, and unknown domain values", () => {
    for (const value of [
      "emotional",
      "Other",
      "",
      null,
      undefined,
      "Emotional ",
      "Admin",
    ]) {
      assert.equal(isCheckInDomain(value), false)
    }
  })
})

describe("weekly-domain progress helpers", () => {
  const week1Emotional: WeeklyDomainRow[] = [
    { week_number: 1, domain: "Emotional" },
  ]
  const week1And2: WeeklyDomainRow[] = [
    { week_number: 1, domain: "Emotional" },
    { week_number: 2, domain: "Regimen" },
  ]

  it("returns the stored current-week domain and ignores an invalid stored value", () => {
    assert.equal(getDomainForStudyWeek(week1And2, 2), "Regimen")
    assert.equal(getDomainForStudyWeek(week1Emotional, 1), "Emotional")
    assert.equal(
      getDomainForStudyWeek([{ week_number: 2, domain: "Fake" }], 2),
      null
    )
    assert.equal(getDomainForStudyWeek([], 2), null)
  })

  it("treats a stored current-week domain as the only selectable domain once locked", () => {
    assert.equal(
      isDomainSelectable("Emotional", [], "Regimen", true),
      false
    )
    assert.equal(isDomainSelectable("Regimen", [], "Regimen", true), true)
  })

  it("rejects reuse of a prior-week domain and accepts an unused later-week domain", () => {
    const usedPrevious = getUsedDomainsFromPreviousWeeks(week1Emotional, 2)
    assert.deepEqual(usedPrevious, ["Emotional"])
    assert.equal(isDomainSelectable("Emotional", usedPrevious, null, false), false)
    assert.equal(isDomainSelectable("Regimen", usedPrevious, null, false), true)
    assert.equal(
      getUsedDomainsFromPreviousWeeks(week1And2, 2).includes("Regimen"),
      false
    )
  })

  it("locks the current week only after a check-in exists in that week", () => {
    assert.equal(isWeeklyDomainLocked(0, 1, "Emotional"), false)
    assert.equal(isWeeklyDomainLocked(1, 1, "Emotional"), true)
    assert.equal(isWeeklyDomainLocked(5, 2, "Regimen"), false)
    assert.equal(isWeeklyDomainLocked(6, 2, "Regimen"), true)
    assert.equal(isWeeklyDomainLocked(6, 2, null), false)
  })

  it("maps completed check-in counts onto the current four-week schedule", () => {
    assert.equal(getStudyWeekForNextCheckIn(0), 1)
    assert.equal(getStudyWeekForNextCheckIn(4), 1)
    assert.equal(getStudyWeekForNextCheckIn(5), 2)
    assert.equal(getStudyWeekForNextCheckIn(19), 4)
    assert.equal(getStudyWeekForNextCheckIn(20), 4)
  })
})

describe("resolveWeeklyDomainForUser current composition", () => {
  it("still prefers a stored week domain over the client-requested domain", () => {
    const source = read("lib/resolve-weekly-domain.ts")
    const start = source.indexOf("export async function resolveWeeklyDomainForUser")
    assert.notEqual(start, -1)
    const fn = source.slice(start)

    assert.match(fn, /const weekDomain = getDomainForStudyWeek/)
    assert.match(fn, /const usedPrevious = getUsedDomainsFromPreviousWeeks/)
    assert.match(
      fn,
      /if \(weekDomain\) \{\s*return \{ domain: weekDomain/
    )
    assert.match(fn, /isCheckInDomain\(requestedDomain\)/)
    assert.match(fn, /!usedPrevious\.includes\(requestedDomain\)/)
  })
})
