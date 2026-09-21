import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildUrlSafeAnalyticsQueryString,
  parseUrlSafeAnalyticsFilters,
} from "./admin-analytics-url"
import { parseCodedExportFilters } from "./admin-export-filters"
import {
  normalizeIdentifiedSearchQuery,
  stripIdentifiedSearchParam,
} from "./admin-identified-search"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const IDENTIFIED_SURFACES = [
  "app/admin/analytics/page.tsx",
  "app/admin/stampley-chats/page.tsx",
  "app/admin/dds/page.tsx",
  "app/admin/post-surveys/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/keys/page.tsx",
] as const

const IDENTIFIED_CLIENTS = [
  "components/admin/analytics/analytics-identified-panel.tsx",
  "components/admin/stampley-chats/stampley-chats-identified-panel.tsx",
  "components/admin/dds/dds-identified-panel.tsx",
  "components/admin/post-surveys/post-survey-identified-panel.tsx",
  "components/admin/users/users-directory.tsx",
  "components/admin/keys/keys-directory.tsx",
  "components/admin/identified-search-field.tsx",
  "components/admin/identified-search-results.tsx",
  "components/admin/strip-identified-search-param.tsx",
] as const

describe("HIPAA-5.7A URL-safe analytics filters", () => {
  it("never serializes identified q into analytics or export query strings", () => {
    const qs = buildUrlSafeAnalyticsQueryString({
      q: "participant@example.com",
      from: "2026-01-01",
      to: "2026-01-31",
      domain: "Emotional",
      highStress: true,
      week: 2,
    })
    assert.equal(
      qs,
      "?from=2026-01-01&to=2026-01-31&domain=Emotional&highStress=true&week=2"
    )
    assert.doesNotMatch(qs, /q=/)
    assert.doesNotMatch(qs, /participant@example\.com/)
    assert.doesNotMatch(qs, /email=/)
    assert.doesNotMatch(qs, /studyId=/)

    const parsed = parseUrlSafeAnalyticsFilters(
      new URLSearchParams("q=participant@example.com&week=2")
    )
    assert.equal(parsed.q, null)
    assert.equal(parsed.week, 2)

    const exportParsed = parseCodedExportFilters(
      new URLSearchParams("q=participant@example.com&from=2026-01-01")
    )
    assert.equal(exportParsed.ok, true)
    if (exportParsed.ok) {
      assert.equal(exportParsed.filters.q, null)
      assert.equal(exportParsed.filters.from, "2026-01-01")
    }
  })

  it("strips leftover q from location.search without keeping the value", () => {
    assert.equal(
      stripIdentifiedSearchParam("?q=participant@example.com&week=2"),
      "?week=2"
    )
    assert.equal(stripIdentifiedSearchParam("?q=AIDES-SECRET"), "")
    assert.equal(
      normalizeIdentifiedSearchQuery("  participant@example.com  "),
      "participant@example.com"
    )
    assert.equal(normalizeIdentifiedSearchQuery("   "), null)
  })
})

describe("HIPAA-5.7A admin identified search is memory-only", () => {
  it("six admin surfaces no longer serialize identified search into GET URLs", () => {
    for (const file of IDENTIFIED_SURFACES) {
      const source = read(file)
      assert.doesNotMatch(source, /name=["']q["']/, file)
      assert.doesNotMatch(source, /params\.set\(["']q["']/, file)
      assert.match(source, /StripIdentifiedSearchParam/, file)
    }

    const analytics = read("app/admin/analytics/page.tsx")
    assert.match(analytics, /buildUrlSafeAnalyticsQueryString/)
    assert.match(analytics, /parseUrlSafeAnalyticsFilters/)
    assert.match(analytics, /exportQs/)
    assert.doesNotMatch(analytics, /filters\.q/)
    assert.match(analytics, /from: filters\.from/)

    const chats = read("app/admin/stampley-chats/page.tsx")
    assert.match(chats, /parseUrlSafeAnalyticsFilters/)
    assert.doesNotMatch(chats, /name=["']q["']/)

    const dds = read("app/admin/dds/page.tsx")
    assert.match(dds, /q: null/)
    assert.match(dds, /name=["']highDistress["']/)

    const postSurveys = read("app/admin/post-surveys/page.tsx")
    assert.match(postSurveys, /name=["']phqSeverity["']/)
    assert.match(postSurveys, /name=["']futureContact["']/)
    assert.match(postSurveys, /q: null/)

    const users = read("app/admin/users/page.tsx")
    assert.match(users, /q: null/)
    assert.doesNotMatch(users, /router\.push/)

    const keys = read("app/admin/keys/page.tsx")
    assert.match(keys, /q: null/)
    assert.doesNotMatch(keys, /router\.push/)
  })

  it("client search controls never write q into the URL or browser storage", () => {
    for (const file of IDENTIFIED_CLIENTS) {
      const source = read(file)
      assert.doesNotMatch(source, /params\.set\(["']q["']/, file)
      assert.doesNotMatch(source, /localStorage/, file)
      assert.doesNotMatch(source, /sessionStorage/, file)
      assert.doesNotMatch(source, /indexedDB/, file)
      assert.doesNotMatch(source, /document\.cookie/, file)
      assert.doesNotMatch(source, /dangerouslySetInnerHTML/, file)
    }

    const users = read("components/admin/users/users-directory.tsx")
    assert.match(users, /params\.delete\(["']q["']\)/)
    assert.match(users, /searchAdminUsers/)
    assert.doesNotMatch(users, /params\.set\(["']q["']/)

    const keys = read("components/admin/keys/keys-directory.tsx")
    assert.match(keys, /params\.delete\(["']q["']\)/)
    assert.match(keys, /searchAdminKeys/)
    assert.doesNotMatch(keys, /params\.set\(["']q["']/)

    const field = read("components/admin/identified-search-field.tsx")
    assert.doesNotMatch(field, /name=["']q["']/)
    assert.match(field, /Clear search/)

    const analyticsPanel = read(
      "components/admin/analytics/analytics-identified-panel.tsx"
    )
    const analyticsResults = read(
      "components/admin/analytics/analytics-results.tsx"
    )
    assert.doesNotMatch(analyticsPanel, /admin-analytics-data/)
    assert.doesNotMatch(analyticsPanel, /admin-analytics-filters/)
    assert.doesNotMatch(analyticsResults, /admin-analytics-data/)
    assert.doesNotMatch(analyticsResults, /admin-analytics-filters/)
    assert.doesNotMatch(users, /admin-directory-search/)
    assert.doesNotMatch(keys, /admin-directory-search/)
  })

  it("server actions re-check existing capabilities and do not log search values", () => {
    const actions = read("actions/admin-identified-search.ts")
    assert.match(actions, /requireAdminCapability\("canViewAggregateAnalytics"\)/)
    assert.match(actions, /requireAdminCapability\("canViewTranscripts"\)/)
    assert.match(actions, /canViewOperationalParticipantData/)
    assert.match(actions, /requireAdminCapability\("canViewParticipantDirectory"\)/)
    assert.match(actions, /requireAdminCapability\("canManageStudyKeys"\)/)
    assert.match(actions, /analyticsFiltersForView/)
    assert.match(actions, /includesNarratives:\s*false/)
    assert.match(actions, /includesTranscripts:\s*false/)
    assert.match(actions, /filterKeysFromAnalytics/)
    assert.match(actions, /filterKeysFromFlags/)
    assert.match(actions, /unstable_noStore/)
    assert.doesNotMatch(actions, /console\.(log|info|warn|error)/)
    assert.doesNotMatch(actions, /error\.message/)
    assert.doesNotMatch(actions, /JSON\.stringify\(input\)/)
  })
})

describe("HIPAA-5.7A export GET ignores identified q", () => {
  it("all three coded export routes use the parser that drops q", () => {
    for (const file of [
      "app/api/admin/analytics/check-ins/export/route.ts",
      "app/api/admin/analytics/stampley-sessions/export/route.ts",
      "app/api/admin/analytics/high-stress/export/route.ts",
    ]) {
      const source = read(file)
      assert.match(source, /parseCodedExportFilters/)
      assert.match(source, /requireCodedExportApi/)
      assert.match(source, /persistExportAuditOrThrow|finalizeAdminCsvExport/)
      assert.match(source, /identified: false/)
      assert.doesNotMatch(source, /filters\.q/)
      assert.doesNotMatch(source, /openReflection/)
      assert.doesNotMatch(source, /copingAction/)
      assert.doesNotMatch(source, /reflection/)
      assert.doesNotMatch(source, /summary/)
      assert.doesNotMatch(source, /messages/)
    }

    const parser = read("lib/admin-export-filters.ts")
    assert.match(parser, /withoutIdentifiedSearch/)
  })
})

describe("HIPAA-5.7A password reset token history", () => {
  it("captures the token once then scrubs it from the URL", () => {
    const source = read("app/(auth)/reset-password/page.tsx")
    assert.match(source, /useState\(\(\) => searchParams\.get\("token"\)\)/)
    assert.match(source, /history\.replaceState/)
    assert.match(source, /searchParams\.delete\("token"\)/)
    assert.match(source, /formData\.append\("token", token/)
    assert.doesNotMatch(source, /localStorage/)
    assert.doesNotMatch(source, /sessionStorage/)
    assert.doesNotMatch(source, /document\.cookie/)
    assert.doesNotMatch(source, /router\.replace/)
    assert.doesNotMatch(source, /router\.push/)
  })
})
