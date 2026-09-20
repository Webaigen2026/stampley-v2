import type { StoredMessage } from "@/store/conversation-storage"
import {
  clearStorageKey,
  getBrowserSessionStorage,
  readOwnedStorageItem,
  writeOwnedStorageItem,
} from "@/lib/client-owned-storage"
import { readSessionUserId } from "@/lib/session-user-id"

export const UNSAVED_TRANSCRIPT_STORAGE_KEY = "stampley-unsaved-transcript"

export const STAMPLEY_SESSION_MAX_ATTEMPTS = 3
export const STAMPLEY_SESSION_RETRY_DELAY_MS = 500

export type StampleySessionSavePayload = {
  checkInSubmissionId: string
  domain: string | null
  stressLevel: number
  mood: number
  energy: number
  userMessageCount: number
  assistantMessageCount: number
  summary: string
  messages: StoredMessage[]
}

export type UnsavedTranscriptBackup = {
  checkInSubmissionId: string
  messages: StoredMessage[]
  summary: string
  metrics: {
    domain: string | null
    distress: number
    mood: number
    energy: number
    contextTags: string[]
    reflection: string
    copingAction: string
    weekNumber: number
    dayNumber: number
    subscale: string
  }
  userMessageCount: number
  assistantMessageCount: number
  timestamp: string
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isValidBackup(parsed: unknown): parsed is UnsavedTranscriptBackup {
  if (typeof parsed !== "object" || parsed === null) return false
  const backup = parsed as UnsavedTranscriptBackup
  return (
    typeof backup.checkInSubmissionId === "string" &&
    backup.checkInSubmissionId.trim().length > 0 &&
    Array.isArray(backup.messages)
  )
}

export function backupUnsavedTranscript(
  ownerUserId: string,
  backup: UnsavedTranscriptBackup,
  storage: Storage | null = getBrowserSessionStorage()
): void {
  const owner = readSessionUserId({ user: { id: ownerUserId } })
  if (!owner) return
  if (!isValidBackup(backup)) return
  writeOwnedStorageItem(storage, UNSAVED_TRANSCRIPT_STORAGE_KEY, owner, backup)
}

export function readUnsavedTranscript(
  currentUserId: string | null,
  storage: Storage | null = getBrowserSessionStorage()
): UnsavedTranscriptBackup | null {
  const owner = readSessionUserId({ user: { id: currentUserId } })
  const payload = readOwnedStorageItem<UnsavedTranscriptBackup>(
    storage,
    UNSAVED_TRANSCRIPT_STORAGE_KEY,
    owner
  )
  if (!payload) return null
  if (!isValidBackup(payload)) {
    clearUnsavedTranscript(storage)
    return null
  }
  return payload
}

export function clearUnsavedTranscript(
  storage: Storage | null = getBrowserSessionStorage()
): void {
  clearStorageKey(storage, UNSAVED_TRANSCRIPT_STORAGE_KEY)
}

export async function saveStampleySessionWithRetry(
  payload: StampleySessionSavePayload,
  options?: { maxAttempts?: number; delayMs?: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const maxAttempts = options?.maxAttempts ?? STAMPLEY_SESSION_MAX_ATTEMPTS
  const delayMs = options?.delayMs ?? STAMPLEY_SESSION_RETRY_DELAY_MS
  let lastError = "Unknown error"

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch("/api/stampley/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        if (attempt > 1) {
          console.info(
            `[stampley/session] saved on retry attempt ${attempt}/${maxAttempts}`
          )
        }
        return { ok: true }
      }

      lastError = await res.text()
      console.warn(
        `[stampley/session] attempt ${attempt}/${maxAttempts} failed:`,
        lastError
      )
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.warn(
        `[stampley/session] attempt ${attempt}/${maxAttempts} error:`,
        lastError
      )
    }

    if (attempt < maxAttempts) {
      await delay(delayMs)
    }
  }

  console.error(
    `[stampley/session] all ${maxAttempts} attempts failed for check-in ${payload.checkInSubmissionId}:`,
    lastError
  )
  return { ok: false, error: lastError }
}

export function backupFromSessionPayload(
  payload: StampleySessionSavePayload,
  metrics: UnsavedTranscriptBackup["metrics"]
): UnsavedTranscriptBackup {
  return {
    checkInSubmissionId: payload.checkInSubmissionId,
    messages: payload.messages,
    summary: payload.summary,
    metrics,
    userMessageCount: payload.userMessageCount,
    assistantMessageCount: payload.assistantMessageCount,
    timestamp: new Date().toISOString(),
  }
}

export function sessionPayloadFromBackup(
  backup: UnsavedTranscriptBackup
): StampleySessionSavePayload {
  return {
    checkInSubmissionId: backup.checkInSubmissionId,
    domain: backup.metrics.domain,
    stressLevel: backup.metrics.distress,
    mood: backup.metrics.mood,
    energy: backup.metrics.energy,
    userMessageCount: backup.userMessageCount,
    assistantMessageCount: backup.assistantMessageCount,
    summary: backup.summary,
    messages: backup.messages,
  }
}

/** Attempt to upload a previously backed-up transcript. Clears backup on success. */
export async function resendUnsavedTranscriptIfPresent(
  currentUserId: string | null,
  storage: Storage | null = getBrowserSessionStorage(),
  save = saveStampleySessionWithRetry
): Promise<boolean> {
  const backup = readUnsavedTranscript(currentUserId, storage)
  if (!backup) return false

  console.info("[stampley/transcript-backup] resending unsaved transcript")

  const result = await save(sessionPayloadFromBackup(backup))

  if (result.ok) {
    clearUnsavedTranscript(storage)
    console.info("[stampley/transcript-backup] resend succeeded")
    return true
  }

  console.warn("[stampley/transcript-backup] resend failed; backup retained")
  return false
}
