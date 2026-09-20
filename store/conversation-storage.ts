import {
  discardLegacyClientPhiKeys,
  LEGACY_CONVERSATIONS_STORAGE_KEY,
} from "@/lib/client-owned-storage"

export interface StoredConversation {
  id: string
  title: string
  updatedAt: string
  messages: StoredMessage[]
}

export interface StoredMessage {
  id: string
  role: "user" | "assistant"
  content?: string
  data?: StampleyResponseData
  timestamp: string
}

export interface StampleyResponseData {
  greeting?: string
  validation?: string
  reflection_question?: string
  micro_skill?: string
  education_chip?: string
  closure?: string
}

export const CONVERSATIONS_STORAGE_KEY = LEGACY_CONVERSATIONS_STORAGE_KEY

export function discardLegacyConversations(): void {
  discardLegacyClientPhiKeys()
}

export function getConversations(): StoredConversation[] {
  discardLegacyConversations()
  return []
}

export function saveConversations(_conversations: StoredConversation[]): void {
  discardLegacyConversations()
}

export function deleteConversation(): void {
  discardLegacyConversations()
}
