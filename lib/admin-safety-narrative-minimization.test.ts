import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { hasCapability } from "./admin-capabilities"
import { canReadCheckInNarrative } from "./admin-check-in-narrative-get"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function recentHighFindMany(source: string) {
  const start = source.indexOf("prisma.checkInSubmission.findMany")
  assert.notEqual(start, -1)
  const selectStart = source.indexOf("select: {", start)
  assert.notEqual(selectStart, -1)
  const selectEnd = source.indexOf("})", selectStart)
  assert.notEqual(selectEnd, -1)
  return source.slice(start, selectEnd)
}

function recentHighMapper(source: string) {
  const start = source.indexOf("const recentHighResult = {")
  assert.notEqual(start, -1)
  const end = source.indexOf("const totalAlerts", start)
  assert.notEqual(end, -1)
  return source.slice(start, end)
}

function safetyEscalationsQuery(source: string) {
  const start = source.indexOf("SELECT")
  assert.notEqual(start, -1)
  const end = source.indexOf("prisma.$queryRaw", start + 1)
  assert.notEqual(end, -1)
  return source.slice(start, end)
}

function atRiskQuery(source: string) {
  const first = source.indexOf("prisma.$queryRaw")
  const second = source.indexOf("prisma.$queryRaw", first + 1)
  assert.notEqual(second, -1)
  const end = source.indexOf("prisma.checkInSubmission.findMany")
  assert.notEqual(end, -1)
  return source.slice(second, end)
}

describe("HIPAA-5.6.2C Safety recent-high query minimization", () => {
  it("does not select reflection or unused consecutiveHighDistressDays and does select id", () => {
    const page = read("app/admin/safety/page.tsx")
    const query = recentHighFindMany(page)
    assert.match(query, /id:\s*true/)
    assert.match(query, /distress:\s*true/)
    assert.match(query, /domain:\s*true/)
    assert.match(query, /checkInDate:\s*true/)
    assert.match(query, /needsSafetyEscalation:\s*true/)
    assert.match(query, /email:\s*true/)
    assert.doesNotMatch(query, /reflection:\s*true/)
    assert.doesNotMatch(query, /copingAction:\s*true/)
    assert.doesNotMatch(query, /consecutiveHighDistressDays/)
    assert.doesNotMatch(query, /userId:\s*true/)
    assert.doesNotMatch(query, /studyId:\s*true/)
    assert.match(query, /distress:\s*\{\s*gte:\s*7\s*\}/)
    assert.match(query, /take:\s*10/)
    assert.match(query, /createdAt:\s*"desc"/)
  })

  it("recent-high mapper and render path cannot carry reflection", () => {
    const page = read("app/admin/safety/page.tsx")
    const mapper = recentHighMapper(page)
    assert.match(mapper, /\bid:\s*item\.id\b/)
    assert.match(mapper, /email:\s*item\.user\.email/)
    assert.doesNotMatch(mapper, /reflection/)
    assert.doesNotMatch(mapper, /copingAction/)
    assert.doesNotMatch(mapper, /consecutive_high_distress_days/)
    assert.doesNotMatch(mapper, /userId/)
    assert.doesNotMatch(page, /c\.reflection/)
    assert.doesNotMatch(page, /item\.reflection/)
    assert.match(page, /SafetyReflectionCell/)
    assert.match(page, /checkInId=\{c\.id\}/)
  })

  it("Safety page still uses canViewSafetyData and metadata-only page audit", () => {
    const page = read("app/admin/safety/page.tsx")
    assert.match(page, /requireAdminPage\("canViewSafetyData"\)/)
    assert.match(page, /ADMIN_SAFETY_VIEWED/)
    assert.match(page, /includesNarratives:\s*false/)
    assert.equal((page.match(/await recordPhiPageViewOrThrow/g) ?? []).length, 1)
    assert.doesNotMatch(page, /canViewSafetyData\s*\|\|/)
    assert.doesNotMatch(page, /canViewCheckInNarratives/)
  })

  it("leaves Safety Escalations and At Risk aggregates unchanged", () => {
    const page = read("app/admin/safety/page.tsx")
    const escalations = safetyEscalationsQuery(page)
    const atRisk = atRiskQuery(page)
    assert.match(escalations, /needs_safety_escalation = TRUE/)
    assert.match(escalations, /MAX\(c\.consecutive_high_distress_days\) as consecutive_days/)
    assert.doesNotMatch(escalations, /c\.reflection/)
    assert.match(atRisk, /c\.distress >= 7/)
    assert.match(atRisk, /CURRENT_DATE - INTERVAL '7 days'/)
    assert.doesNotMatch(atRisk, /c\.reflection/)
    assert.match(page, /mailto:\$\{text\(u\.email\)\}/)
  })
})

describe("HIPAA-5.6.2C Safety reflection cell", () => {
  it("fetches only after explicit click and never on mount", () => {
    const source = read("components/admin/safety/safety-reflection-cell.tsx")
    assert.match(source, /"use client"/)
    assert.match(source, /export function SafetyReflectionCell/)
    assert.match(source, /checkInId/)
    assert.match(source, /onToggleReflection/)
    assert.match(source, /\/api\/admin\/check-ins\//)
    assert.match(source, /cache:\s*"no-store"/)
    assert.match(source, /if \(loading\) return/)
    assert.match(source, /View reflection/)
    assert.match(source, /Hide reflection/)
    assert.match(source, /Unable to load reflection\./)
    assert.match(source, /Try again/)
    assert.doesNotMatch(source, /useEffect/)
    assert.doesNotMatch(source, /IntersectionObserver/)
    assert.doesNotMatch(source, /prefetch/i)
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/i)
    assert.doesNotMatch(
      source,
      /export function SafetyReflectionCell\([^)]*reflection/
    )
  })

  it("renders reflection only and ignores copingAction", () => {
    const source = read("components/admin/safety/safety-reflection-cell.tsx")
    assert.match(source, /raw\.reflection/)
    assert.doesNotMatch(source, /copingAction/)
    assert.doesNotMatch(source, /Coping Action/)
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i)
  })
})

describe("HIPAA-5.6.2C authorization and 5.6.2B reuse", () => {
  it("keeps Safety page capability distinct from the reused narrative endpoint", () => {
    assert.equal(hasCapability("ADMIN", "canViewSafetyData"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewSafetyData"), true)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewSafetyData"), false)
    assert.equal(hasCapability("PARTICIPANT", "canViewSafetyData"), false)
    assert.equal(canReadCheckInNarrative("ADMIN"), true)
    assert.equal(canReadCheckInNarrative("CLINICAL_REVIEWER"), true)
    assert.equal(canReadCheckInNarrative("STUDY_COORDINATOR"), false)
    assert.equal(canReadCheckInNarrative("PARTICIPANT"), false)
    assert.equal(canReadCheckInNarrative(null), false)

    const route = read("app/api/admin/check-ins/[id]/route.ts")
    const helper = read("lib/admin-check-in-narrative-get.ts")
    assert.match(helper, /canViewCheckInNarratives/)
    assert.doesNotMatch(route, /canViewSafetyData/)
    assert.doesNotMatch(helper, /canViewSafetyData/)
    assert.match(route, /jsonWithSensitiveCache/)
    assert.match(route, /recordPhiPageViewOrThrow/)
    assert.match(route, /includesNarratives:\s*true/)
  })
})
