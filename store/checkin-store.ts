import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
  clearStorageKey,
  getBrowserSessionStorage,
  readOwnedPayload,
  wrapOwnedPayload,
} from "@/lib/client-owned-storage"
import { readSessionUserId } from "@/lib/session-user-id"

export type Domain = "Emotional" | "Regimen" | "Physician" | "Interpersonal"

export const CHECK_IN_DRAFT_KEY = "stampley-checkin-draft"

export const checkInInitialState = {
  distress: undefined as number | undefined,
  mood: undefined as number | undefined,
  energy: undefined as number | undefined,
  contextTags: [] as string[],
  reflection: "",
  copingAction: "",
  domain: null as Domain | null,
}

export interface CheckInState {
  distress: number | undefined
  mood: number | undefined
  energy: number | undefined
  contextTags: string[]
  reflection: string
  copingAction: string
  domain: Domain | null
  setDistress: (v: number) => void
  setMood: (v: number) => void
  setEnergy: (v: number) => void
  setContextTags: (tags: string[]) => void
  setReflection: (v: string) => void
  setCopingAction: (v: string) => void
  setDomain: (d: Domain) => void
  clearDomain: () => void
  reset: () => void
}

let draftOwnerUserId: string | null = null
let persistWritesEnabled = false
let ownerGeneration = 0

export function getCheckInDraftOwnerUserId(): string | null {
  return draftOwnerUserId
}

export function areCheckInPersistWritesEnabled(): boolean {
  return persistWritesEnabled
}

/** Disable persist and drop in-memory PHI without rehydrating or rewriting storage. */
export function resetCheckInSensitiveClientState(): void {
  persistWritesEnabled = false
  draftOwnerUserId = null
  ownerGeneration += 1
  useCheckInStore.setState({ ...checkInInitialState })
}

function createOwnedCheckInStorage() {
  return {
    getItem(name: string): string | null {
      const storage = getBrowserSessionStorage()
      if (!storage) return null
      let raw: string | null
      try {
        raw = storage.getItem(name)
      } catch {
        return null
      }

      const result = readOwnedPayload<unknown>({
        raw,
        currentUserId: draftOwnerUserId,
      })

      if (result.status === "ok") {
        try {
          return JSON.stringify(result.payload)
        } catch {
          clearStorageKey(storage, name)
          return null
        }
      }

      if (result.status === "rejected" && result.clear) {
        clearStorageKey(storage, name)
      }
      return null
    },
    setItem(name: string, value: string): void {
      if (!persistWritesEnabled || !draftOwnerUserId) return
      const storage = getBrowserSessionStorage()
      if (!storage) return
      let parsed: unknown
      try {
        parsed = JSON.parse(value)
      } catch {
        return
      }
      const envelope = wrapOwnedPayload(draftOwnerUserId, parsed)
      if (!envelope) return
      try {
        storage.setItem(name, JSON.stringify(envelope))
      } catch {
        // Fail closed without logging PHI.
      }
    },
    removeItem(name: string): void {
      clearStorageKey(getBrowserSessionStorage(), name)
    },
  }
}

export const useCheckInStore = create<CheckInState>()(
  persist(
    (set) => ({
      ...checkInInitialState,
      setDistress: (v) => set({ distress: v }),
      setMood: (v) => set({ mood: v }),
      setEnergy: (v) => set({ energy: v }),
      setContextTags: (tags) => set({ contextTags: tags }),
      setReflection: (v) => set({ reflection: v }),
      setCopingAction: (v) => set({ copingAction: v }),
      setDomain: (d) => set({ domain: d }),
      clearDomain: () => set({ domain: null }),
      reset: () => {
        set({ ...checkInInitialState })
        void useCheckInStore.persist.clearStorage()
      },
    }),
    {
      name: CHECK_IN_DRAFT_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => createOwnedCheckInStorage()),
      partialize: (state) => ({
        distress: state.distress,
        mood: state.mood,
        energy: state.energy,
        contextTags: state.contextTags,
        reflection: state.reflection,
        copingAction: state.copingAction,
        domain: state.domain,
      }),
    }
  )
)

export async function applyCheckInDraftOwner(
  userId: string | null
): Promise<void> {
  persistWritesEnabled = false
  const next = readSessionUserId({ user: { id: userId } })
  draftOwnerUserId = next
  const generation = ++ownerGeneration
  useCheckInStore.setState({ ...checkInInitialState })

  if (!next) {
    return
  }

  await useCheckInStore.persist.rehydrate()
  if (generation !== ownerGeneration) {
    return
  }
  persistWritesEnabled = true
}

export function resetCheckInDraftOwnerForTests(): void {
  resetCheckInSensitiveClientState()
}
