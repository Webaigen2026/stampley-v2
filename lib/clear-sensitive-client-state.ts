import {
  clearStorageKey,
  discardLegacyClientPhiKeys,
  getBrowserSessionStorage,
} from "@/lib/client-owned-storage"
import { ACTIVE_CHAT_DRAFT_STORAGE_KEY } from "@/lib/stampley-active-chat-draft"
import { UNSAVED_TRANSCRIPT_STORAGE_KEY } from "@/lib/stampley-transcript-backup"
import {
  CHECK_IN_DRAFT_KEY,
  resetCheckInSensitiveClientState,
} from "@/store/checkin-store"

export const SENSITIVE_CLIENT_SESSION_KEYS = [
  CHECK_IN_DRAFT_KEY,
  ACTIVE_CHAT_DRAFT_STORAGE_KEY,
  UNSAVED_TRANSCRIPT_STORAGE_KEY,
] as const

export function clearSensitiveClientState(): void {
  resetCheckInSensitiveClientState()

  const sessionStorageRef = getBrowserSessionStorage()
  for (const key of SENSITIVE_CLIENT_SESSION_KEYS) {
    clearStorageKey(sessionStorageRef, key)
  }

  discardLegacyClientPhiKeys()
}
