import type {
  StampleyAssistantData,
  StampleyChatMessage,
} from "@/components/admin/stampley-chats/stampley-session-card"

export type AdminStampleySessionListItem = {
  id: string
  userId: string
  email: string
  checkInDate: string | null
  domain: string | null
  stressLevel: number | null
  mood: number | null
  energy: number | null
  userMessageCount: number
  assistantMessageCount: number
  summary: string | null
  createdAt: string
}

export type AdminStampleyTranscriptDetail = {
  messages: StampleyChatMessage[]
}

export const ADMIN_STAMPLEY_SESSION_LIST_FIELDS = [
  "id",
  "userId",
  "email",
  "checkInDate",
  "domain",
  "stressLevel",
  "mood",
  "energy",
  "userMessageCount",
  "assistantMessageCount",
  "summary",
  "createdAt",
] as const

export const ADMIN_STAMPLEY_TRANSCRIPT_DETAIL_FIELDS = ["messages"] as const

const STAMPLEY_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isStampleySessionId(value: unknown): value is string {
  return typeof value === "string" && STAMPLEY_SESSION_ID_PATTERN.test(value)
}

function parseAssistantData(raw: unknown): StampleyAssistantData | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const d = raw as Record<string, unknown>
  const data: StampleyAssistantData = {}

  for (const key of [
    "greeting",
    "validation",
    "reflection_question",
    "micro_skill",
    "education_chip",
    "closure",
  ] as const) {
    const value = d[key]
    if (typeof value === "string" && value.trim()) {
      data[key] = value
    }
  }

  return Object.keys(data).length > 0 ? data : undefined
}

export function parseStoredStampleyMessages(raw: unknown): StampleyChatMessage[] {
  if (!Array.isArray(raw) || raw.length === 0) return []

  return raw.flatMap((item, index): StampleyChatMessage[] => {
    if (!item || typeof item !== "object") return []
    const m = item as Record<string, unknown>
    const role = m.role
    if (role !== "user" && role !== "assistant") return []

    return [
      {
        id: typeof m.id === "string" ? m.id : `${role}-${index}`,
        role,
        content: typeof m.content === "string" ? m.content : undefined,
        timestamp: typeof m.timestamp === "string" ? m.timestamp : undefined,
        data: role === "assistant" ? parseAssistantData(m.data) : undefined,
      },
    ]
  })
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function mapStampleySessionListRow(
  row: Record<string, unknown>
): AdminStampleySessionListItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    email: String(row.email ?? ""),
    checkInDate: row.check_in_date
      ? new Date(String(row.check_in_date)).toISOString()
      : null,
    domain: row.domain != null ? String(row.domain) : null,
    stressLevel: optionalNumber(row.stress_level),
    mood: optionalNumber(row.mood),
    energy: optionalNumber(row.energy),
    userMessageCount: Number(row.user_message_count ?? 0),
    assistantMessageCount: Number(row.assistant_message_count ?? 0),
    summary: row.summary != null ? String(row.summary) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }
}

export function mapStampleyTranscriptDetail(
  rawMessages: unknown
): AdminStampleyTranscriptDetail {
  return {
    messages: parseStoredStampleyMessages(rawMessages),
  }
}
