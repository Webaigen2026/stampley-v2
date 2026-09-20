import { afterEach, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  ACTIVE_CHAT_DRAFT_STORAGE_KEY,
  readActiveChatDraft,
  writeActiveChatDraft,
  type ActiveChatDraft,
} from "./stampley-active-chat-draft"
import {
  backupUnsavedTranscript,
  readUnsavedTranscript,
  UNSAVED_TRANSCRIPT_STORAGE_KEY,
  type UnsavedTranscriptBackup,
} from "./stampley-transcript-backup"
import { clearSensitiveClientState } from "./clear-sensitive-client-state"
import { secureSignOut } from "./secure-sign-out"
import {
  decideSensitiveSessionCleanup,
  nextKnownSessionUserId,
} from "./sensitive-session-cleanup"
import {
  LEGACY_CHECKIN_STATE_KEY_PREFIX,
  LEGACY_CONVERSATIONS_KEY_PREFIX,
  LEGACY_CONVERSATIONS_STORAGE_KEY,
  wrapOwnedPayload,
} from "./client-owned-storage"
import {
  CHECK_IN_DRAFT_KEY,
  applyCheckInDraftOwner,
  areCheckInPersistWritesEnabled,
  getCheckInDraftOwnerUserId,
  resetCheckInDraftOwnerForTests,
  useCheckInStore,
} from "../store/checkin-store"

const USER_A = "user-a-stable-id"
const USER_B = "user-b-stable-id"
const REFLECTION = "I felt overwhelmed after a high glucose reading"
const COPING = "I walked outside for ten minutes"
const TRANSCRIPT = "Today my distress felt unmanageable"
const PRE_SURVEY_STARTED_KEY = "aides-t2d-pre-survey-started"
const UNRELATED_SESSION_KEY = "theme-preference"
const UNRELATED_LOCAL_KEY = "ui-sidebar-collapsed"

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

function createMemoryStorage() {
  return new MemoryStorage() as unknown as Storage
}

function sampleDraft(): ActiveChatDraft {
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

async function seedOwnedSensitiveState() {
  await applyCheckInDraftOwner(USER_A)
  useCheckInStore.setState({
    distress: 9,
    mood: 3,
    energy: 2,
    reflection: REFLECTION,
    copingAction: COPING,
    domain: "Emotional",
    contextTags: ["stress"],
  })
  writeActiveChatDraft(USER_A, sampleDraft())
  backupUnsavedTranscript(USER_A, sampleBackup())
}

describe("HIPAA-5.3 centralized sensitive client cleanup", () => {
  beforeEach(() => {
    resetCheckInDraftOwnerForTests()
    installBrowserStorage()
  })

  afterEach(() => {
    resetCheckInDraftOwnerForTests()
  })

  it("removes the three PHI sessionStorage keys and leftover localStorage PHI", async () => {
    const { session, local } = installBrowserStorage()
    await seedOwnedSensitiveState()
    local.setItem(
      LEGACY_CONVERSATIONS_STORAGE_KEY,
      JSON.stringify([{ content: TRANSCRIPT }])
    )
    local.setItem(
      `${LEGACY_CONVERSATIONS_KEY_PREFIX}${USER_A}`,
      JSON.stringify([{ content: TRANSCRIPT }])
    )
    local.setItem(
      `${LEGACY_CHECKIN_STATE_KEY_PREFIX}${USER_A}`,
      JSON.stringify({ reflection: REFLECTION })
    )
    session.setItem(UNRELATED_SESSION_KEY, "dark")
    local.setItem(PRE_SURVEY_STARTED_KEY, "true")
    local.setItem(UNRELATED_LOCAL_KEY, "1")

    clearSensitiveClientState()

    assert.equal(session.getItem(CHECK_IN_DRAFT_KEY), null)
    assert.equal(session.getItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY), null)
    assert.equal(session.getItem(UNSAVED_TRANSCRIPT_STORAGE_KEY), null)
    assert.equal(local.getItem(LEGACY_CONVERSATIONS_STORAGE_KEY), null)
    assert.equal(local.getItem(`${LEGACY_CONVERSATIONS_KEY_PREFIX}${USER_A}`), null)
    assert.equal(local.getItem(`${LEGACY_CHECKIN_STATE_KEY_PREFIX}${USER_A}`), null)
    assert.equal(session.getItem(UNRELATED_SESSION_KEY), "dark")
    assert.equal(local.getItem(PRE_SURVEY_STARTED_KEY), "true")
    assert.equal(local.getItem(UNRELATED_LOCAL_KEY), "1")
  })

  it("resets check-in memory, owner, and persist writes without rewriting the draft", async () => {
    const { session } = installBrowserStorage()
    await seedOwnedSensitiveState()
    assert.equal(useCheckInStore.getState().distress, 9)
    assert.equal(useCheckInStore.getState().reflection, REFLECTION)
    assert.equal(getCheckInDraftOwnerUserId(), USER_A)
    assert.equal(areCheckInPersistWritesEnabled(), true)

    clearSensitiveClientState()

    assert.equal(useCheckInStore.getState().distress, undefined)
    assert.equal(useCheckInStore.getState().reflection, "")
    assert.equal(useCheckInStore.getState().copingAction, "")
    assert.equal(useCheckInStore.getState().domain, null)
    assert.equal(getCheckInDraftOwnerUserId(), null)
    assert.equal(areCheckInPersistWritesEnabled(), false)
    assert.equal(session.getItem(CHECK_IN_DRAFT_KEY), null)

    useCheckInStore.setState({ distress: 8, reflection: REFLECTION })
    assert.equal(session.getItem(CHECK_IN_DRAFT_KEY), null)
    assert.equal(areCheckInPersistWritesEnabled(), false)
  })

  it("is idempotent and does not throw or log PHI when storage is unavailable", async () => {
    await seedOwnedSensitiveState()
    const logs: string[] = []
    const original = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }
    const capture = (...args: unknown[]) => {
      logs.push(args.map((value) => String(value)).join(" "))
    }
    console.log = capture
    console.info = capture
    console.warn = capture
    console.error = capture

    try {
      clearSensitiveClientState()
      clearSensitiveClientState()

      const throwing = {
        length: 0,
        clear() {
          throw new Error("unavailable")
        },
        getItem() {
          throw new Error("unavailable")
        },
        setItem() {
          throw new Error("unavailable")
        },
        removeItem() {
          throw new Error("unavailable")
        },
        key() {
          throw new Error("unavailable")
        },
      }
      Object.defineProperty(globalThis, "sessionStorage", {
        value: throwing,
        configurable: true,
      })
      Object.defineProperty(globalThis, "localStorage", {
        value: throwing,
        configurable: true,
      })
      Object.defineProperty(globalThis, "window", {
        value: { sessionStorage: throwing, localStorage: throwing },
        configurable: true,
      })

      assert.doesNotThrow(() => {
        clearSensitiveClientState()
      })
    } finally {
      console.log = original.log
      console.info = original.info
      console.warn = original.warn
      console.error = original.error
    }

    assert.equal(logs.some((line) => line.includes(TRANSCRIPT)), false)
    assert.equal(logs.some((line) => line.includes(REFLECTION)), false)
    assert.equal(logs.length, 0)
  })

  it("prevents B from recovering A's drafts after cleanup", async () => {
    await seedOwnedSensitiveState()
    clearSensitiveClientState()

    await applyCheckInDraftOwner(USER_B)
    assert.equal(useCheckInStore.getState().distress, undefined)
    assert.equal(useCheckInStore.getState().reflection, "")
    assert.equal(readActiveChatDraft(USER_B), null)
    assert.equal(readUnsavedTranscript(USER_B), null)
    assert.equal(readActiveChatDraft(USER_A), null)
    assert.equal(readUnsavedTranscript(USER_A), null)
  })

  it("does not let an in-flight owner rehydrate rewrite PHI after cleanup", async () => {
    const { session } = installBrowserStorage()
    await seedOwnedSensitiveState()
    const owned = wrapOwnedPayload(USER_A, {
      state: {
        distress: 9,
        reflection: REFLECTION,
      },
    })
    session.setItem(CHECK_IN_DRAFT_KEY, JSON.stringify(owned))

    const pending = applyCheckInDraftOwner(USER_A)
    clearSensitiveClientState()
    await pending

    assert.equal(getCheckInDraftOwnerUserId(), null)
    assert.equal(areCheckInPersistWritesEnabled(), false)
    assert.equal(session.getItem(CHECK_IN_DRAFT_KEY), null)
    assert.equal(useCheckInStore.getState().reflection, "")
  })
})

describe("HIPAA-5.3 secure sign-out", () => {
  beforeEach(() => {
    resetCheckInDraftOwnerForTests()
    installBrowserStorage()
  })

  afterEach(() => {
    resetCheckInDraftOwnerForTests()
  })

  it("clears sensitive state before Auth.js signOut and preserves callbackUrl", async () => {
    const { session } = installBrowserStorage()
    await seedOwnedSensitiveState()

    const calls: Array<{ callbackUrl: string }> = []
    let keysAtSignOut = {
      checkIn: "present",
      chat: "present",
      transcript: "present",
    }

    await secureSignOut({ callbackUrl: "/login" }, (args) => {
      keysAtSignOut = {
        checkIn: session.getItem(CHECK_IN_DRAFT_KEY) ?? "missing",
        chat: session.getItem(ACTIVE_CHAT_DRAFT_STORAGE_KEY) ?? "missing",
        transcript: session.getItem(UNSAVED_TRANSCRIPT_STORAGE_KEY) ?? "missing",
      }
      calls.push(args)
    })

    assert.deepEqual(calls, [{ callbackUrl: "/login" }])
    assert.deepEqual(keysAtSignOut, {
      checkIn: "missing",
      chat: "missing",
      transcript: "missing",
    })

    await seedOwnedSensitiveState()
    await secureSignOut({ callbackUrl: "/" }, (args) => {
      calls.push(args)
    })
    assert.deepEqual(calls[1], { callbackUrl: "/" })
  })
})

describe("HIPAA-5.3 session lifecycle decisions", () => {
  it("cleans up authenticated → unauthenticated and A → B, but not loading", () => {
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "unauthenticated",
        currentUserId: null,
        previousKnownUserId: USER_A,
      }),
      "cleanup"
    )
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "authenticated",
        currentUserId: USER_B,
        previousKnownUserId: USER_A,
      }),
      "cleanup"
    )
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "unauthenticated",
        currentUserId: null,
        previousKnownUserId: undefined,
      }),
      "cleanup"
    )
  })

  it("does not erase a valid same-user draft while the session is loading", () => {
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "loading",
        currentUserId: null,
        previousKnownUserId: USER_A,
      }),
      "none"
    )
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "loading",
        currentUserId: null,
        previousKnownUserId: undefined,
      }),
      "none"
    )
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "authenticated",
        currentUserId: USER_A,
        previousKnownUserId: undefined,
      }),
      "none"
    )
    assert.equal(
      decideSensitiveSessionCleanup({
        status: "authenticated",
        currentUserId: USER_A,
        previousKnownUserId: USER_A,
      }),
      "none"
    )
    assert.equal(
      nextKnownSessionUserId({
        status: "loading",
        currentUserId: null,
        previousKnownUserId: USER_A,
      }),
      USER_A
    )
  })
})
