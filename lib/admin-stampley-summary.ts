export type AdminStampleySummaryDetail = {
  summary: string | null
}

export const ADMIN_ANALYTICS_ENGAGEMENT_LIST_FIELDS = [
  "id",
  "email",
  "user_message_count",
  "assistant_message_count",
  "linked_check_in_date",
  "created_at",
] as const

export const ADMIN_STAMPLEY_SUMMARY_DETAIL_FIELDS = ["summary"] as const

export type AdminAnalyticsEngagementListItem = {
  id: string
  email: string | null
  user_message_count: number
  assistant_message_count: number
  linked_check_in_date: unknown
  created_at: unknown
}

export function mapAnalyticsEngagementListRow(
  row: Record<string, unknown>
): AdminAnalyticsEngagementListItem {
  return {
    id: row.id != null ? String(row.id) : "",
    email: row.email != null ? String(row.email) : null,
    user_message_count: Number(row.user_message_count) || 0,
    assistant_message_count: Number(row.assistant_message_count) || 0,
    linked_check_in_date: row.linked_check_in_date ?? null,
    created_at: row.created_at ?? null,
  }
}

export function mapStampleySummaryDetail(summary: unknown): AdminStampleySummaryDetail {
  if (typeof summary !== "string") return { summary: null }
  const trimmed = summary.trim()
  return { summary: trimmed === "" ? null : trimmed }
}
