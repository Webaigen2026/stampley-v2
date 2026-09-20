import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import { baseAuthConfig, resolveAuthSecret } from "./auth.config";
import { prisma } from "@/lib/prisma";

function resolveTokenAuthVersion(authVersion: unknown): number | null {
  if (authVersion === undefined) return 0;
  if (
    typeof authVersion === "number" &&
    Number.isInteger(authVersion) &&
    authVersion >= 0
  ) {
    return authVersion;
  }
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig,
  secret: resolveAuthSecret(),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              role: true,
              password: true,
              authVersion: true,
            },
          });
          if (!user?.password) return null;
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            authVersion: user.authVersion,
          };
        } catch (e) {
          console.error("[auth] authorize failed:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...baseAuthConfig.callbacks,
    async jwt({ token, user }: { token: JWT; user?: { id: string; role: string; email: string; authVersion: number } }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as JWT["role"];
        token.email = user.email;
        token.authVersion = user.authVersion;
        return token;
      }

      if (!token.id || typeof token.id !== "string") {
        return null;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            authVersion: true,
          },
        });

        if (!dbUser) {
          return null;
        }

        const tokenVersion = resolveTokenAuthVersion(token.authVersion);
        if (tokenVersion === null) {
          return null;
        }

        if (tokenVersion !== dbUser.authVersion) {
          return null;
        }

        return token;
      } catch {
        console.error("[auth] jwt validation failed");
        return null;
      }
    },
  },
});
