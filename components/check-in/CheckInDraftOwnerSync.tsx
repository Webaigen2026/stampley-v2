"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { discardLegacyClientPhiKeys } from "@/lib/client-owned-storage"
import { readSessionUserId } from "@/lib/session-user-id"
import { applyCheckInDraftOwner } from "@/store/checkin-store"

export function CheckInDraftOwnerSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    discardLegacyClientPhiKeys()
    if (status === "loading") return
    void applyCheckInDraftOwner(readSessionUserId(session))
  }, [session, status])

  return null
}
