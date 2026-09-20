import { NextResponse } from "next/server"

export const SENSITIVE_CACHE_CONTROL = "private, no-store, max-age=0"
export const SENSITIVE_PRAGMA = "no-cache"
export const SENSITIVE_EXPIRES = "0"

export const SENSITIVE_RESPONSE_HEADERS = Object.freeze({
  "Cache-Control": SENSITIVE_CACHE_CONTROL,
  Pragma: SENSITIVE_PRAGMA,
  Expires: SENSITIVE_EXPIRES,
})

export const SENSITIVE_DOCUMENT_MIDDLEWARE_MATCHER = [
  "/dashboard/:path*",
  "/admin/:path*",
  "/check-in/:path*",
  "/getting-started/:path*",
  "/survey/pre-survey/:path*",
  "/survey/dds/:path*",
  "/survey/dds/results/:path*",
  "/survey/post-survey/:path*",
  "/enrollment/:path*",
] as const

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0] || "/"
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1)
  }
  return path
}

export function isSensitiveDocumentPath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  return (
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/getting-started" ||
    path.startsWith("/getting-started/") ||
    path === "/enrollment" ||
    path.startsWith("/enrollment/") ||
    path === "/check-in" ||
    path.startsWith("/check-in/") ||
    path === "/survey" ||
    path.startsWith("/survey/") ||
    path === "/admin" ||
    path.startsWith("/admin/")
  )
}

export function isPublicCacheEligiblePath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  return (
    path === "/" ||
    path === "/team" ||
    path.startsWith("/team/") ||
    path === "/contact" ||
    path.startsWith("/contact/") ||
    path === "/learnmore" ||
    path.startsWith("/learnmore/")
  )
}

function cacheControlDirectives(value: string): string[] {
  return value
    .toLowerCase()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

export function hasSensitiveCachePolicy(headers: Headers): boolean {
  const directives = cacheControlDirectives(headers.get("Cache-Control") ?? "")
  const hasPrivate = directives.includes("private")
  const hasNoStore = directives.includes("no-store")
  const hasMaxAge0 = directives.includes("max-age=0")
  const hasPublic = directives.includes("public")
  const hasSMaxAge = directives.some((directive) =>
    directive.startsWith("s-maxage")
  )
  return hasPrivate && hasNoStore && hasMaxAge0 && !hasPublic && !hasSMaxAge
}

export function applySensitiveCacheHeaders(headers: Headers): Headers {
  headers.set("Cache-Control", SENSITIVE_RESPONSE_HEADERS["Cache-Control"])
  headers.set("Pragma", SENSITIVE_RESPONSE_HEADERS.Pragma)
  headers.set("Expires", SENSITIVE_RESPONSE_HEADERS.Expires)
  return headers
}

export function jsonWithSensitiveCache(
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init)
  applySensitiveCacheHeaders(response.headers)
  return response
}

export function withSensitiveAuthResponse(response: Response): Response {
  applySensitiveCacheHeaders(response.headers)
  return response
}
