"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { clearSensitiveClientState } from "@/lib/clear-sensitive-client-state"
import { readSessionUserId } from "@/lib/session-user-id"
import {
  decideSensitiveSessionCleanup,
  nextKnownSessionUserId,
} from "@/lib/sensitive-session-cleanup"

export function SensitiveSessionCleanup() {
  const { data: session, status } = useSession()
  const previousKnownUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const currentUserId = readSessionUserId(session)
    const decision = decideSensitiveSessionCleanup({
      status,
      currentUserId,
      previousKnownUserId: previousKnownUserId.current,
    })

    if (decision === "cleanup") {
      clearSensitiveClientState()
    }

    previousKnownUserId.current = nextKnownSessionUserId({
      status,
      currentUserId,
      previousKnownUserId: previousKnownUserId.current,
    })
  }, [session, status])

  return null
}
