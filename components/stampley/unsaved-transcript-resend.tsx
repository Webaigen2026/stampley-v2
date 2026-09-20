"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { discardLegacyClientPhiKeys } from "@/lib/client-owned-storage"
import { readSessionUserId } from "@/lib/session-user-id"
import { resendUnsavedTranscriptIfPresent } from "@/lib/stampley-transcript-backup"

/** Silently retries any backed-up Stampley transcript on mount. */
export function UnsavedTranscriptResend() {
  const started = useRef(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return
    if (started.current) return
    started.current = true
    discardLegacyClientPhiKeys()
    void resendUnsavedTranscriptIfPresent(readSessionUserId(session))
  }, [session, status])

  return null
}
