"use client"

import type { ReactNode } from "react"
import { signOut } from "next-auth/react"
import { secureSignOut } from "@/lib/secure-sign-out"

type SignOutButtonProps = {
  callbackUrl: string
  className?: string
  children: ReactNode
  ariaLabel?: string
  role?: string
}

export function SignOutButton({
  callbackUrl,
  className,
  children,
  ariaLabel,
  role,
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      role={role}
      onClick={() => {
        void secureSignOut({ callbackUrl }, signOut)
      }}
    >
      {children}
    </button>
  )
}
