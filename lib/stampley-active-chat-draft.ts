import type { StoredMessage } from "@/store/conversation-storage"
import {
  clearStorageKey,
  getBrowserSessionStorage,
  readOwnedStorageItem,
  writeOwnedStorageItem,
} from "@/lib/client-owned-storage"
import { readSessionUserId } from "@/lib/session-user-id"

export const ACTIVE_CHAT_DRAFT_STORAGE_KEY = "stampley-active-chat-draft"

export const ACTIVE_CHAT_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000

export type ActiveChatSnapshot = {
  distress: number
  mood: number
  energy: number
  domain: string | null
  contextTags: string[]
  reflection: string
  copingAction: string
  weekNumber: number
  dayNumber: number
  subscale: string
}

export type ActiveChatDraft = {
  chatStarted: true
  chatSnapshot: ActiveChatSnapshot
  messages: StoredMessage[]
  currentConvId: string | null
  expandedCard: string | null
  activeView: "chat" | "results"
  weekNumber: number
  dayNumber: number
  subscale: string
  timestamp: string
}

function isValidMessage(msg: unknown): msg is StoredMessage {
  if (typeof msg !== "object" || msg === null) return false
  const m = msg as StoredMessage
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.timestamp === "string"
  )
}

function isValidSnapshot(snapshot: unknown): snapshot is ActiveChatSnapshot {
  if (typeof snapshot !== "object" || snapshot === null) return false
  const s = snapshot as ActiveChatSnapshot
  return (
    Number.isFinite(Number(s.distress)) &&
    Number.isFinite(Number(s.mood)) &&
    Number.isFinite(Number(s.energy)) &&
    (s.domain === null || typeof s.domain === "string") &&
    Array.isArray(s.contextTags) &&
    typeof s.reflection === "string" &&
    typeof s.copingAction === "string" &&
    Number.isFinite(Number(s.weekNumber)) &&
    Number.isFinite(Number(s.dayNumber)) &&
    typeof s.subscale === "string"
  )
}

function normalizeDraft(parsed: ActiveChatDraft): ActiveChatDraft | null {
  if (parsed.chatStarted !== true) return null
  if (!isValidSnapshot(parsed.chatSnapshot)) return null
  if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
    return null
  }
  if (!parsed.messages.every(isValidMessage)) return null

  const ts = Date.parse(parsed.timestamp)
  if (!Number.isFinite(ts)) return null

  const activeView = parsed.activeView === "results" ? "results" : "chat"

  return {
    chatStarted: true,
    chatSnapshot: parsed.chatSnapshot,
    messages: parsed.messages,
    currentConvId:
      typeof parsed.currentConvId === "string" ? parsed.currentConvId : null,
    expandedCard:
      typeof parsed.expandedCard === "string" ? parsed.expandedCard : null,
    activeView,
    weekNumber: Number(parsed.weekNumber) || parsed.chatSnapshot.weekNumber,
    dayNumber: Number(parsed.dayNumber) || parsed.chatSnapshot.dayNumber,
    subscale:
      typeof parsed.subscale === "string"
        ? parsed.subscale
        : parsed.chatSnapshot.subscale,
    timestamp: parsed.timestamp,
  }
}

export function readActiveChatDraft(
  currentUserId: string | null,
  storage: Storage | null = getBrowserSessionStorage()
): ActiveChatDraft | null {
  const owner = readSessionUserId({ user: { id: currentUserId } })
  const payload = readOwnedStorageItem<ActiveChatDraft>(
    storage,
    ACTIVE_CHAT_DRAFT_STORAGE_KEY,
    owner,
    {
      maxAgeMs: ACTIVE_CHAT_DRAFT_MAX_AGE_MS,
      getTimestamp: (draft) => draft.timestamp,
    }
  )
  if (!payload) return null

  const normalized = normalizeDraft(payload)
  if (!normalized) {
    clearActiveChatDraft(storage)
    return null
  }
  return normalized
}

export function writeActiveChatDraft(
  ownerUserId: string,
  draft: ActiveChatDraft,
  storage: Storage | null = getBrowserSessionStorage()
): void {
  const owner = readSessionUserId({ user: { id: ownerUserId } })
  if (!owner) return
  if (!normalizeDraft(draft)) return
  writeOwnedStorageItem(storage, ACTIVE_CHAT_DRAFT_STORAGE_KEY, owner, draft)
}

export function clearActiveChatDraft(
  storage: Storage | null = getBrowserSessionStorage()
): void {
  clearStorageKey(storage, ACTIVE_CHAT_DRAFT_STORAGE_KEY)
}

export async function fetchCheckedInToday(): Promise<boolean | null> {
  try {
    const res = await fetch("/api/check-in/today", { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return Boolean(data.checkedInToday)
  } catch {
    return null
  }
}
