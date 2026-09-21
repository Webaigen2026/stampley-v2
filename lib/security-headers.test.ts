import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { csvFileResponse } from "./admin-export-response"
import nextConfig, {
  GLOBAL_SECURITY_HEADERS,
  SECURITY_CSP_REPORT_ONLY,
  SECURITY_PERMISSIONS_POLICY,
} from "../next.config"

function headerMap(
  headers: ReadonlyArray<{ key: string; value: string }>
): Map<string, string> {
  return new Map(headers.map((header) => [header.key, header.value]))
}

function cspDirectiveMap(csp: string): Map<string, string[]> {
  const directives = new Map<string, string[]>()
  for (const part of csp.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) continue
    const [name, ...sources] = tokens
    directives.set(name, sources)
  }
  return directives
}

describe("HIPAA-5.5 Phase 1 global security headers", () => {
  it("exposes the configured next.config headers() policy", async () => {
    assert.equal(typeof nextConfig.headers, "function")
    const configured = await nextConfig.headers!()
    assert.equal(configured.length, 1)
    assert.equal(configured[0].source, "/:path*")
    assert.deepEqual(configured[0].headers, [...GLOBAL_SECURITY_HEADERS])
  })

  it("sets nosniff, referrer, and enforced clickjacking headers", async () => {
    const headers = headerMap((await nextConfig.headers!())[0].headers)
    assert.equal(headers.get("X-Content-Type-Options"), "nosniff")
    assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
    assert.equal(headers.get("X-Frame-Options"), "DENY")
  })

  it("sets the minimum Permissions-Policy", () => {
    assert.equal(
      SECURITY_PERMISSIONS_POLICY,
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=(), clipboard-write=(self)"
    )
    for (const disabled of [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "serial=()",
      "bluetooth=()",
      "accelerometer=()",
      "gyroscope=()",
      "magnetometer=()",
      "display-capture=()",
    ]) {
      assert.equal(SECURITY_PERMISSIONS_POLICY.includes(disabled), true, disabled)
    }
    assert.match(SECURITY_PERMISSIONS_POLICY, /clipboard-write=\(self\)/)
  })

  it("ships CSP as Report-Only and does not enforce Content-Security-Policy", async () => {
    const headers = headerMap((await nextConfig.headers!())[0].headers)
    assert.equal(headers.has("Content-Security-Policy-Report-Only"), true)
    assert.equal(headers.has("Content-Security-Policy"), false)
    assert.equal(
      headers.get("Content-Security-Policy-Report-Only"),
      SECURITY_CSP_REPORT_ONLY
    )
    assert.equal(SECURITY_CSP_REPORT_ONLY.includes(","), false)
  })

  it("contains the audited CSP directives and no extra dangerous sources", () => {
    const directives = cspDirectiveMap(SECURITY_CSP_REPORT_ONLY)
    assert.deepEqual(directives.get("default-src"), ["'self'"])
    assert.deepEqual(directives.get("base-uri"), ["'self'"])
    assert.deepEqual(directives.get("object-src"), ["'none'"])
    assert.deepEqual(directives.get("frame-ancestors"), ["'none'"])
    assert.deepEqual(directives.get("form-action"), ["'self'"])
    assert.deepEqual(directives.get("script-src"), ["'self'", "'unsafe-inline'"])
    assert.deepEqual(directives.get("style-src"), [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ])
    assert.deepEqual(directives.get("img-src"), ["'self'"])
    assert.deepEqual(directives.get("font-src"), [
      "'self'",
      "https://fonts.gstatic.com",
    ])
    assert.deepEqual(directives.get("connect-src"), ["'self'"])
    assert.deepEqual(directives.get("media-src"), ["'self'"])
    assert.deepEqual(directives.get("frame-src"), ["'none'"])
    assert.deepEqual(directives.get("worker-src"), ["'self'"])

    const allSources = [...directives.values()].flat()
    assert.equal(allSources.includes("*"), false)
    assert.equal(allSources.includes("'unsafe-eval'"), false)
    assert.equal(allSources.includes("data:"), false)
    assert.equal(allSources.includes("blob:"), false)
    assert.equal(allSources.includes("api.openai.com"), false)
    assert.equal(
      (directives.get("script-src") ?? []).includes(
        "https://fonts.googleapis.com"
      ),
      false
    )
    assert.equal(
      (directives.get("connect-src") ?? []).includes("https://fonts.gstatic.com"),
      false
    )
  })

  it("does not introduce global cache or application HSTS headers", async () => {
    const headers = headerMap((await nextConfig.headers!())[0].headers)
    assert.equal(headers.has("Cache-Control"), false)
    assert.equal(headers.has("Pragma"), false)
    assert.equal(headers.has("Expires"), false)
    assert.equal(headers.has("Strict-Transport-Security"), false)
  })

  it("keeps existing CSV nosniff behavior", () => {
    const response = csvFileResponse(
      "study_id\nUNASSIGNED",
      "stampley-check-ins-2026-09-20.csv"
    )
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff")
    assert.equal(
      response.headers.get("Content-Disposition"),
      'attachment; filename="stampley-check-ins-2026-09-20.csv"'
    )
  })
})
