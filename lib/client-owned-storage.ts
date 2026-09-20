export const OWNED_STORAGE_VERSION = 1

export const LEGACY_CONVERSATIONS_STORAGE_KEY = "stampley_conversations"
export const LEGACY_CONVERSATIONS_KEY_PREFIX = "stampley_conversations:"
export const LEGACY_CHECKIN_STATE_KEY_PREFIX = "stampley_checkin_state:"

export type OwnedStorageEnvelope<T> = {
  ownerUserId: string
  version: number
  payload: T
}

export type OwnedReadRejection =
  | "malformed"
  | "unowned"
  | "mismatch"
  | "expired"
  | "no-current-user"

export type OwnedReadResult<T> =
  | { status: "empty" }
  | { status: "ok"; payload: T }
  | { status: "rejected"; reason: OwnedReadRejection; clear: boolean }

function isStableUserId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value.trim() === value
  )
}

export function wrapOwnedPayload<T>(
  ownerUserId: string,
  payload: T
): OwnedStorageEnvelope<T> | null {
  if (!isStableUserId(ownerUserId)) return null
  return {
    ownerUserId,
    version: OWNED_STORAGE_VERSION,
    payload,
  }
}

export function parseOwnedEnvelope(
  raw: string
):
  | { ok: true; envelope: OwnedStorageEnvelope<unknown> }
  | { ok: false; reason: "malformed" | "unowned" | "version" } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: "malformed" }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "malformed" }
  }

  const record = parsed as Record<string, unknown>
  if (!("payload" in record) || !("version" in record)) {
    return { ok: false, reason: "unowned" }
  }

  if (record.version !== OWNED_STORAGE_VERSION) {
    return { ok: false, reason: "version" }
  }

  if (!isStableUserId(record.ownerUserId)) {
    return { ok: false, reason: "unowned" }
  }

  return {
    ok: true,
    envelope: {
      ownerUserId: record.ownerUserId,
      version: OWNED_STORAGE_VERSION,
      payload: record.payload,
    },
  }
}

function isExpired(timestamp: string | undefined, maxAgeMs: number): boolean {
  if (typeof timestamp !== "string") return true
  const ts = Date.parse(timestamp)
  if (!Number.isFinite(ts)) return true
  return Date.now() - ts > maxAgeMs
}

export function readOwnedPayload<T>(args: {
  raw: string | null
  currentUserId: string | null
  maxAgeMs?: number
  getTimestamp?: (payload: T) => string | undefined
}): OwnedReadResult<T> {
  if (args.raw == null || args.raw === "") {
    return { status: "empty" }
  }

  const parsed = parseOwnedEnvelope(args.raw)
  if (!parsed.ok) {
    return {
      status: "rejected",
      reason: parsed.reason === "unowned" ? "unowned" : "malformed",
      clear: true,
    }
  }

  if (!isStableUserId(args.currentUserId)) {
    return { status: "rejected", reason: "no-current-user", clear: false }
  }

  if (parsed.envelope.ownerUserId !== args.currentUserId) {
    return { status: "rejected", reason: "mismatch", clear: true }
  }

  const payload = parsed.envelope.payload as T
  if (
    typeof args.maxAgeMs === "number" &&
    args.getTimestamp &&
    isExpired(args.getTimestamp(payload), args.maxAgeMs)
  ) {
    return { status: "rejected", reason: "expired", clear: true }
  }

  return { status: "ok", payload }
}

export function getBrowserSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function clearStorageKey(storage: Storage | null, key: string): void {
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // Storage may be unavailable; fail closed without logging contents.
  }
}

function collectMatchingKeys(storage: Storage, prefixes: string[]): string[] {
  const keys: string[] = []
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key) continue
      if (prefixes.some((prefix) => key === prefix || key.startsWith(prefix))) {
        keys.push(key)
      }
    }
  } catch {
    return keys
  }
  return keys
}

export function discardLegacyClientPhiKeys(
  localStorageRef: Storage | null = getBrowserLocalStorage()
): void {
  if (!localStorageRef) return
  const keys = collectMatchingKeys(localStorageRef, [
    LEGACY_CONVERSATIONS_STORAGE_KEY,
    LEGACY_CONVERSATIONS_KEY_PREFIX,
    LEGACY_CHECKIN_STATE_KEY_PREFIX,
  ])
  for (const key of keys) {
    clearStorageKey(localStorageRef, key)
  }
}

export function readOwnedStorageItem<T>(
  storage: Storage | null,
  key: string,
  currentUserId: string | null,
  options?: {
    maxAgeMs?: number
    getTimestamp?: (payload: T) => string | undefined
  }
): T | null {
  if (!storage) return null
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return null
  }

  const result = readOwnedPayload<T>({
    raw,
    currentUserId,
    maxAgeMs: options?.maxAgeMs,
    getTimestamp: options?.getTimestamp,
  })

  if (result.status === "ok") return result.payload
  if (result.status === "rejected" && result.clear) {
    clearStorageKey(storage, key)
  }
  return null
}

export function writeOwnedStorageItem<T>(
  storage: Storage | null,
  key: string,
  ownerUserId: string,
  payload: T
): boolean {
  if (!storage) return false
  const envelope = wrapOwnedPayload(ownerUserId, payload)
  if (!envelope) return false
  try {
    storage.setItem(key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}
