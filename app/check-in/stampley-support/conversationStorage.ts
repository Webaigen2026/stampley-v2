/**
 * Leftover helper. Do not persist Stampley transcripts in the browser.
 * Legacy user-scoped keys are discarded without being read.
 */
import { discardLegacyClientPhiKeys } from "@/lib/client-owned-storage"

export interface StoredMessage {
  id: string
  role: "user" | "assistant"
  content?: string
  data?: {
    validationText: string
    reflectionText: string
    followUpQuestion: string
    microSkill: { title: string; description: string }
    education: { title: string; description: string }
    resourceLink: string | null
  }
  timestamp: string
}

export interface StoredConversation {
  id: string
  title: string
  updatedAt: string
  messages: StoredMessage[]
}

export function getConversations(): StoredConversation[] {
  discardLegacyClientPhiKeys()
  return []
}

export function saveConversations(): void {
  discardLegacyClientPhiKeys()
}
