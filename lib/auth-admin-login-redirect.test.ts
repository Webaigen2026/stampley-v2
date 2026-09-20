import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  canAccessAdminPath,
  isStaffRole,
} from "./admin-capabilities"
import {
  CANONICAL_SIGN_IN_PATH,
  isSafeInternalCallbackUrl,
} from "./auth.config"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

describe("HIPAA-4.3 admin login redirect", () => {
  it("uses the canonical /login path and does not keep a missing /admin/login page", () => {
    assert.equal(CANONICAL_SIGN_IN_PATH, "/login")
    assert.equal(existsSync(join(ROOT, "app/admin/login/page.tsx")), false)
    const source = read("lib/auth.config.ts")
    assert.match(source, /signIn:\s*CANONICAL_SIGN_IN_PATH/)
    assert.doesNotMatch(source, /new URL\("\/admin\/login"/)
    assert.match(source, /canonicalSignInRedirect/)
    assert.match(read("lib/admin-authz.ts"), /redirect\("\/login"\)/)
  })

  it("preserves only safe same-origin callback paths", () => {
    assert.equal(isSafeInternalCallbackUrl("/admin/dashboard"), true)
    assert.equal(isSafeInternalCallbackUrl("/admin/analytics?week=2"), true)
    assert.equal(isSafeInternalCallbackUrl("/dashboard"), true)
    assert.equal(isSafeInternalCallbackUrl("/login"), true)
    assert.equal(isSafeInternalCallbackUrl("https://evil.test/login"), false)
    assert.equal(isSafeInternalCallbackUrl("//evil.test/login"), false)
    assert.equal(isSafeInternalCallbackUrl("javascript:alert(1)"), false)
    assert.equal(isSafeInternalCallbackUrl("data:text/html,hello"), false)
    assert.equal(isSafeInternalCallbackUrl("/\\evil"), false)
    assert.equal(isSafeInternalCallbackUrl("/admin/dashboard\nhttps://evil.test"), false)
    assert.equal(isSafeInternalCallbackUrl("/api/auth/callback/credentials"), false)
  })

  it("does not create a separate admin auth path or grant participants admin access", () => {
    assert.equal(canAccessAdminPath("PARTICIPANT", "/admin/dashboard"), false)
    assert.equal(canAccessAdminPath("PARTICIPANT", "/login"), false)
    assert.equal(isStaffRole("ADMIN"), true)
    assert.equal(isStaffRole("STUDY_COORDINATOR"), true)
    assert.equal(isStaffRole("CLINICAL_REVIEWER"), true)
    assert.equal(isStaffRole("PARTICIPANT"), false)
    const middleware = read("middleware.ts")
    assert.doesNotMatch(middleware, /\/admin\/login/)
    assert.match(read("app/(auth)/login/page.tsx"), /signIn\("credentials"/)
    assert.doesNotMatch(read("app/(auth)/login/page.tsx"), /admin\/login/)
  })
})
