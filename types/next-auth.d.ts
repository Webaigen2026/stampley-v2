import type { DefaultSession } from "next-auth";
import type { AuthRole } from "@/lib/auth.config";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: AuthRole;
    authVersion: number;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: AuthRole;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AuthRole;
    email: string;
    authVersion?: number;
  }
}