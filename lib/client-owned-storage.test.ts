import { afterEach, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  ACTIVE_CHAT_DRAFT_MAX_AGE_MS,
  ACTIVE_CHAT_DRAFT_STORAGE_KEY,
  readActiveChatDraft,
  writeActiveChatDraft,
  type ActiveChatDraft,
} from "./stampley-active-chat-draft"
import {
  backupUnsavedTranscript,
  readUnsavedTranscript,
  resendUnsavedTranscriptIfPresent,
  UNSAVED_TRANSCRIPT_STORAGE_KEY,
  type UnsavedTranscriptBackup,
} from "./stampley-transcript-backup"
import {
  CHECK_IN_DRAFT_KEY,
  applyCheckInDraftOwner,
  checkInInitialState,
  resetCheckInDraftOwnerForTests,
  useCheckInStore,
} from "../store/checkin-store"
import {
  CONVERSATIONS_STORAGE_KEY,
  discardLegacyConversations,
  getConversations,
  saveConversations,
} from "../store/conversation-storage"
import {
  LEGACY_CHECKIN_STATE_KEY_PREFIX,
  LEGACY_CONVERSATIONS_KEY_PREFIX,
  discardLegacyClientPhiKeys,
  wrapOwnedPayload,
} from "./client-owned-storage"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

class MemoryStorage {
  private data = new Map<string, string>()

  get length() {
    return this.data.size
  }

  clear() {
    this.data.clear()
  }

  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null
  }

  setItem(key: string, value: string) {
    this.data.set(key, String(value))
  }

  removeItem(key: string) {
    this.data.delete(key)
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
}

const USER_A = "user-a-stable-id"
const USER_B = "user-b-stable-id"
const REFLECTION = "I felt overwhelmed after a high glucose reading"
const COPING = "I walked outside for ten minutes"
const TRANSCRIPT = "Today my distress felt unmanageable"

function createMemoryStorage() {
  return new MemoryStorage() as unknown as Storage
}

function sampleDraft(overrides?: Partial<ActiveChatDraft>): ActiveChatDraft {
  return {
    chatStarted: true,
    chatSnapshot: {
      distress: 8,
      mood: 4,
      energy: 3,
      domain: "Emotional",
      contextTags: ["stress"],
      reflection: REFLECTION,
      copingAction: COPING,
      weekNumber: 1,
      dayNumber: 2,
      subscale: "Feeling overwhelmed",
    },
    messages: [
      {
        id: "m1",
        role: "user",
        content: TRANSCRIPT,
        timestamp: "10:00 AM",
      },
    ],
    currentConvId: "conv-1",
    expandedCard: null,
    activeView: "chat",
    weekNumber: 1,
    dayNumber: 2,
    subscale: "Feeling overwhelmed",
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

function sampleBackup(): UnsavedTranscriptBackup {
  return {
    checkInSubmissionId: "checkin-sub-1",
    messages: [
      {
        id: "m1",
        role: "user",
        content: TRANSCRIPT,
        timestamp: "10:00 AM",
      },
    ],
    summary: "Focus domain: Emotional. Stampley chat: 1 participant reply, 1 Stampley turn.",
    metrics: {
      domain: "Emotional",
      distress: 8,
      mood: 4,
      energy: 3,
      contextTags: ["stress"],
      reflection: REFLECTION,
      copingAction: COPING,
      weekNumber: 1,
      dayNumber: 2,
      subscale: "Feeling overwhelmed",
    },
    userMessageCount: 1,
    assistantMessageCount: 1,
    timestamp: new Date().toISOString(),
  }
}

function installBrowserStorage() {
  const session = createMemoryStorage()
  const local = createMemoryStorage()
  Object.defineProperty(globalThis, "sessionStorage", {
    value: session,
    configurable: true,
  })
  Object.defineProperty(globalThis, "localStorage", {
    value: local,
    configurable: true,
  })
  Object.defineProperty(globalThis, "window", {
    value: { sessionStorage: session, localStorage: local },
    configurable: true,
  })
  return { session, local }
}

describe("HIPAA-5.2 conversation localStorage removal", () => {
  it("no longer uses unscoped stampley_conversations in the live workflow", () => {
    const live = read("app/check-in/stampley-support/page.tsx")
    assert.equal(live.includes("getConversations"), false)
    assert.equal(live.includes("saveConversations"), false)
    assert.equal(live.includes("localStorage"), false)
    assert.match(live, /discardLegacyConversations/)
    assert.match(live, /readActiveChatDraft\(ownerUserId\)/)
    assert.match(live, /writeActiveChatDraft\(ownerUserId/)
  })

  it("does not permanently write completed conversation PHI to localStorage", () => {
    const local = createMemoryStorage()
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: local },
      configurable: true,
    })
    Object.defineProperty(globalThis, "localStorage", {
      value: local,
      configurable: true,
    })

    local.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify([{ content: TRANSCRIPT }]))
    local.setItem(`${LEGACY_CONVERSATIONS_KEY_PREFIX}${USER_A}`, JSON.stringify([{ content: TRANSCRIPT }]))
    local.setItem(`${LEGACY_CHECKIN_STATE_KEY_PREFIX}${USER_A}`, JSON.stringify({ reflection: REFLECTION }))

    const loaded = getConversations()
    assert.deepEqual(loaded, [])
    saveConversations([
      {
        id: "x",
        title: TRANSCRIPT,
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: "m1",
            role: "user",
            content: TRANSCRIPT,
            timestamp: "now",
          },
        ],
      },
    ])
    discardLegacyConversations()

    assert.equal(local.getItem(CONVERSATIONS_STORAGE_KEY), null)
    assert.equal(local.getItem(`${LEGACY_CONVERSATIONS_KEY_PREFIX}${USER_A}`), null)
    assert.equal(local.getItem(`${LEGACY_CHECKIN_STATE_KEY_PREFIX}${USER_A}`), null)
  })
})

describe("HIPAA-5.2 active chat draft ownership", () => {
  it("restores the same owner and rejects other cases", () => {
    const storage = createMemoryStorage()
    const draft = sampleDraft()

    writeActiveChatDraft(USER_A, draft, storage)
    const restored = readActiveChatDraft(USER_A, storage)
    assert.equal(restored?.messages[0]?.content, TRANSCRIPT)

    writeActiveChatDraft(USER_A, draft, storage)
    assert.equal(readActiveChatDraft(USER_B, storage), null)
    assert.equal(storage.getItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY), null)

    storage.setItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
    assert.equal(readActiveChatDraft(USER_A, storage), null)
    assert.equal(storage.getItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY), null)

    storage.setItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY, "{not-json")
    assert.equal(readActiveChatDraft(USER_A, storage), null)
    assert.equal(storage.getItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY), null)

    writeActiveChatDraft(
      USER_A,
      sampleDraft({
        timestamp: new Date(Date.now() - ACTIVE_CHAT_DRAFT_MAX_AGE_MS - 1000).toISOString(),
      }),
      storage
    )
    assert.equal(readActiveChatDraft(USER_A, storage), null)
    assert.equal(storage.getItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY), null)
  })
})

describe("HIPAA-5.2 unsaved transcript ownership", () => {
  it("allows same-owner retry and denies every fail-closed case", async () => {
    const storage = createMemoryStorage()
    const backup = sampleBackup()
    let sent = 0

    backupUnsavedTranscript(USER_A, backup, storage)
    assert.equal(readUnsavedTranscript(USER_A, storage)?.checkInSubmissionId, "checkin-sub-1")

    const allowed = await resendUnsavedTranscriptIfPresent(USER_A, storage, async () => {
      sent += 1
      return { ok: true }
    })
    assert.equal(allowed, true)
    assert.equal(sent, 1)
    assert.equal(storage.getItem(UNSAVED_TRANSCRIPT_STORAGE_KEY), null)

    backupUnsavedTranscript(USER_A, backup, storage)
    const denied = await resendUnsavedTranscriptIfPresent(USER_B, storage, async () => {
      sent += 1
      return { ok: true }
    })
    assert.equal(denied, false)
    assert.equal(sent, 1)
    assert.equal(storage.getItem(UNSAVED_TRANSCRIPT_STORAGE_KEY), null)

    storage.setItem(UNSAVED_TRANSCRIPT_STORAGE_KEY, JSON.stringify(backup))
    assert.equal(readUnsavedTranscript(USER_A, storage), null)
    assert.equal(
      await resendUnsavedTranscriptIfPresent(USER_A, storage, async () => {
        sent += 1
        return { ok: true }
      }),
      false
    )
    assert.equal(sent, 1)

    storage.setItem(UNSAVED_TRANSCRIPT_STORAGE_KEY, "{bad")
    assert.equal(readUnsavedTranscript(USER_A, storage), null)
    assert.equal(storage.getItem(UNSAVED_TRANSCRIPT_STORAGE_KEY), null)
  })
})

describe("HIPAA-5.2 check-in draft ownership", () => {
  beforeEach(() => {
    installBrowserStorage()
    resetCheckInDraftOwnerForTests()
  })

  afterEach(() => {
    resetCheckInDraftOwnerForTests()
  })

  it("hydrates only the authenticated owner and never adopts legacy PHI", async () => {
    const owned = wrapOwnedPayload(USER_A, {
      state: {
        distress: 9,
        mood: 2,
        energy: 1,
        contextTags: ["stress"],
        reflection: REFLECTION,
        copingAction: COPING,
        domain: "Emotional",
      },
      version: 0,
    })
    sessionStorage.setItem(CHECK_IN_DRAFT_KEY, JSON.stringify(owned))

    await applyCheckInDraftOwner(USER_A)
    assert.equal(useCheckInStore.getState().distress, 9)
    assert.equal(useCheckInStore.getState().reflection, REFLECTION)

    await applyCheckInDraftOwner(USER_B)
    assert.deepEqual(
      {
        distress: useCheckInStore.getState().distress,
        mood: useCheckInStore.getState().mood,
        energy: useCheckInStore.getState().energy,
        reflection: useCheckInStore.getState().reflection,
        copingAction: useCheckInStore.getState().copingAction,
        domain: useCheckInStore.getState().domain,
        contextTags: useCheckInStore.getState().contextTags,
      },
      checkInInitialState
    )
    assert.equal(sessionStorage.getItem(CHECK_IN_DRAFT_KEY), null)

    sessionStorage.setItem(
      CHECK_IN_DRAFT_KEY,
      JSON.stringify({
        state: {
          distress: 8,
          reflection: REFLECTION,
        },
        version: 0,
      })
    )
    await applyCheckInDraftOwner(USER_A)
    assert.equal(useCheckInStore.getState().distress, undefined)
    assert.equal(useCheckInStore.getState().reflection, "")
    assert.equal(sessionStorage.getItem(CHECK_IN_DRAFT_KEY), null)
  })
})

describe("HIPAA-5.2 rejection logging", () => {
  it("does not write sensitive payload contents while rejecting recovery", () => {
    const storage = createMemoryStorage()
    const lines: string[] = []
    const capture = (...args: unknown[]) => {
      lines.push(args.map((value) => String(value)).join(" "))
    }
    const original = {
      info: console.info,
      warn: console.warn,
      error: console.error,
    }
    console.info = capture
    console.warn = capture
    console.error = capture

    try {
      storage.setItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY, JSON.stringify(sampleDraft()))
      readActiveChatDraft(USER_B, storage)
      storage.setItem(UNSAVED_TRANSCRIPT_STORAGE_KEY, JSON.stringify(sampleBackup()))
      void readUnsavedTranscript(USER_B, storage)
      discardLegacyClientPhiKeys()
    } finally {
      console.info = original.info
      console.warn = original.warn
      console.error = original.error
    }

    const joined = lines.join("\n")
    assert.equal(joined.includes(REFLECTION), false)
    assert.equal(joined.includes(COPING), false)
    assert.equal(joined.includes(TRANSCRIPT), false)
  })
})

describe("HIPAA-5.2 leftover route cleanup", () => {
  it("removes the leftover copy route", () => {
    const nav = read("app/check-in/constants/navigation.ts")
    assert.equal(nav.includes("stampley-supportcopy"), false)
    assert.equal(existsSync(join(ROOT, "app/check-in/stampley-supportcopy/page.tsx")), false)
    assert.equal(existsSync(join(ROOT, "app/check-in/CheckInUserScope.tsx")), false)
  })
})
