import type { AdminAnalyticsEngagementListItem } from "@/lib/admin-stampley-summary"

export type AdminAnalyticsDashboard = {
  overview: Record<string, unknown>
  totalParticipants: number
  preSurveyCompleted: number
  ddsCompleted: number
  withCheckins: number
  rowFiltersActive: boolean
  domainCounts: Array<{ domain: string; count: number }>
  participants: Array<Record<string, unknown>>
  highStressRows: Array<Record<string, unknown>>
  engagementRows: AdminAnalyticsEngagementListItem[]
}
