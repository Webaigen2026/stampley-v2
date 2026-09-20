import NextAuth from "next-auth";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { baseAuthConfig, resolveAuthSecret } from "@/lib/auth.config";
import {
  applySensitiveCacheHeaders,
  isSensitiveDocumentPath,
  SENSITIVE_DOCUMENT_MIDDLEWARE_MATCHER,
} from "@/lib/sensitive-cache-headers";

const { auth } = NextAuth({
  ...baseAuthConfig,
  secret: resolveAuthSecret(),
  providers: [],
});

// Select the middleware overload. auth(request) is official NextAuth usage
// (`export default auth`); TypeScript also exposes Pages/API overloads.
const authMiddleware = auth as NextMiddleware;

/**
 * Attach no-store after Auth.js handleAuth, not via auth((req) => ...).
 * Passing a user callback to auth() skips the default sign-in redirect
 * when authorized() returns false.
 */
export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const response = await authMiddleware(request, event);
  if (
    response instanceof Response &&
    isSensitiveDocumentPath(request.nextUrl.pathname)
  ) {
    applySensitiveCacheHeaders(response.headers);
  }
  return response;
}

export const config = {
  matcher: [...SENSITIVE_DOCUMENT_MIDDLEWARE_MATCHER],
};
