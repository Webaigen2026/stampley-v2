import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { baseAuthConfig, resolveAuthSecret } from "./auth.config";
import { prisma } from "@/lib/prisma";

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
            },
          });
          if (!user?.password) return null;
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (e) {
          console.error("[auth] authorize failed:", e);
          return null;
        }
      },
    }),
  ],
});