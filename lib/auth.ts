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
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              role: true,
              password: true,
            },
          });
          if (!user) return null;
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
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