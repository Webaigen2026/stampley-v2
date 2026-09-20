"use client"

import { SessionProvider } from "next-auth/react"
import { SensitiveSessionCleanup } from "@/components/auth/sensitive-session-cleanup"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SensitiveSessionCleanup />
      {children}
    </SessionProvider>
  )
}