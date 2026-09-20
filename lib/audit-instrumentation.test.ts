import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function countMatches(source: string, pattern: RegExp) {
  return source.match(new RegExp(pattern.source, "g"))?.length ?? 0
}

describe("HIPAA-3 page and route instrumentation", () => {
  it("MUST PHI pages write exactly one fail-closed page event", () => {
    const pages = [
      [
        "app/admin/users/[id]/page.tsx",
        "ADMIN_PARTICIPANT_PROFILE_VIEWED",
      ],
      ["app/admin/pre-surveys/page.tsx", "ADMIN_PRE_SURVEY_LIST_VIEWED"],
      ["app/admin/dds/page.tsx", "ADMIN_DDS_LIST_VIEWED"],
      ["app/admin/post-surveys/page.tsx", "ADMIN_POST_SURVEY_LIST_VIEWED"],
      ["app/admin/check-ins/page.tsx", "ADMIN_CHECKIN_LIST_VIEWED"],
      ["app/admin/safety/page.tsx", "ADMIN_SAFETY_VIEWED"],
      [
        "app/admin/stampley-chats/page.tsx",
        "ADMIN_STAMPLEY_TRANSCRIPT_LIST_VIEWED",
      ],
      ["app/admin/analytics/page.tsx", "ADMIN_ANALYTICS_VIEWED"],
    ] as const

    for (const [file, action] of pages) {
      const source = read(file)
      assert.equal(
        countMatches(source, /await recordPhiPageViewOrThrow/),
        1,
        `${file} should write one page-level audit`
      )
      assert.match(source, new RegExp(action))
    }
  })

  it("SHOULD admin views are fail-open", () => {
    const dashboard = read("app/admin/dashboard/page.tsx")
    const users = read("app/admin/users/page.tsx")
    const keys = read("app/admin/keys/page.tsx")
    assert.match(dashboard, /ADMIN_DASHBOARD_VIEWED/)
    assert.match(dashboard, /fail-open/)
    assert.match(users, /ADMIN_USER_DIRECTORY_VIEWED/)
    assert.match(users, /fail-open/)
    assert.match(keys, /ADMIN_STUDY_KEY_LIST_VIEWED/)
    assert.match(keys, /fail-open/)
  })

  it("export routes persist SUCCESS audit before returning CSV", () => {
    const routes = [
      [
        "app/api/admin/analytics/check-ins/export/route.ts",
        "ADMIN_CHECKIN_EXPORTED",
      ],
      [
        "app/api/admin/analytics/high-stress/export/route.ts",
        "ADMIN_HIGH_STRESS_EXPORTED",
      ],
      [
        "app/api/admin/analytics/stampley-sessions/export/route.ts",
        "ADMIN_STAMPLEY_SESSION_EXPORTED",
      ],
    ] as const

    for (const [file, action] of routes) {
      const source = read(file)
      assert.match(source, /finalizeAdminCsvExport/)
      assert.match(source, new RegExp(action))
      assert.doesNotMatch(source, /csvFileResponse\(/)
    }
  })

  it("admin mutations share a Prisma transaction with SUCCESS audit", () => {
    const source = read("actions/admin.ts")
    assert.match(source, /prisma\.\$transaction/)
    assert.match(source, /auditedCreateUser/)
    assert.match(source, /auditedDeleteUser/)
    assert.match(source, /auditedChangeUserRole/)
    assert.match(source, /auditedCreateStudyKey/)
    assert.match(source, /auditedDeleteStudyKey/)
    assert.doesNotMatch(source, /console\.error\("[^"]+",\s*error\)/)
    assert.doesNotMatch(source, /console\.error\(`/)
  })

  it("does not add an audit viewer, SECURITY_ADMIN, or retention sweeper", () => {
    const schema = read("prisma/schema.prisma")
    assert.doesNotMatch(schema, /SECURITY_ADMIN/)
    assert.doesNotMatch(read("lib/audit.ts"), /deleteMany|retention/)
    assert.doesNotMatch(read("lib/audit-admin.ts"), /\/admin\/audit/)
  })

  it("admin login success is fail-open outside authorizeCredentials", () => {
    const auth = read("lib/auth.ts")
    const authorize = read("lib/authorize-credentials.ts")
    assert.match(auth, /recordAdminLoginSucceededFailOpen/)
    assert.doesNotMatch(authorize, /AUTH_ADMIN_LOGIN_SUCCEEDED/)
    assert.doesNotMatch(authorize, /appendAuditEvent/)
  })
})
