import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  csvFileResponse,
  genericExportFailureResponse,
  genericExportRejectedResponse,
} from "./admin-export-response"
import {
  SENSITIVE_DOCUMENT_MIDDLEWARE_MATCHER,
  SENSITIVE_RESPONSE_HEADERS,
  applySensitiveCacheHeaders,
  hasSensitiveCachePolicy,
  isPublicCacheEligiblePath,
  isSensitiveDocumentPath,
  jsonWithSensitiveCache,
  withSensitiveAuthResponse,
} from "./sensitive-cache-headers"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const CHECK_IN_ROUTES = [
  "app/api/check-in/today/route.ts",
  "app/api/check-in/weekly-domain/route.ts",
  "app/api/check-in/dds-summary/route.ts",
  "app/api/check-in/study-context/route.ts",
  "app/api/check-in/submit/route.ts",
] as const

const STAMPLEY_ROUTES = [
  "app/api/stampley/generate/route.ts",
  "app/api/stampley/session/route.ts",
] as const

const ADMIN_STAMPLEY_TRANSCRIPT_ROUTE =
  "app/api/admin/stampley-sessions/[id]/route.ts"

describe("HIPAA-5.4 sensitive cache policy", () => {
  it("includes private, no-store, and max-age=0 without public or s-maxage", () => {
    const headers = new Headers(SENSITIVE_RESPONSE_HEADERS)
    assert.equal(hasSensitiveCachePolicy(headers), true)
    const cacheControl = headers.get("Cache-Control") ?? ""
    assert.match(cacheControl, /private/i)
    assert.match(cacheControl, /no-store/i)
    assert.match(cacheControl, /max-age=0/i)
    assert.doesNotMatch(cacheControl, /\bpublic\b/i)
    assert.doesNotMatch(cacheControl, /s-maxage/i)
    assert.equal(headers.get("Pragma"), "no-cache")
    assert.equal(headers.get("Expires"), "0")
  })

  it("rejects public and shared-cache directives", () => {
    const publicHeaders = new Headers({
      "Cache-Control": "public, max-age=0, must-revalidate",
    })
    const sharedHeaders = new Headers({
      "Cache-Control": "private, no-store, s-maxage=60",
    })
    assert.equal(hasSensitiveCachePolicy(publicHeaders), false)
    assert.equal(hasSensitiveCachePolicy(sharedHeaders), false)
  })
})

describe("HIPAA-5.4 check-in and Stampley JSON responses", () => {
  it("attaches sensitive headers to JSON without changing status or body", async () => {
    const response = jsonWithSensitiveCache(
      { ddsSummary: { totalScore: 2.4 } },
      { status: 200 }
    )
    assert.equal(response.status, 200)
    assert.equal(hasSensitiveCachePolicy(response.headers), true)
    assert.deepEqual(await response.json(), { ddsSummary: { totalScore: 2.4 } })
  })

  it("applies the same policy to unauthorized and error JSON", async () => {
    const unauthorized = jsonWithSensitiveCache(
      { error: "Unauthorized" },
      { status: 401 }
    )
    const failed = jsonWithSensitiveCache(
      { error: "Failed to generate response" },
      { status: 500 }
    )
    assert.equal(unauthorized.status, 401)
    assert.equal(failed.status, 500)
    assert.equal(hasSensitiveCachePolicy(unauthorized.headers), true)
    assert.equal(hasSensitiveCachePolicy(failed.headers), true)
    assert.deepEqual(await unauthorized.json(), { error: "Unauthorized" })
  })

  it("uses the shared helper on every check-in response path", () => {
    for (const file of CHECK_IN_ROUTES) {
      const source = read(file)
      assert.match(source, /jsonWithSensitiveCache/)
      assert.doesNotMatch(source, /NextResponse\.json/)
    }
  })

  it("uses the shared helper on Stampley generate and session responses", () => {
    for (const file of STAMPLEY_ROUTES) {
      const source = read(file)
      assert.match(source, /jsonWithSensitiveCache/)
      assert.doesNotMatch(source, /NextResponse\.json/)
    }
  })

  it("uses the shared helper on admin Stampley transcript detail responses", () => {
    const source = read(ADMIN_STAMPLEY_TRANSCRIPT_ROUTE)
    assert.match(source, /jsonWithSensitiveCache/)
    assert.doesNotMatch(source, /NextResponse\.json/)
  })

  it("uses the shared helper on admin check-in narrative detail responses", () => {
    const source = read("app/api/admin/check-ins/[id]/route.ts")
    assert.match(source, /jsonWithSensitiveCache/)
    assert.doesNotMatch(source, /NextResponse\.json/)
  })
})

describe("HIPAA-5.4 admin and coded export responses", () => {
  it("keeps coded CSV as a non-public attachment with no-store", () => {
    const filename = "stampley-check-ins-2026-09-20.csv"
    const response = csvFileResponse("study_id\nUNASSIGNED", filename)
    assert.equal(hasSensitiveCachePolicy(response.headers), true)
    assert.equal(
      response.headers.get("Content-Disposition"),
      `attachment; filename="${filename}"`
    )
    assert.doesNotMatch(
      response.headers.get("Cache-Control") ?? "",
      /\bpublic\b|s-maxage/
    )
  })

  it("makes admin export JSON errors non-cacheable", async () => {
    const failure = genericExportFailureResponse()
    const rejected = genericExportRejectedResponse("Invalid export filters.")
    assert.equal(failure.status, 500)
    assert.equal(rejected.status, 400)
    assert.equal(hasSensitiveCachePolicy(failure.headers), true)
    assert.equal(hasSensitiveCachePolicy(rejected.headers), true)
    assert.deepEqual(await failure.json(), {
      error: "Something went wrong. Please try again.",
    })
    assert.match(read("lib/admin-csv-export.ts"), /jsonWithSensitiveCache/)
  })
})

describe("HIPAA-5.4 authenticated document policy", () => {
  it("covers dashboard, check-in, survey, admin, getting-started, and enrollment", () => {
    const covered = [
      "/dashboard",
      "/dashboard/progress",
      "/check-in",
      "/check-in/weekly-domain",
      "/check-in/stampley-support",
      "/survey/pre-survey",
      "/survey/dds",
      "/survey/dds/results",
      "/survey/post-survey",
      "/survey/post-survey/completed",
      "/admin",
      "/admin/dashboard",
      "/getting-started",
      "/enrollment",
    ]
    for (const path of covered) {
      assert.equal(isSensitiveDocumentPath(path), true, path)
    }
  })

  it("does not assign the sensitive policy to public marketing pages", () => {
    const publicPaths = ["/", "/team", "/contact", "/learnmore"]
    for (const path of publicPaths) {
      assert.equal(isSensitiveDocumentPath(path), false, path)
      assert.equal(isPublicCacheEligiblePath(path), true, path)
    }
    assert.equal(isSensitiveDocumentPath("/login"), false)
    assert.equal(isSensitiveDocumentPath("/register"), false)
    assert.equal(isSensitiveDocumentPath("/forgot-password"), false)
    assert.equal(isSensitiveDocumentPath("/reset-password"), false)
  })

  it("extends the middleware matcher without adding survey or enrollment login gates", () => {
    const middleware = read("middleware.ts")
    const matcherBlock = middleware.match(
      /export const config = \{\s*matcher:\s*\[([\s\S]*?)\]\s*,?\s*\}/
    )
    assert.ok(matcherBlock, "config.matcher must be a literal static array")
    assert.doesNotMatch(middleware, /matcher:\s*\[\s*\.\.\./)
    assert.doesNotMatch(
      middleware,
      /matcher:\s*SENSITIVE_DOCUMENT_MIDDLEWARE_MATCHER/
    )
    assert.doesNotMatch(middleware, /matcher:\s*[A-Za-z_$][\w$]*\s*[,}]/)
    const matcher: string[] = [...matcherBlock[1].matchAll(/"([^"]+)"/g)].map(
      (entry) => entry[1]
    )
    assert.deepEqual(matcher, [...SENSITIVE_DOCUMENT_MIDDLEWARE_MATCHER])
    for (const required of [
      "/survey/post-survey/:path*",
      "/enrollment/:path*",
      "/dashboard/:path*",
      "/check-in/:path*",
    ]) {
      assert.equal(matcher.some((entry) => entry === required), true)
    }
    for (const excluded of ["/", "/team/:path*", "/learnmore/:path*"]) {
      assert.equal(matcher.some((entry) => entry === excluded), false)
    }

    assert.match(middleware, /isSensitiveDocumentPath/)
    assert.match(middleware, /applySensitiveCacheHeaders/)
    assert.match(middleware, /await authMiddleware\(request, event\)/)
    assert.doesNotMatch(middleware, /export default auth\s*\(/)
    const middlewareCode = middleware
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "")
    assert.doesNotMatch(middlewareCode, /auth\s*\(\s*\(?\s*req/)

    const authConfig = read("lib/auth.config.ts")
    assert.match(
      authConfig,
      /pathname\.startsWith\("\/dashboard"\)[\s\S]*pathname\.startsWith\("\/check-in"\)[\s\S]*pathname\.startsWith\("\/getting-started"\)/
    )
    assert.doesNotMatch(
      authConfig,
      /pathname\.startsWith\("\/survey"\)[\s\S]*return isLoggedIn/
    )
    assert.doesNotMatch(
      authConfig,
      /pathname\.startsWith\("\/enrollment"\)[\s\S]*return isLoggedIn/
    )
  })
})

describe("HIPAA-5.4 client fetch and Auth.js wrapping", () => {
  it("uses no-store for DDS-summary and weekly-domain GETs", () => {
    const dds = read("app/check-in/stampley-support/page.tsx")
    const weekly = read("components/check-in/WeeklyDomainSync.tsx")
    const today = read("lib/stampley-active-chat-draft.ts")
    assert.match(dds, /\/api\/check-in\/dds-summary/)
    assert.match(dds, /cache:\s*"no-store"/)
    assert.match(weekly, /\/api\/check-in\/weekly-domain/)
    assert.match(weekly, /cache:\s*"no-store"/)
    assert.match(today, /\/api\/check-in\/today/)
    assert.match(today, /cache:\s*"no-store"/)
  })

  it("preserves Auth.js Set-Cookie and Location while attaching no-store", () => {
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    })
    response.headers.append(
      "Set-Cookie",
      "authjs.session-token=abc; Path=/; HttpOnly"
    )
    response.headers.append(
      "Set-Cookie",
      "authjs.csrf-token=def; Path=/; HttpOnly"
    )
    const sameResponse = withSensitiveAuthResponse(response)
    assert.equal(sameResponse, response)
    assert.equal(sameResponse.status, 302)
    assert.equal(sameResponse.statusText, response.statusText)
    assert.equal(sameResponse.headers.get("Location"), "/login")
    assert.deepEqual(sameResponse.headers.getSetCookie(), [
      "authjs.session-token=abc; Path=/; HttpOnly",
      "authjs.csrf-token=def; Path=/; HttpOnly",
    ])
    assert.equal(hasSensitiveCachePolicy(sameResponse.headers), true)

    const route = read("app/api/auth/[...nextauth]/route.ts")
    assert.match(route, /handlers\.GET/)
    assert.match(route, /handlers\.POST/)
    assert.match(route, /withSensitiveAuthResponse/)
    assert.doesNotMatch(route, /export const \{ GET, POST \} = handlers/)
  })

  it("does not disable public-site caching globally", () => {
    const nextConfig = read("next.config.ts")
    assert.doesNotMatch(nextConfig, /Cache-Control/)
    assert.doesNotMatch(nextConfig, /no-store/)
    assert.doesNotMatch(nextConfig, /\bPragma\b/)
    assert.doesNotMatch(nextConfig, /\bExpires\b/)
    const middleware = read("middleware.ts")
    assert.doesNotMatch(middleware, /matcher:\s*\[\s*"\/:path\*"\s*\]/)
  })

  it("can attach the policy to an existing Headers object", () => {
    const headers = new Headers({ Location: "/dashboard" })
    applySensitiveCacheHeaders(headers)
    assert.equal(headers.get("Location"), "/dashboard")
    assert.equal(hasSensitiveCachePolicy(headers), true)
  })
})
