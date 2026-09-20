import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { isStaffRole, type AppUserRole } from "@/lib/admin-capabilities";

export type AuthRole = AppUserRole;

/** Returns undefined in production when unset so Auth.js can surface Configuration / MissingSecret instead of crashing module load. */
export function resolveAuthSecret(): string | undefined {
  const s = process.env.AUTH_SECRET?.trim() ||
            process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-only-secret-min-32-chars-long!!";
  }
  return undefined;
}

export const CANONICAL_SIGN_IN_PATH = "/login"

export function isSafeInternalCallbackUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) {
    return false
  }
  if (!value.startsWith("/")) return false
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return false
  }
  if (value.includes("\n") || value.includes("\r") || value.includes("\0")) {
    return false
  }
  return (
    value === "/" ||
    value.startsWith("/admin") ||
    value.startsWith("/dashboard") ||
    value.startsWith("/check-in") ||
    value.startsWith("/getting-started") ||
    value.startsWith("/login")
  )
}

function canonicalSignInRedirect(
  request: { nextUrl: URL },
  callbackUrl?: string
) {
  const dest = new URL(CANONICAL_SIGN_IN_PATH, request.nextUrl)
  if (callbackUrl && isSafeInternalCallbackUrl(callbackUrl)) {
    dest.searchParams.set("callbackUrl", callbackUrl)
  }
  return NextResponse.redirect(dest)
}

export const baseAuthConfig = {
  trustHost: true,
  pages: {
    signIn: CANONICAL_SIGN_IN_PATH,
  },
  callbacks: {
    authorized({ auth, request }: { 
      auth: { user?: { role?: AuthRole } } | null, 
      request: { nextUrl: URL }
    }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as AuthRole | undefined;

      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/check-in") ||
        pathname.startsWith("/getting-started")
      ) {
        return isLoggedIn;
      }

      if (pathname === "/admin/login") {
        if (isLoggedIn && isStaffRole(role)) {
          return NextResponse.redirect(new URL("/admin/dashboard", request.nextUrl));
        }
        if (isLoggedIn) {
          return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
        }
        return canonicalSignInRedirect(request);
      }

      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) {
          const requested = `${pathname}${request.nextUrl.search}`;
          return canonicalSignInRedirect(request, requested);
        }
        if (!isStaffRole(role)) {
          return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return true;
    },
    // Auth.js JWT/session callback shapes retained from AUTH-1.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AuthRole;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;