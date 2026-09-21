import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { isCheckInDomain } from "./check-in-subscale"
import {
  authoritativeDomainFromConflictRow,
  getDomainForStudyWeek,
  getStudyWeekForNextCheckIn,
  getUsedDomainsFromPreviousWeeks,
  isDomainSelectable,
  isWeeklyDomainLocked,
  MISSING_WEEKLY_FOCUS_MESSAGE,
  PRIOR_WEEK_DOMAIN_REUSE_MESSAGE,
  resolveSubmitWeeklyDomain,
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

describe("resolveSubmitWeeklyDomain submit integrity", () => {
  const week1Emotional: WeeklyDomainRow[] = [
    { week_number: 1, domain: "Emotional" },
  ]

  it("uses the existing current-week domain and ignores a differing client request", () => {
    const result = resolveSubmitWeeklyDomain({
      weekNumber: 1,
      weeklyRows: week1Emotional,
      requestedDomain: "Regimen",
    })
    assert.deepEqual(result, {
      ok: true,
      domain: "Emotional",
      shouldPersist: false,
    })
  })

  it("ignores invalid or missing client domains when a current-week row exists", () => {
    for (const requestedDomain of ["Fake", "", null, undefined]) {
      const result = resolveSubmitWeeklyDomain({
        weekNumber: 1,
        weeklyRows: week1Emotional,
        requestedDomain,
      })
      assert.deepEqual(result, {
        ok: true,
        domain: "Emotional",
        shouldPersist: false,
      })
    }
  })

  it("rejects prior-week reuse when the current week has no row", () => {
    const result = resolveSubmitWeeklyDomain({
      weekNumber: 2,
      weeklyRows: week1Emotional,
      requestedDomain: "Emotional",
    })
    assert.deepEqual(result, {
      ok: false,
      error: PRIOR_WEEK_DOMAIN_REUSE_MESSAGE,
    })
  })

  it("accepts a valid unused domain when the current week has no row", () => {
    const result = resolveSubmitWeeklyDomain({
      weekNumber: 2,
      weeklyRows: week1Emotional,
      requestedDomain: "Regimen",
    })
    assert.deepEqual(result, {
      ok: true,
      domain: "Regimen",
      shouldPersist: true,
    })
  })

  it("rejects invalid or missing domains when the current week has no row", () => {
    for (const requestedDomain of ["Fake", "", null, undefined, "emotional"]) {
      const result = resolveSubmitWeeklyDomain({
        weekNumber: 2,
        weeklyRows: week1Emotional,
        requestedDomain,
      })
      assert.deepEqual(result, {
        ok: false,
        error: MISSING_WEEKLY_FOCUS_MESSAGE,
      })
    }
  })

  it("does not allow the current-week domain to change after an authoritative row exists", () => {
    const first = resolveSubmitWeeklyDomain({
      weekNumber: 2,
      weeklyRows: week1Emotional,
      requestedDomain: "Regimen",
    })
    assert.equal(first.ok, true)
    if (!first.ok) throw new Error("unreachable")

    const afterPersist: WeeklyDomainRow[] = [
      ...week1Emotional,
      { week_number: 2, domain: first.domain },
    ]
    const second = resolveSubmitWeeklyDomain({
      weekNumber: 2,
      weeklyRows: afterPersist,
      requestedDomain: "Physician",
    })
    assert.deepEqual(second, {
      ok: true,
      domain: "Regimen",
      shouldPersist: false,
    })
  })

  it("treats a unique-conflict winner as the stored domain, not the later request", () => {
    assert.equal(authoritativeDomainFromConflictRow("Emotional"), "Emotional")
    assert.equal(authoritativeDomainFromConflictRow("Regimen"), "Regimen")
    assert.equal(authoritativeDomainFromConflictRow("Physician"), "Physician")
    assert.equal(authoritativeDomainFromConflictRow("Interpersonal"), "Interpersonal")
    assert.equal(authoritativeDomainFromConflictRow("Fake"), null)
    assert.equal(authoritativeDomainFromConflictRow(""), null)
    assert.equal(authoritativeDomainFromConflictRow(null), null)
  })
})

describe("submit weekly-domain persistence wiring", () => {
  it("creates UserWeeklyDomain in the same transaction and re-reads after unique conflict", () => {
    const source = read("app/api/check-in/submit/route.ts")
    assert.match(source, /resolveSubmitWeeklyDomain/)
    assert.match(source, /tx\.userWeeklyDomain\.create/)
    assert.match(source, /authoritativeDomainFromConflictRow/)
    assert.match(source, /userId_weekNumber/)
    assert.match(
      source,
      /domain,\s*subscale,\s*distress/
    )
    assert.doesNotMatch(
      source,
      /tx\.userWeeklyDomain\.upsert/
    )
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
