"use client"

import { IdentifiedSearchResults } from "@/components/admin/identified-search-results"
import { AnalyticsResults } from "@/components/admin/analytics/analytics-results"
import { searchAdminAnalytics } from "@/actions/admin-identified-search"
import type { AdminAnalyticsDashboard } from "@/lib/admin-analytics-dashboard"
import type { UrlSafeAnalyticsFilters } from "@/lib/admin-analytics-url"
import type { SurveyViewCapabilities } from "@/lib/admin-phi-minimization"

export function AnalyticsIdentifiedPanel({
  initial,
  caps,
  urlFilters,
  enabled,
}: {
  initial: AdminAnalyticsDashboard
  caps: SurveyViewCapabilities
  urlFilters: UrlSafeAnalyticsFilters
  enabled: boolean
}) {
  return (
    <IdentifiedSearchResults
      placeholder="Participant email"
      enabled={enabled}
      initial={initial}
      search={(q) =>
        searchAdminAnalytics({
          q,
          from: urlFilters.from,
          to: urlFilters.to,
          domain: urlFilters.domain,
          week: urlFilters.week,
          highStress: urlFilters.highStress,
        })
      }
    >
      {(data, identifiedActive) => (
        <AnalyticsResults
          data={data}
          caps={caps}
          identifiedActive={identifiedActive}
        />
      )}
    </IdentifiedSearchResults>
  )
}
